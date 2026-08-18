import { config } from "./config/env.js";
import { buildServer } from "./lib/server.js";

const server = await buildServer();

try {
  await server.listen({ host: config.host, port: config.port });
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
