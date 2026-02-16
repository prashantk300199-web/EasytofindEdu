import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import env from "./src/config/env.js";

const attemptListen = (port) =>
  new Promise((resolve, reject) => {
    const server = app
      .listen(port)
      .on("listening", () => resolve(server))
      .on("error", (err) => reject(err));

    // Configure timeouts for large file uploads
    // Set socket timeout to 5 minutes (300 seconds)
    // This allows time for 5 × 10MB files to upload
    server.setTimeout(300000); // 5 minutes
    server.keepAliveTimeout = 65000; // Keep-alive timeout for socket compat
  });

const startServer = async () => {
  await connectDB();

  const basePort = Number(env.port) || 5000;
  const maxAttempts = 11; // try basePort .. basePort+10
  let port = basePort;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await attemptListen(port);
      console.log(`Server running on port ${port} in ${env.nodeEnv} mode`);
      return;
    } catch (err) {
      if (err && err.code === "EADDRINUSE") {
        console.warn(`Port ${port} is in use, trying ${port + 1}...`);
        port += 1;
        continue;
      }
      console.error("Failed to start server:", err);
      process.exit(1);
    }
  }

  console.error(`All ports ${basePort}..${port} are in use. Please free a port or set a different PORT.`);
  process.exit(1);
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});