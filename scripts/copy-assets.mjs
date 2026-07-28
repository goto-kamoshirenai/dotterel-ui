import { copyFile, cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(projectRoot, "dist");

await mkdir(outputDirectory, { recursive: true });
await copyFile(resolve(projectRoot, "src", "styles.css"), resolve(outputDirectory, "styles.css"));
await cp(resolve(projectRoot, "src", "fonts"), resolve(outputDirectory, "fonts"), {
  recursive: true,
});
