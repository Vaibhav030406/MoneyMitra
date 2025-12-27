import axios from "axios";
import TransactionModel, { TransactionTypeEnum } from "../models/transaction.model";
import { BadRequestException, NotFoundException } from "../utils/app-error";
import { calculateNextOccurrence } from "../utils/helper";
import { CreateTransactionType, UpdateTransactionType } from "../validators/transaction.validator";
import { Env } from "../config/env.config";

export const createTransactionService = async (
  body: CreateTransactionType,
  userId: string
) => {
  let nextRecurringDate: Date | undefined;
  const currentDate = new Date();

  if (body.isRecurring && body.recurringInterval) {
    const calulatedDate = calculateNextOccurrence(
      body.date,
      body.recurringInterval
    );

    nextRecurringDate =
      calulatedDate < currentDate
        ? calculateNextOccurrence(currentDate, body.recurringInterval)
        : calulatedDate;
  }

  const transaction = await TransactionModel.create({
    ...body,
    userId,
    category: body.category,
    amount: Number(body.amount),
    isRecurring: body.isRecurring || false,
    recurringInterval: body.recurringInterval || null,
    nextRecurringDate,
    lastProcessed: null,
  });

  return transaction;
};

export const getAllTransactionService = async (
  userId: string,
  filters: {
    keyword?: string;
    type?: keyof typeof TransactionTypeEnum;
    recurringStatus?: "RECURRING" | "NON_RECURRING";
  },
  pagination: {
    pageSize: number;
    pageNumber: number;
  }
) => {
  const { keyword, type, recurringStatus } = filters;

  const filterConditions: Record<string, any> = {
    userId,
  };

  if (keyword) {
    filterConditions.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { category: { $regex: keyword, $options: "i" } },
    ];
  }

  if (type) {
    filterConditions.type = type;
  }

  if (recurringStatus) {
    if (recurringStatus === "RECURRING") {
      filterConditions.isRecurring = true;
    } else if (recurringStatus === "NON_RECURRING") {
      filterConditions.isRecurring = false;
    }
  }

  const { pageSize, pageNumber } = pagination;
  const skip = (pageNumber - 1) * pageSize;

  const [transations, totalCount] = await Promise.all([
    TransactionModel.find(filterConditions)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 }),
    TransactionModel.countDocuments(filterConditions),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    transations,
    pagination: {
      pageSize,
      pageNumber,
      totalCount,
      totalPages,
      skip,
    },
  };
};

export const getTransactionByIdService = async (
  userId: string,
  transactionId: string
) => {
  const transaction = await TransactionModel.findOne({
    _id: transactionId,
    userId,
  });
  if (!transaction) throw new NotFoundException("Transaction not found");

  return transaction;
};

export const duplicateTransactionService = async (
  userId: string,
  transactionId: string
) => {
  const transaction = await TransactionModel.findOne({
    _id: transactionId,
    userId,
  });
  if (!transaction) throw new NotFoundException("Transaction not found");

  const duplicated = await TransactionModel.create({
    ...transaction.toObject(),
    _id: undefined,
    title: `Duplicate - ${transaction.title}`,
    description: transaction.description
      ? `${transaction.description} (Duplicate)`
      : "Duplicated transaction",
    isRecurring: false,
    recurringInterval: undefined,
    nextRecurringDate: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  });

  return duplicated;
};

export const updateTransactionService = async (
  userId: string,
  transactionId: string,
  body: UpdateTransactionType
) => {
  const existingTransaction = await TransactionModel.findOne({
    _id: transactionId,
    userId,
  });
  if (!existingTransaction)
    throw new NotFoundException("Transaction not found");

  const now = new Date();
  const isRecurring = body.isRecurring ?? existingTransaction.isRecurring;

  const date =
    body.date !== undefined ? new Date(body.date) : existingTransaction.date;

  const recurringInterval =
    body.recurringInterval || existingTransaction.recurringInterval;

  let nextRecurringDate: Date | undefined;

  if (isRecurring && recurringInterval) {
    const calulatedDate = calculateNextOccurrence(date, recurringInterval);

    nextRecurringDate =
      calulatedDate < now
        ? calculateNextOccurrence(now, recurringInterval)
        : calulatedDate;
  }

  existingTransaction.set({
    ...(body.title && { title: body.title }),
    ...(body.description && { description: body.description }),
    ...(body.category && { category: body.category }),
    ...(body.type && { type: body.type }),
    ...(body.paymentMethod && { paymentMethod: body.paymentMethod }),
    ...(body.amount !== undefined && { amount: Number(body.amount) }),
    date,
    isRecurring,
    recurringInterval,
    nextRecurringDate,
  });

  await existingTransaction.save();

  return;
};

