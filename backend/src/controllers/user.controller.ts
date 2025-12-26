import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { findByIdUserService } from "../services/user.service";

export const getCurrentUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const user = await findByIdUserService(userId);
    return res.status(200).json({
      message: "User fetched successfully",
      data: user,
    });
  });