/**
 * ESM loader hook for Node 24+ that resolves extensionless TS imports.
 * Register via: import {register} from 'node:module'; register('./ts-resolve.mjs', import.meta.url)
 *
 * When Node tries to resolve "./supabase" from a .ts file, it normally fails
 * because there's no .ts extension. This hook appends ".ts" and retries.
 */

import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

export async function resolve(specifier, context, nextResolve) {
  // Only intercept relative imports that have no extension
  if (specifier.startsWith(".") && !path.extname(specifier)) {
    const parentDir = context.parentURL
      ? path.dirname(fileURLToPath(context.parentURL))
      : process.cwd();
    const candidate = path.resolve(parentDir, specifier + ".ts");
    if (existsSync(candidate)) {
      return nextResolve(pathToFileURL(candidate).href, context);
    }
  }
  return nextResolve(specifier, context);
}
