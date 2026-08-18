type AppConfig = {
  clientOrigin: string;
  host: string;
  port: number;
};

function readPort(value: string | undefined): number {
  if (!value) {
    return 4000;
  }

  const port = Number.parseInt(value, 10);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return port;
}

export const config: AppConfig = {
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  host: process.env.HOST ?? "127.0.0.1",
  port: readPort(process.env.PORT)
};
