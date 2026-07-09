import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  fileURLToPath
} from "node:url";

import multer from "multer";
import { AppError } from "../../common/errors/app-errors.js";

import { env } from "../../config/env.js";

const currentFilePath =
  fileURLToPath(import.meta.url);

const currentDirectory =
  path.dirname(currentFilePath);

/*
  Current file:
  apps/api/src/modules/onboarding/...

  ../../.. resolves to apps/api
*/
const apiRootPath = path.resolve(
  currentDirectory,
  "../../.."
);

const onboardingUploadDirectory = path.resolve(
  apiRootPath,
  env.UPLOAD_DIR,
  "onboarding"
);

fs.mkdirSync(onboardingUploadDirectory, {
  recursive: true
});

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg"
]);

const storage = multer.diskStorage({
  destination: (
    _request,
    _file,
    callback
  ) => {
    callback(
      null,
      onboardingUploadDirectory
    );
  },

  filename: (
    _request,
    file,
    callback
  ) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const safeFilename = [
      Date.now(),
      randomUUID()
    ].join("-");

    callback(
      null,
      `${safeFilename}${extension}`
    );
  }
});

export const onboardingDocumentUpload =
  multer({
    storage,

    limits: {
      files: 1,

      fileSize:
        env.MAX_UPLOAD_SIZE_MB *
        1024 *
        1024
    },

    fileFilter: (
      _request,
      file,
      callback
    ) => {
      if (
        !allowedMimeTypes.has(file.mimetype)
      ) {
        callback(
          new AppError(
            "Only PDF, PNG, JPG and JPEG files are allowed",
            400,
            "INVALID_ONBOARDING_FILE_TYPE"
          )
        );

        return;
      }

      callback(null, true);
    }
  });

export function getStoredUploadPath(
  absoluteFilePath: string
): string {
  return path
    .relative(
      apiRootPath,
      absoluteFilePath
    )
    .replaceAll("\\", "/");
}