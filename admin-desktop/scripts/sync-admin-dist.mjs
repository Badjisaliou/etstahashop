import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.resolve(__dirname, "..", "..", "admin", "dist");
const target = path.resolve(__dirname, "..", "web-dist");

if (!existsSync(source)) {
  console.error("Build admin introuvable. Lancez d'abord `npm --prefix ../admin run build`.");
  process.exit(1);
}

if (existsSync(target)) {
  rmSync(target, { recursive: true, force: true });
}

mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });

console.log("web-dist synchronise depuis admin/dist.");
