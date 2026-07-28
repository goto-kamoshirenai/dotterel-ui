import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(projectRoot, "dist");
const expectedOutputDirectory = resolve(projectRoot, "dist");

if (outputDirectory !== projectRoot && outputDirectory === expectedOutputDirectory) {
  await rm(outputDirectory, { force: true, recursive: true });
}
