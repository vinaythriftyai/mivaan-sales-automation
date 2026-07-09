// import "dotenv/config";
// import { z } from "zod";

// const envSchema = z.object({
//   NODE_ENV: z
//     .enum(["development", "test", "production"])
//     .default("development"),

//   PORT: z.coerce.number().int().positive().default(4000),

//   MONGODB_URI: z.string().min(1),

//   CLIENT_ORIGIN: z.string().url(),

//   JWT_SECRET: z.string().min(32),
//   JWT_EXPIRES_IN: z.string().default("8h"),

//   UPLOAD_DIR: z.string().default("uploads"),
//   MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(10),

//   AUTH_PROVIDER: z.enum(["local", "mock"]).default("local"),
//   OCR_PROVIDER: z.enum(["mock", "real"]).default("mock"),
//   GST_PROVIDER: z.enum(["mock", "real"]).default("mock"),
//   MCA_PROVIDER: z.enum(["mock", "real"]).default("mock"),
//   ERP_PROVIDER: z.enum(["mock", "real"]).default("mock"),
//   NOTIFICATION_PROVIDER: z.enum(["mock", "real"]).default("mock"),
//   AI_PROVIDER: z.enum(["mock", "real"]).default("mock")
// });

// const parsed = envSchema.safeParse(process.env);

// if (!parsed.success) {
//   console.error("Invalid environment configuration:");
//   console.error(parsed.error.flatten().fieldErrors);
//   process.exit(1);
// }

// export const env = parsed.data;
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(4000),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  CLIENT_ORIGIN: z
    .string()
    .url("CLIENT_ORIGIN must be a valid URL"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must contain at least 32 characters"),

  JWT_EXPIRES_IN: z.string().default("8h"),

  DEFAULT_TENANT_ID: z
    .string()
    .regex(
      /^[a-fA-F0-9]{24}$/,
      "DEFAULT_TENANT_ID must be a valid MongoDB ObjectId"
    ),

  UPLOAD_DIR: z.string().default("uploads"),

  MAX_UPLOAD_SIZE_MB: z.coerce
    .number()
    .positive()
    .default(10),

  AUTH_PROVIDER: z
    .enum(["local", "mock"])
    .default("local"),

  OCR_PROVIDER: z
    .enum(["mock", "real"])
    .default("mock"),

  GST_PROVIDER: z
    .enum(["mock", "real"])
    .default("mock"),

  MCA_PROVIDER: z
    .enum(["mock", "real"])
    .default("mock"),

  ERP_PROVIDER: z
    .enum(["mock", "real"])
    .default("mock"),

  NOTIFICATION_PROVIDER: z
    .enum(["mock", "real"])
    .default("mock"),

  AI_PROVIDER: z
    .enum(["mock", "real"])
    .default("mock")
});

const parsedEnvironment = envSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error("Invalid environment configuration:");

  console.error(
    parsedEnvironment.error.flatten().fieldErrors
  );

  process.exit(1);
}

// This named export is required by authenticate.ts,
// database.ts, server.ts and auth.service.ts.
export const env = parsedEnvironment.data;