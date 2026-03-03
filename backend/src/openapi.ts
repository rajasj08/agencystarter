import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { API_VERSION } from "./config/version.js";

const cwd = process.cwd();
const distPath = join(cwd, "dist", "openapi.json");
const srcPath = join(cwd, "src", "openapi.json");
const pathToJson = existsSync(distPath) ? distPath : srcPath;
const specJson = JSON.parse(readFileSync(pathToJson, "utf-8")) as { info: { version?: string }; paths: unknown; servers: unknown; openapi: string; components: unknown };
const spec = { ...specJson, info: { ...specJson.info, version: API_VERSION } };

/**
 * OpenAPI 3.0 spec for Swagger UI. Edit openapi.json to add paths.
 * See docs/api.md for full endpoint list.
 */
export const openApiSpec = spec;
