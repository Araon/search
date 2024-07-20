import "express-async-errors";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";

import { isProd, NODE_ENV, PORT, MONGO_DB_URI } from "./config.js";
import { errorHandler, unknownEndpoint, limiter } from "./utils/middleware.js";

import path, { dirname } from "path";
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import animeRouter from "./routes/anime.routes.js";
import Chroma from "./utils/chroma.js";

const startServer = async () => {
  const app = express();

  console.debug("NODE_ENV", NODE_ENV);

  app.use(limiter(15, 200));
  app.use(express.json());
  app.use(
    express.urlencoded({
      extended: false,
    })
  );
  //CROS config
  app.use(
    cors({
      origin: "http://localhost:3030",
      credentials: true,
    })
  );
  app.use(morgan(!isProd ? "tiny" : "dev"));
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          imgSrc: [
            "'self'",
            "data:",
            "https://via.placeholder.com",
            "https://m.media-amazon.com",
            "https://cdn.myanimelist.net",
            "https://cdn.anisearch.com",
            "https://cdn.anime-planet.com",
            "https://media.kitsu.io",
            "https://media.animevice.com",
            "https://raw.githubusercontent.com"
          ],
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", "https://us.i.posthog.com"],
        },
      },
    })
  );
  try {
    await Chroma.initWRetry();
  } catch (e) {
    console.log(e);
    console.log(`Could not connect to chromaDB. Err: ${e?.message}`);
  }

  mongoose
    .connect(MONGO_DB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => {
      console.log("Error connecting to MongoDB:", err.message);
      console.log("Shutting down the server");
      process.exit(0);
    });

  app.get("/stats", (_, res) => {
    res.status(200).json({ success: true });
  });

  app.use("/api/animes", animeRouter);

  if (isProd) {
    console.log("📂 Serving static files");
    // Serve frontend files
    app.use(express.static(path.join(__dirname, "./client/build")));

    // Catch all other routes and serve frontend
    app.get("*", (_, res) => {
      res.sendFile(path.join(__dirname, "./client/build/index.html"));
    });
  }

  app.use(errorHandler);
  app.use(unknownEndpoint);

  app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
  });
};

startServer();
