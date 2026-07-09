// import mongoose from "mongoose";
// import { env } from "./env.js";

// export async function connectDatabase(): Promise<void> {
//   mongoose.set("strictQuery", true);

//   await mongoose.connect(env.MONGODB_URI);

//   console.log("MongoDB connected");
// }

// export async function disconnectDatabase(): Promise<void> {
//   await mongoose.disconnect();
// }
import mongoose from "mongoose";

import { env } from "./env.js";

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set("strictQuery", true);

    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000
    });

    console.log(
      `MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`
    );
  } catch (error: unknown) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log("MongoDB disconnected");
}

mongoose.connection.on("error", (error: unknown) => {
  console.error("MongoDB runtime error:", error);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB connection lost");
});