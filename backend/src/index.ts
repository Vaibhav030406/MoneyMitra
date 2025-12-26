import "dotenv/config";
import "./config/passport.config";
import express from "express";
import cors from "cors";
import passport from "passport";
import { Env } from "./config/env.config";
import { HTTPSTATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { Request, Response, NextFunction } from "express";
import { BadRequestException } from "./utils/app-error";
import connectDatabase from "./config/database.config";
import authRoutes from "./routes/auth.routes";
import { passportAuthenticateJwt } from "./config/passport.config";
import  userRoutes  from "./routes/user.routes";
import transactionRoutes from "./routes/transaction.routes";
const BASE_PATH = Env.BASE_PATH || "/api/v1";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(
  cors({
    origin: Env.FRONTEND_URL,
    credentials: true,
  })
);

app.get(
  "/",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    throw new BadRequestException("This is a test error");
    res.status(HTTPSTATUS.OK).json({
      message: "Hello Subcribe to the channel",
    });
  })
);
// ❗ MUST BE LAST

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, passportAuthenticateJwt, userRoutes);
app.use(`${BASE_PATH}/transactions`, passportAuthenticateJwt, transactionRoutes);

app.use(errorHandler);

app.listen(Env.PORT, async () => {
  await connectDatabase();
  console.log(`🚀 Server running on port ${Env.PORT}`);
});
