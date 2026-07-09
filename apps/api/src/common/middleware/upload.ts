import fs from "node:fs";
import path from "node:path";

import multer from "multer";

import { env } from "../../config/env.js";
// import { AppError } from "../errors/app-error.js";
import { AppError } from "../errors/app-errors.js";
const uploadDirectory = path.resolve(env.UPLOAD_DIR);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (_request, file, callback) => {
    const safeOriginalName = file.originalname.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

    callback(
      null,
      `${Date.now()}-${crypto.randomUUID()}-${safeOriginalName}`
    );
  }
});

export const uploadDocument = multer({
  storage,

  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024
  },

  fileFilter: (_request, file, callback) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png"
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      callback(
        new AppError(
          "Only PDF, JPEG, and PNG files are allowed",
          400,
          "INVALID_FILE_TYPE"
        )
      );

      return;
    }

    callback(null, true);
  }
});