export const deleteTransactionService = async (
  userId: string,
  transactionId: string
) => {
  const deleted = await TransactionModel.findByIdAndDelete({
    _id: transactionId,
    userId,
  });
  if (!deleted) throw new NotFoundException("Transaction not found");

  return;
};

export const bulkDeleteTransactionService = async (
  userId: string,
  transactionIds: string[]
) => {
  const result = await TransactionModel.deleteMany({
    _id: { $in: transactionIds },
    userId,
  });

  if (result.deletedCount === 0)
    throw new NotFoundException("No transations found");

  return {
    sucess: true,
    deletedCount: result.deletedCount,
  };
};

export const bulkTransactionService = async (
  userId: string,
  transactions: CreateTransactionType[]
) => {
  try {
    const bulkOps = transactions.map((tx) => ({
      insertOne: {
        document: {
          ...tx,
          userId,
          isRecurring: false,
          nextRecurringDate: null,
          recurringInterval: null,
          lastProcesses: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    }));

    const result = await TransactionModel.bulkWrite(bulkOps, {
      ordered: true,
    });

    return {
      insertedCount: result.insertedCount,
      success: true,
    };
  } catch (error) {
    throw error;
  }
};

export const scanReceiptService = async (
  file: Express.Multer.File | undefined
) => {
  if (!file) throw new BadRequestException("No file uploaded");
  
  try {
    if (!file.path) throw new BadRequestException("Failed to upload file");
    
    console.log("Processing receipt:", file.path);
    
    // Fetch the image from Cloudinary
    const responseData = await axios.get(file.path, {
      responseType: "arraybuffer",
    });
    
    const base64String = Buffer.from(responseData.data).toString("base64");
    if (!base64String) throw new BadRequestException("Could not process file");
    
    // Create the image URL for OpenRouter
    const imageUrl = `data:${file.mimetype};base64,${base64String}`;
    
    // Call OpenRouter API
    const completion = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this receipt image and extract the following information in JSON format:
{
  "title": "Brief description of the purchase",
  "amount": number (total amount paid),
  "date": "ISO 8601 date string (YYYY-MM-DD)",
  "description": "Additional details about the transaction",
  "category": "Category of expense (e.g., Food, Transportation, Shopping, etc.)",
  "paymentMethod": "One of: CASH, CARD, BANK_TRANSFER, MOBILE_PAYMENT, AUTO_DEBIT, OTHER",
  "type": "EXPENSE or INCOME"
}

Important:
- Extract the total amount paid
- Parse the date from the receipt
- Infer an appropriate category
- Default type to "EXPENSE" unless clearly an income receipt
- Default paymentMethod to "CARD" if not clear
- Provide a brief title summarizing the purchase

Return ONLY valid JSON, no additional text.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Authorization": `Bearer ${Env.OPEN_ROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": Env.SITE_URL || "http://localhost:3000",
          "X-Title": Env.SITE_NAME || "Receipt Scanner"
        }
      }
    );
    
    const responseText = completion.data.choices[0].message.content;
    if (!responseText) {
      return {
        error: "Could not read receipt content"
      };
    }
    
    // Parse the JSON response
    const cleanedText = responseText.replace(/```(?:json)?\n?/g, "").trim();
    const data = JSON.parse(cleanedText);
    
    // Validate required fields
    if (!data.amount || !data.date) {
      return { 
        error: "Receipt missing required information (amount or date)" 
      };
    }
    
    return {
      title: data.title || "Receipt",
      amount: Number(data.amount),
      date: data.date,
      description: data.description || "",
      category: data.category || "Other",
      paymentMethod: data.paymentMethod || "CARD",
      type: data.type || "EXPENSE",
      receiptUrl: file.path,
    };
    
  } catch (error: any) {
    console.error("Receipt scanning error:", error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return { error: "Invalid API key for receipt scanning service" };
    }
    
    if (error.response?.status === 429) {
      return { error: "Rate limit exceeded. Please try again later." };
    }
    
    return { 
      error: "Receipt scanning service unavailable. Please try again." 
    };
  }
};