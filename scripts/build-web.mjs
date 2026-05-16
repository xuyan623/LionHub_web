import { build } from "esbuild";
import { brotliCompressSync, constants as zlibConstants, gzipSync } from "node:zlib";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const frontendDir = path.join(projectRoot, "frontend");
const distDir = path.join(projectRoot, "dist");
const distAssetsDir = path.join(distDir, "assets");
const checkOnly = process.argv.includes("--check");

const indexTemplate = await readFile(path.join(frontendDir, "index.html"), "utf8");
const swTemplate = await readFile(path.join(frontendDir, "sw.js"), "utf8");
const versionMatch = indexTemplate.match(/var BUILD_VERSION\s*=\s*'([^']+)'/);
const buildVersion = versionMatch?.[1] || new Date().toISOString().replace(/[-:.TZ]/g, "");

if (!checkOnly) {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distAssetsDir, { recursive: true });
}

const buildResult = await build({
  absWorkingDir: projectRoot,
  bundle: true,
  chunkNames: "chunks/[name]-[hash]",
  entryNames: "[name]-[hash]",
  entryPoints: {
    bootstrap: "frontend/app.js",
    styles: "frontend/bundle.css",
  },
  format: "esm",
  logLevel: "info",
  metafile: true,
  outdir: distAssetsDir,
  platform: "browser",
  splitting: true,
  target: ["es2020"],
  write: !checkOnly,
});

const outputEntries = Object.entries(buildResult.metafile.outputs);
const bootstrapAsset = findOutputForEntry(outputEntries, "frontend/app.js", ".js");
const styleAsset = findOutputForEntry(outputEntries, "frontend/bundle.css", ".css");

if (!bootstrapAsset || !styleAsset) {
  throw new Error("构建产物不完整：未找到 bootstrap JS 或 CSS 入口。");
}

const publicBootstrapPath = toPublicPath(bootstrapAsset);
const publicStylePath = toPublicPath(styleAsset);
const staticAssets = ["/", "/index.html", publicBootstrapPath, publicStylePath];

const builtIndex = indexTemplate
  .replace(/__APP_CSS__/g, publicStylePath)
  .replace(/__BOOTSTRAP_JS__/g, publicBootstrapPath);

const builtSw = swTemplate
  .replace(/"__BUILD_VERSION__"/g, JSON.stringify(buildVersion))
  .replace(/__STATIC_ASSETS__/g, JSON.stringify(staticAssets, null, 2));

if (!checkOnly) {
  await writeFile(path.join(distDir, "index.html"), builtIndex, "utf8");
  await writeFile(path.join(distDir, "sw.js"), builtSw, "utf8");
  await writeFile(
    path.join(distDir, "manifest.json"),
    JSON.stringify(
      {
        buildVersion,
        bootstrap: publicBootstrapPath,
        style: publicStylePath,
      },
      null,
      2
    ),
    "utf8"
  );
  await writeCompressedAssets(distDir);
}

function findOutputForEntry(entries, entryPoint, extension) {
  const match = entries.find(([, meta]) => meta.entryPoint === entryPoint && meta.bytes > 0);
  if (!match) {
    return "";
  }
  const [outputPath] = match;
  if (!outputPath.endsWith(extension)) {
    return "";
  }
  return outputPath;
}

function toPublicPath(outputPath) {
  const relativePath = path.relative(distDir, outputPath).split(path.sep).join("/");
  return `/${relativePath}`;
}

async function writeCompressedAssets(rootDir) {
  for (const filePath of await collectFiles(rootDir)) {
    if (!shouldCompressFile(filePath)) {
      continue;
    }
    const contents = await readFile(filePath);
    await writeFile(`${filePath}.gz`, gzipSync(contents, { level: 9 }));
    await writeFile(
      `${filePath}.br`,
      brotliCompressSync(contents, {
        params: {
          [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
        },
      })
    );
  }
}

async function collectFiles(dirPath) {
  const entries = await readdir(dirPath);
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const entryStat = await stat(fullPath);
    if (entryStat.isDirectory()) {
      files.push(...await collectFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function shouldCompressFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return [".css", ".html", ".js", ".json", ".map", ".svg", ".txt"].includes(extension);
}
