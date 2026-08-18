import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import Fastify from "fastify";
import { config } from "../config/env.js";
import { registerHealthRoutes } from "../routes/health.js";

export async function buildServer() {
  const server = Fastify({
    bodyLimit: 32_768,
    logger: true
  });

  await server.register(helmet);
  await server.register(cors, {
    origin: config.clientOrigin
  });

  await registerHealthRoutes(server);

  return server;
}
