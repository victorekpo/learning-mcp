import path from "node:path";
import { fileURLToPath } from "node:url";

export const workspace = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../workspace"
);
