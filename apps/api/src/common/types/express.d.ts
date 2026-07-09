import type { UserRole } from "./workflow-enums.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tenantId: string;
        role: UserRole;
        email: string;
      };
    }
  }
}

export {};