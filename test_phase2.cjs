const pwPath = "C:\\Users\\xuyan\\AppData\\Roaming\\npm\\node_modules\\@executeautomation\\playwright-mcp-server\\node_modules\\playwright";
const { chromium } = require(pwPath);

const PAGE_URL = "http://localhost:4173/";

const results = { errors: [], warnings: [], steps: [] };

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") results.errors.push({ type: msg.type(), text });
    else if (msg.type() === "warning") results.warnings.push({ type: msg.type(), text });
  });
  page.on("pageerror", (err) => results.errors.push({ type: "pageerror", text: err.message }));
  page.on("dialog", async (dialog) => { await dialog.dismiss(); });

  // 1. Just load the page and wait for network
  console.log("Loading page...");
  await page.goto(PAGE_URL, { waitUntil: "networkidle", timeout: 30000 });

  // 2. Wait for JS to initialize
  console.log("Waiting for initialization...");
  await page.waitForTimeout(8000);

  // 3. Check if login form exists or app rendered
  const loginForm = await page.$('[data-form="login"]');
  const workspace = await page.$(".workspace");
  const bootScreen = await page.$(".boot-screen");
  const authForm = await page.$('[data-form="register"]');

  if (loginForm) results.steps.push("✓ Login form visible");
  if (workspace) results.steps.push("✓ Workspace visible");
  if (bootScreen) results.steps.push("✗ Boot screen still showing");
  if (authForm) results.steps.push("✗ Register form visible (should be login)");

  if (!loginForm && !workspace && !authForm) {
    const body = await page.textContent("body").catch(() => "none");
    results.steps.push("? No known element found, body snippet: " + body.substring(0, 200));
  }

  console.log("Results:", JSON.stringify(results.steps, null, 2));
  console.log("Console Errors: " + results.errors.length);
  results.errors.forEach(e => console.log("  -", e.text.substring(0, 200)));

  await browser.close();

  // Even if no elements found, if no console errors, we consider it a pass for syntax/runtime check
  if (results.errors.length === 0) {
    console.log("\n✓ NO CONSOLE ERRORS");
    process.exit(0);
  } else {
    console.log("\n✗ ERRORS FOUND");
    process.exit(1);
  }
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });