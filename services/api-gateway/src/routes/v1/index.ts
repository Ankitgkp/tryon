/**
 * V1 route aggregator.
 * Registers all /v1/* routes under a common prefix.
 */

import type { FastifyInstance } from "fastify";
import { tryonRoute } from "./tryon.js";
import { uploadImageRoute } from "./upload-image.js";
import { usageRoute } from "./usage.js";

export async function v1Routes(app: FastifyInstance): Promise<void> {
  await app.register(tryonRoute);
  await app.register(uploadImageRoute);
  await app.register(usageRoute);
}
