import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttpModule from "pino-http";
import { approvalRouter } from "./modules/approvals/approval.routes.js";
import { auditRouter } from "./modules/audit/audit.routes.js";
import { onboardingRouter } from "./modules/onboarding/onboarding.routes.js";
import { errorHandler } from "./common/middleware/error-handler.js";
import { notFoundHandler } from "./common/middleware/not-found.js";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { partyRouter } from "./modules/parties/party.routes.js";
import { visitPlanRouter } from "./modules/visit-plans/visit-plan.routes.js";
import { visitReportRouter } from "./modules/visit-reports/visit-report.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { registerRouter } from "./modules/registers/register.routes.js";
import { activityRouter } from "./modules/activities/activity.routes.js";
export const app = express();
const pinoHttp =
  pinoHttpModule as unknown as () => import("express").RequestHandler;
app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }),
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
  }),
);

app.use(pinoHttp());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/v1/health", (_request, response) => {
  response.status(200).json({
    success: true,
    data: {
      status: "healthy",
      service: "mivaan-api",
      timestamp: new Date().toISOString(),
    },
  });
});

// Mount only completed routers
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/parties", partyRouter);
app.use("/api/v1/visit-plans", visitPlanRouter);
app.use("/api/v1/visit-reports", visitReportRouter);
app.use("/api/v1/onboarding", onboardingRouter);
app.use("/api/v1/approvals", approvalRouter);
app.use("/api/v1/approvals", approvalRouter);
app.use("/api/v1/audit", auditRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/registers", registerRouter);
app.use("/api/v1/activities", activityRouter);
// These must always come after all routers
app.use(notFoundHandler);
app.use(errorHandler);
