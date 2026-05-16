import { build } from "esbuild";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const distAssetsDir = path.join(distDir, "assets");
const checkOnly = process.argv.includes("--check");

const indexTemplate = await readFile(path.join(projectRoot, "index.html"), "utf8");
const swTemplate = await readFile(path.join(projectRoot, "sw.js"), "utf8");
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
    bootstrap: "app.js",
    styles: "bundle.css",
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
const bootstrapAsset = findOutputForEntry(outputEntries, "app.js", ".js");
const styleAsset = findOutputForEntry(outputEntries, "bundle.css", ".css");

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
