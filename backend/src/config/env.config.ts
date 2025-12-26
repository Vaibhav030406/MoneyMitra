import { getEnv } from "../utils/get-env";
const envconfig = () => ({
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: parseInt(getEnv("PORT", "8000"), 10),
  BASE_PATH: getEnv("BASE_PATH", "/api"),
  MONGO_URI: getEnv("MONGO_URI"),

  JWT_SECRET: getEnv("JWT_SECRET", "your_jwt_secret"),
  JWT_EXPIRES_IN: getEnv("JWT_EXPIRES_IN", "7d"),

  JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET", "your_jwt_refresh_secret"),
  JWT_REFRESH_EXPIRES_IN: getEnv("JWT_REFRESH_EXPIRES_IN", "30d"),

  GEMINI_API_KEY: getEnv("GEMINI_API_KEY", ""),
  CLOUDINARY_CLOUD_NAME: getEnv("CLOUDINARY_CLOUD_NAME", ""),
  CLOUDINARY_API_KEY: getEnv("CLOUDINARY_API_KEY", ""),
  CLOUDINARY_API_SECRET: getEnv("CLOUDINARY_API_SECRET", ""),
  CRON_SECRET: getEnv("CRON_SECRET", "your_cron_secret"),
  FRONTEND_URL: getEnv("FRONTEND_URL", "http://localhost:5173"),
});

export const Env = envconfig();
