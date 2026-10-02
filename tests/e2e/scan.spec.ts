import { expect, test, type Page } from "@playwright/test";

// "not a live reading" is correct, spec-approved explanatory copy (matches
// legacy/index.html) — only flag "live" when it labels an actual value, not
// when it's negated to explain the device doesn't do live readings.
const FORBIDDEN_STRINGS = [
  /current reading/i,
  /real-time/i,
  /real time/i,
  /(?<!not a )\blive (reading|ppm|value|dose|twa)\b/i,
];

async function runDemo(page: Page, label: "Safe" | "Caution" | "Over limit") {
  await page.goto("/scan/");
  await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();
  await expect(page.getByTestId("patch-photo")).toBeVisible();
  await page.getByRole("button", { name: "Analyse" }).click();
  await expect(page.getByTestId("result-twa")).toBeVisible();
}

test.describe("Dashboard", () => {
  test("shows the empty state with no scans yet", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("No scans yet")).toBeVisible();
    await page.screenshot({ path: "docs/screens/dashboard-empty.png" });
  });
});

test.describe("Demo scans (default calibration, 8 h shift, ACGIH standard)", () => {
  test.beforeEach(async ({ page }) => {
    // These tests check numbers specific to the ACGIH standard (1 ppm limit),
    // so pin it explicitly rather than relying on whichever standard the app
    // defaults to.
    await page.addInitScript(() => localStorage.setItem("avaran_std", JSON.stringify("acgih")));
  });

  test("Safe demo gives TWA ~0.30 and a SAFE band", async ({ page }) => {
    await runDemo(page, "Safe");
    const twa = parseFloat((await page.getByTestId("result-twa").textContent()) ?? "0");
    expect(twa).toBeGreaterThan(0.3 - 0.05);
    expect(twa).toBeLessThan(0.3 + 0.05);
    await expect(page.getByTestId("result-band")).toHaveText("SAFE");
    await page.screenshot({ path: "docs/screens/scan-result.png" });
  });

  test("Caution demo gives TWA ~0.80 and a CAUTION band", async ({ page }) => {
    await runDemo(page, "Caution");
    const twa = parseFloat((await page.getByTestId("result-twa").textContent()) ?? "0");
    expect(twa).toBeGreaterThan(0.8 - 0.06);
    expect(twa).toBeLessThan(0.8 + 0.06);
    await expect(page.getByTestId("result-band")).toHaveText("CAUTION");
  });

  test("Over limit demo gives TWA ~1.50 and an OVER LIMIT band", async ({ page }) => {
    await runDemo(page, "Over limit");
    const twa = parseFloat((await page.getByTestId("result-twa").textContent()) ?? "0");
    expect(twa).toBeGreaterThan(1.5 - 0.1);
    expect(twa).toBeLessThan(1.5 + 0.1);
    await expect(page.getByTestId("result-band")).toHaveText("OVER LIMIT");
  });

  test("changing the shift to 4 h and re-running Safe still gives TWA ~0.30", async ({ page }) => {
    await page.goto("/scan/");
    await page.getByLabel("Shift length (h)").fill("4");
    await page.getByRole("button", { name: /^Safe/ }).click();
    await page.getByRole("button", { name: "Analyse" }).click();
    const twa = parseFloat((await page.getByTestId("result-twa").textContent()) ?? "0");
    expect(twa).toBeGreaterThan(0.3 - 0.05);
    expect(twa).toBeLessThan(0.3 + 0.05);
  });
});

test.describe("Own photo", () => {
  test("shows the in-development popup and no ppm result", async ({ page }) => {
    await page.goto("/scan/");
    await page.locator("#file").setInputFiles("tests/e2e/fixtures/real-sample.jpg");
    await expect(page.getByTestId("patch-photo")).toBeVisible();
    await page.getByRole("button", { name: "Analyse" }).click();
    await expect(page.getByRole("dialog")).toContainText(/no patch detected/i);
    await expect(page.getByRole("dialog")).toContainText(/coming soon/i);
    await expect(page.getByTestId("result-twa")).toHaveCount(0);
    await page.getByRole("button", { name: "Got it" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("Records", () => {
  test("persist after reload and CSV exports the exact header", async ({ page }) => {
    await runDemo(page, "Safe");
    await page.reload();
    await page.goto("/records/");
    await expect(page.getByText("DEMO-SAFE")).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Export CSV" }).click(),
    ]);
    const streamPath = await download.path();
    expect(streamPath).toBeTruthy();
    const fs = await import("node:fs/promises");
    const content = await fs.readFile(streamPath!, "utf-8");
    expect(content.split("\n")[0]).toBe(
      "time,worker,shift_h,dA,dose_ppm_h,twa_ppm,status,standard,demo,provisional",
    );
    await page.screenshot({ path: "docs/screens/records.png" });
  });
});

test.describe("Setup", () => {
  test("switching to the Factories Act standard changes the legend to 5/10/20 ppm", async ({ page }) => {
    await page.goto("/setup/");
    await page.screenshot({ path: "docs/screens/setup.png" });
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: /Factories Act/i }).click();
    await page.goto("/");
    await expect(page.getByTestId("legend-safe")).toContainText("5");
    await expect(page.getByTestId("legend-caution")).toContainText("10");
    await expect(page.getByTestId("legend-high")).toContainText("20");
  });

  test("A = 0 is rejected", async ({ page }) => {
    await page.goto("/setup/");
    const aInput = page.getByLabel("A (saturation)");
    await aInput.fill("0");
    await page.getByRole("button", { name: "Save calibration" }).click();
    await expect(page.getByText(/must all be positive/i)).toBeVisible();
  });

  test("importing model_params.json with an unsupported model is rejected with a message", async ({
    page,
  }) => {
    await page.goto("/setup/");
    await page.locator("#jsonIn").setInputFiles({
      name: "model_params.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ model: "langmuir", params: [0.9, 0.03] })),
    });
    await expect(page.getByText(/could not import/i)).toBeVisible();
    await expect(page.getByText(/langmuir/i)).toBeVisible();
  });

  test("importing a dYel calibration file sets the channel to yellowness loss, not luminance", async ({
    page,
  }) => {
    await page.goto("/setup/");
    await page.locator("#jsonIn").setInputFiles({
      name: "model_params.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ params: [0.85, 0.02], metric: "dYel", dose_max: 50 })),
    });
    await expect(page.getByText(/imported: a=/i)).toBeVisible();
    await expect(page.getByRole("combobox").nth(1)).toContainText(/yellowness loss/i);
  });

  test("importing an unrecognised metric is rejected with a message", async ({ page }) => {
    await page.goto("/setup/");
    await page.locator("#jsonIn").setInputFiles({
      name: "model_params.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ params: [0.9, 0.03], metric: "dSomethingElse" })),
    });
    await expect(page.getByText(/could not import/i)).toBeVisible();
    await expect(page.getByText(/unknown metric/i)).toBeVisible();
  });
});

test.describe("No forbidden live-reading language", () => {
  for (const path of ["/", "/scan/", "/records/", "/setup/"]) {
    test(`${path} does not mention a live/current/real-time reading`, async ({ page }) => {
      await page.goto(path);
      const text = await page.locator("body").innerText();
      for (const pattern of FORBIDDEN_STRINGS) {
        expect(text).not.toMatch(pattern);
      }
    });
  }
});
