import { Router } from "express";
import { 
  bulkDeleteTransactionController, 
  bulkTransactionController, 
  createTransactionController, 
  deleteTransactionController, 
  duplicateTransactionController, 
  getAllTransactionController,
  getTransactionByIdController, 
  updateTransactionController,
  scanReceiptController
} from "../controllers/transaction.controller";
import { upload } from "../config/cloudinary.config";

const transactionRoutes = Router();

// Receipt scanning - Must be before other routes to avoid conflicts
transactionRoutes.post(
  "/scan-receipt",
  upload.single("receipt"),
  scanReceiptController
);

// Transaction CRUD operations
transactionRoutes.post("/create", createTransactionController);
transactionRoutes.post("/bulk-transaction", bulkTransactionController);
transactionRoutes.get("/all", getAllTransactionController);
transactionRoutes.get("/:id", getTransactionByIdController);
transactionRoutes.put("/duplicate/:id", duplicateTransactionController);
transactionRoutes.put("/update/:id", updateTransactionController);
transactionRoutes.delete("/delete/:id", deleteTransactionController);
transactionRoutes.delete("/bulk-delete", bulkDeleteTransactionController);

export default transactionRoutes;