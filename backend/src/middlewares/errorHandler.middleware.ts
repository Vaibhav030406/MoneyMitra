import { ErrorRequestHandler } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { AppError } from "../utils/app-error";
import { ZodError } from "zod";
import Module from "module";
import { ErrorCodeEnum } from "../enums/error-code-enum";
import { MulterError } from "multer";
import { Response } from "express-serve-static-core";

const handleMulterError = (error: MulterError) => {
  const messages = {
    LIMIT_UNEXPECTED_FILE: "Invalid file field name. Please use 'file'",
    LIMIT_FILE_SIZE: "File size exceeds the limit",
    LIMIT_FILE_COUNT: "Too many files uploaded",
    default: "File upload error",
  };

  return {
    status: HTTPSTATUS.BAD_REQUEST,
    message: messages[error.code as keyof typeof messages] || messages.default,
    error: error.message,
  };
};


export const errorHandler:ErrorRequestHandler = (err, req, res, next) => {
    console.error("Error occured on PATH:",req.path);

    if(err instanceof ZodError){
        return formatZodError(err,res);
    }
      if (err instanceof MulterError) {
    const { status, message, error: errorMessage } = handleMulterError(err);
    return res.status(status).json({
      message,
      error: errorMessage,
      errorCode: ErrorCodeEnum.FILE_UPLOAD_ERROR,
    });
  }
    if(err instanceof AppError){
        return res.status(err.statusCode).json({
            message: err.message,
            errorCode: err.errorCode,
        });
    }
    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message:"Internal Server Error",
        error: err?.message || "Unknown error",
    });
}

function formatZodError(err: ZodError<any>, res: Response<any, Record<string, any>, number>): unknown {
    throw new Error("Function not implemented.");
}
