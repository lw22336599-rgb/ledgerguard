import { app } from "../src/app.js";
import { getRequestListener } from "@hono/node-server";

export default getRequestListener(app.fetch.bind(app));
