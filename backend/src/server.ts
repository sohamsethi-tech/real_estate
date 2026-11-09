import { config } from "./config.js";
import { startEmbedded } from "./embedded.js";
import { createApp } from "./app.js";

if (config.EMBEDDED_POSTGRES) await startEmbedded();
const app = createApp();
app.listen(config.PORT, () => console.log(`API listening on ${config.PORT}`));
