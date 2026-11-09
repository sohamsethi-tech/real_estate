import path from "node:path";
import { existsSync } from "node:fs";
import EmbeddedPostgres from "embedded-postgres";
import { config } from "./config.js";

let started = false;

export async function startEmbedded() {
  if (!config.EMBEDDED_POSTGRES || started) return;
  const databaseDir = path.resolve(config.EMBEDDED_DATA_DIR);
  const pg = new EmbeddedPostgres({
    databaseDir,
    user: "postgres",
    password: "postgres",
    port: config.EMBEDDED_PORT,
    persistent: true,
  });
  if (!existsSync(path.join(databaseDir, "PG_VERSION"))) await pg.initialise();
  await pg.start();
  try {
    await pg.createDatabase("vgroup");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists/i.test(message)) throw error;
  }
  started = true;
  const stop = async () => {
    await pg.stop().catch(() => undefined);
  };
  process.once("SIGINT", () => { void stop().finally(() => process.exit(0)); });
  process.once("SIGTERM", () => { void stop().finally(() => process.exit(0)); });
}
