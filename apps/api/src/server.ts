import { createApp } from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";

async function startServer() {
  try {
    // Connect to database first
    await connectDB();

    // Then start the server
    const app = createApp();
    app.listen(env.PORT, () => {
      console.log(`API running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
