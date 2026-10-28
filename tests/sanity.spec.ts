import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const viewports = [
  { name: "mobile-375x667", width: 375, height: 667 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "laptop-1280x800", width: 1280, height: 800 },
  { name: "desktop-1920x1080", width: 1920, height: 1080 },
] as const;

const routes = [
  { name: "Home", url: "/", kind: "page" },
  { name: "Search", url: "/search?q=jhumka", kind: "page" },
  { name: "Search no results", url: "/search?q=not-a-real-jewellery-piece", kind: "page" },
  { name: "Category jhumkas", url: "/categories/jhumkas", kind: "page" },
  { name: "Category bridal sets", url: "/categories/bridal-sets", kind: "page" },
  { name: "Product detail", url: "/products/noor-kundan-dome-jhumkas", kind: "page" },
  { name: "Collection festive", url: "/collections/festive-glow", kind: "page" },
  { name: "Collection bridal", url: "/collections/bridal-edit", kind: "page" },
  { name: "Occasion bridal", url: "/occasion/bridal", kind: "page" },
  { name: "Budget under 1500", url: "/budget/under-1500", kind: "page" },
  { name: "Cart", url: "/cart", kind: "page" },
  { name: "Checkout", url: "/checkout", kind: "protected" },
  { name: "Payment result", url: "/checkout/payment-result", kind: "page" },
  { name: "Login", url: "/login", kind: "page" },
  { name: "Register", url: "/register", kind: "page" },
  { name: "Forgot password", url: "/forgot-password", kind: "page" },
  { name: "Reset password", url: "/reset-password?error=INVALID_TOKEN", kind: "page" },
  { name: "Account overview", url: "/account", kind: "protected" },
  { name: "Account addresses", url: "/account/addresses", kind: "protected" },
  { name: "Account orders", url: "/account/orders", kind: "protected" },
  { name: "Admin login", url: "/admin/login", kind: "page" },
  { name: "Admin dashboard", url: "/admin", kind: "protected" },
  { name: "Admin orders", url: "/admin/orders", kind: "protected" },
  { name: "Admin order detail", url: "/admin/orders/sanity-sample-id", kind: "protected" },
  { name: "Design system", url: "/design-system", kind: "page" },
  { name: "Wishlist (not implemented)", url: "/wishlist", kind: "not-found" },
  { name: "Privacy policy (not implemented)", url: "/privacy", kind: "not-found" },
  { name: "Terms (not implemented)", url: "/terms", kind: "not-found" },
  { name: "Shipping policy (not implemented)", url: "/shipping-policy", kind: "not-found" },
  { name: "404", url: "/this-page-does-not-exist", kind: "not-found" },
] as const;

type SanityRow = {
  page: string;
  url: string;
  viewport: string;
  status: string;
  category: string;
  severity: string;
  description: string;
  screenshot: string;
};

const rows: SanityRow[] = [];
const screenshotDir = path.resolve(process.cwd(), "tests", "screenshots");
test.describe.configure({ mode: "serial" });

test.afterAll(() => {
  const reportPath = path.resolve(process.cwd(), "tests", "SANITY_REPORT.md");
  const routeInventory = routes
    .map((route) => {
      const routeRows = rows.filter((row) => row.page === route.name);
      const result =
        routeRows.length === 0
          ? "Not run"
          : routeRows.every((row) => row.status === "Pass")
            ? "Pass"
            : routeRows.every((row) => row.status === "Expected 404")
              ? "Expected 404"
              : "Review findings";
      return `| ${route.name} | \`${route.url}\` | ${result} |`;
    })
    .join("\n");
  const detailRows = rows
    .map(
      (row, index) =>
        `| ${index + 1} | ${row.page} | ${row.viewport} | ${row.category} | ${row.severity} | ${row.description.replaceAll("|", "\\|")} | [Screenshot](./${row.screenshot}) | ${row.status} |`,
    )
    .join("\n");
  const failedRows = rows.filter((row) => row.status !== "Pass" && row.status !== "Expected 404");
  const summary = `# Shringaar Website Sanity Report

Generated: ${new Date().toISOString()}

## Route checklist

| Page | URL | Status |
|---|---|---|
${routeInventory}

This route and screenshot run checks logged-out rendering only. Customer authentication, account data, checkout, and admin access now use Firebase Authentication and server-side Firestore operations; this browser suite does not verify those Firebase flows. Wishlist storage/page and legal policy pages are not implemented. Those routes intentionally return the branded 404; add real content and storage before linking them as available features.

## Page and viewport results

| # | Page | Viewport | Category | Severity | Description | Screenshot | Status |
|---:|---|---|---|---|---|---|---|
${detailRows || "| — | — | — | — | — | Run `npm run test:sanity` to generate results. | — | Not run |"}

## Summary

- Pages/screens tested: ${rows.length}
- Failed page/viewport checks: ${failedRows.length}
- Screenshots saved under \`tests/screenshots/\`.
- The route suite checks HTTP response, blank content, visible H1, horizontal overflow, obvious placeholder strings, image loading, browser console/page errors, font loading, sticky header position, and axe critical/serious violations at laptop width.
- Authenticated-only pages were checked in logged-out state. Successful Firebase sign-in, session exchange, checkout completion, online payment, and customer data flows require configured Firebase providers, Firestore data, and payment credentials.

## Known gaps / suggestions

- Wishlist, privacy, terms, and shipping-policy pages do not exist; legal copy must be supplied rather than invented.
- Firebase configuration and Firestore rules are implemented, but this screenshot run does not verify Firebase connectivity or imported production data.
- Full cart-to-order, account management, image-backed catalog, and Google sign-in require configured Firebase services and catalog data.
- Lighthouse measurements are not included in this report until run against a ready server with browser/runtime access; do not treat lab performance targets as achieved without those measurements.

## Manual checks

1. Sign in with a real Firebase Authentication account and verify authorized domains and session exchange.
2. Verify a customer session can complete COD checkout and saved-address handling against the Firestore emulator or a dedicated test project.
3. Verify UroPay sandbox/production redirect behavior with provider credentials.
4. Test touch, screen reader, and browser behavior on physical iOS Safari and Android Chrome.
`;
  writeFileSync(reportPath, summary, "utf8");
});

for (const viewport of viewports) {
  test(`sanity pages at ${viewport.name}`, async ({ browser }) => {
    test.setTimeout(900_000);
    mkdirSync(screenshotDir, { recursive: true });

    for (const route of routes) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const errors: string[] = [];
      const onPageError = (error: Error) => errors.push(`Page error: ${error.message}`);
      const onConsole = (message: import("@playwright/test").ConsoleMessage) => {
        if (
          message.type() === "error" &&
          !message.text().startsWith("Failed to load resource:")
        ) {
          errors.push(`Console error: ${message.text()}`);
        }
      };
      const onResponse = (response: import("@playwright/test").Response) => {
        if (response.status() < 400) return;
        const responseUrl = new URL(response.url());
        const expectedMissingPage =
          route.kind === "not-found" &&
          response.status() === 404 &&
          responseUrl.pathname === new URL(route.url, "http://localhost").pathname;
        if (!expectedMissingPage) {
          errors.push(`HTTP ${response.status()} ${responseUrl.host}${responseUrl.pathname}`);
        }
      };
      const onRequestFailed = (request: import("@playwright/test").Request) => {
        const failure = request.failure()?.errorText;
        if (failure && failure !== "net::ERR_ABORTED") {
          errors.push(`Network failure ${failure} ${new URL(request.url()).host}${new URL(request.url()).pathname}`);
        }
      };
      page.on("pageerror", onPageError);
      page.on("console", onConsole);
      page.on("response", onResponse);
      page.on("requestfailed", onRequestFailed);
      await page.route("**/api/auth/get-session", (request) =>
        request.fulfill({
          status: 200,
          contentType: "application/json",
          body: "null",
        }),
      );
      await page.addInitScript(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      let responseStatus = "navigation failed";
      let finalUrl = route.url;
      const slug = route.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const screenshotName = `${slug}-${viewport.name}.png`;
      let screenshotTaken = false;
      const findings: string[] = [];
      let status = "Pass";

      try {
        const response = await page.goto(route.url, { waitUntil: "domcontentloaded", timeout: 45_000 });
        responseStatus = String(response?.status() ?? "no response");
        finalUrl = new URL(page.url()).pathname + new URL(page.url()).search;
        await page.evaluate(async () => {
          await Promise.race([
            document.fonts.ready,
            new Promise<void>((resolve) => window.setTimeout(resolve, 3000)),
          ]);
        });
        await page.waitForTimeout(100);

        const pageState = await page.evaluate(() => {
          const visible = (element: Element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
          };
          const main = document.querySelector("main");
          const firstMainChild = main?.firstElementChild;
          const firstRect = firstMainChild?.getBoundingClientRect();
          const header = document.querySelector("header");
          const headerRect = header?.getBoundingClientRect();
          return {
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
            lang: document.documentElement.lang,
            h1Count: Array.from(document.querySelectorAll("h1")).filter(visible).length,
            text: document.body.innerText,
            width: document.documentElement.scrollWidth,
            viewportWidth: window.innerWidth,
            imageCount: document.images.length,
            fontStatus: document.fonts.status,
            bodyFont: getComputedStyle(document.body).fontFamily,
            headerHeight: headerRect?.height ?? 0,
            firstContentTop: firstRect?.top ?? 0,
          };
        });

        if (responseStatus === "500" || responseStatus === "503") {
          findings.push(`HTTP ${responseStatus} at ${finalUrl}`);
        }
        if (!pageState.text.trim() || pageState.text.trim().length < 10) findings.push("Blank or nearly blank page.");
        if (pageState.width > pageState.viewportWidth) findings.push(`Horizontal overflow: ${pageState.width}px content in ${pageState.viewportWidth}px viewport.`);
        if (pageState.h1Count !== 1) findings.push(`Expected exactly one visible H1, found ${pageState.h1Count}.`);
        if (/\b(lorem ipsum|TODO|undefined|null|NaN|\[object Object\])\b/i.test(pageState.text)) findings.push("Placeholder or invalid value appears in visible page text.");
        if (!pageState.lang) findings.push("The HTML lang attribute is missing.");
        if (!pageState.title) findings.push("The page title is missing.");
        if (pageState.fontStatus !== "loaded" || !pageState.bodyFont.includes("--font-inter")) {
          if (pageState.fontStatus !== "loaded") findings.push(`Font loading state is ${pageState.fontStatus}.`);
        }

        await page.evaluate(async () => {
          const images = Array.from(document.images);
          window.scrollTo(0, document.body.scrollHeight);
          await Promise.race([
            Promise.all(
              images.map(
                (image) =>
                  new Promise<void>((resolve) => {
                    if (image.complete) return resolve();
                    image.addEventListener("load", () => resolve(), { once: true });
                    image.addEventListener("error", () => resolve(), { once: true });
                  }),
              ),
            ),
            new Promise<void>((resolve) => window.setTimeout(resolve, 2000)),
          ]);
        });
        await page.waitForTimeout(80);
        const brokenImages = await page.locator("img").evaluateAll((images) =>
          images
            .filter((image) => {
              const candidate = image as HTMLImageElement;
              const rect = candidate.getBoundingClientRect();
              const visible =
                rect.bottom > 0 &&
                rect.top < window.innerHeight &&
                rect.right > 0 &&
                rect.left < window.innerWidth;
              return (
                (candidate.loading !== "lazy" || visible) &&
                (!candidate.complete || candidate.naturalWidth === 0)
              );
            })
            .map((image) => (image as HTMLImageElement).alt || (image as HTMLImageElement).src),
        );
        if (brokenImages.length) findings.push(`${brokenImages.length} broken image(s): ${brokenImages.slice(0, 3).join(", ")}.`);
        if (route.url === "/") {
          const hiddenRevealSections = await page
            .locator("#customer-love-title, #shringaar-moments-title")
            .evaluateAll((headings) =>
              headings.filter((heading) => {
                const wrapper = heading.closest("section")?.parentElement;
                return wrapper && Number.parseFloat(getComputedStyle(wrapper).opacity) < 1;
              }).length,
            );
          if (hiddenRevealSections) {
            findings.push(
              `${hiddenRevealSections} homepage section(s) remain hidden with reduced motion enabled.`,
            );
          }
        }
        const header = page.locator("header");
        const headerAtBottom =
          (await header.count()) > 0
            ? await header.first().evaluate((element) => element.getBoundingClientRect().top)
            : null;
        if (headerAtBottom !== null && Math.abs(headerAtBottom) > 2) findings.push(`Sticky header was not at viewport top after bottom scroll (${Math.round(headerAtBottom)}px).`);

        if (viewport.width === 1280) {
          const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
          const serious = axe.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious");
          if (serious.length) {
            findings.push(
              `axe: ${serious
                .map(
                  (violation) =>
                    `${violation.impact} ${violation.id} (${violation.nodes.length}); targets: ${violation.nodes
                      .slice(0, 5)
                      .map(
                        (node) =>
                          `${node.target.join(" ")} (${node.html.slice(0, 120)}): ${node.failureSummary
                            ?.replace(/\s+/g, " ")
                            .slice(0, 160)}`,
                      )
                      .join(", ")}`,
                )
                .join("; ")}`,
            );
          }
        }

        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ fullPage: true, path: path.join(screenshotDir, screenshotName), animations: "disabled" });
        screenshotTaken = true;

        if (route.kind === "protected" && !finalUrl.startsWith("/login") && !finalUrl.startsWith("/admin/login")) {
          findings.push(`Protected page did not redirect while logged out (final URL: ${finalUrl}).`);
        }
        if (route.kind === "not-found" && responseStatus !== "404") {
          findings.push(`Expected not-found route HTTP 404, received ${responseStatus}.`);
        }
        if (route.kind === "not-found" && !pageState.text.includes("Return to Shringaar")) {
          findings.push("Not-found page is missing the branded home link.");
        }
        if (errors.length) findings.push(errors.slice(0, 4).join(" / "));
      } catch (error) {
        findings.push(error instanceof Error ? error.message : "Page test failed.");
      } finally {
        page.off("pageerror", onPageError);
        page.off("console", onConsole);
        page.off("response", onResponse);
        page.off("requestfailed", onRequestFailed);
        await context.close();
      }

      if (findings.length) status = route.kind === "not-found" && findings.every((finding) => finding.startsWith("Expected not-found"))
        ? "Expected 404"
        : "Fail";
      const description = findings.length
        ? findings.join(" ")
        : `HTTP ${responseStatus}; rendered at ${finalUrl}; no high-severity visual/runtime findings.`;
      rows.push({
        page: route.name,
        url: route.url,
        viewport: viewport.name,
        status: route.kind === "not-found" && status === "Pass" ? "Expected 404" : status,
        category: findings.length ? "Rendering / Layout / A11y" : "Rendering",
        severity: findings.length
          ? findings.some(
              (finding) =>
                finding.startsWith("Horizontal overflow") ||
                finding.includes("broken image") ||
                finding.includes("axe: critical") ||
                finding.includes("axe: serious") ||
                finding.startsWith("Protected page"),
            )
            ? "High"
            : "Medium"
          : "—",
        description: `${description}${screenshotTaken ? "" : " Screenshot missing."}`,
        screenshot: `screenshots/${screenshotName}`,
      });
    }

  });
}

test("header search, mobile navigation, and footer navigation are usable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
await page.route("**/api/auth/get-session", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: "null",
  }),
);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");

  const search = page.getByRole("searchbox", { name: "Search jewellery" }).first();
  await expect(search).toBeVisible();
  await search.fill("");
  expect(await search.evaluate((input) => (input as HTMLInputElement).checkValidity())).toBe(false);
  await search.fill("jhumka & pearls");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=jhumka\+%26\+pearls/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/");
  const menuButton = page.getByRole("button", { name: "Open navigation menu" });
  await menuButton.click();
  const mobileNavigation = page.getByRole("navigation", { name: "Mobile shop navigation" });
  await expect(mobileNavigation).toBeVisible();
  await expect.poll(() => page.locator("body").evaluate((body) => getComputedStyle(body).overflow)).toBe("hidden");
  await expect(mobileNavigation.getByRole("button", { name: "Sign in to your account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close navigation menu" })).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect.poll(() => page.locator("body").evaluate((body) => getComputedStyle(body).overflow)).not.toBe("hidden");
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeFocused();

  await page.locator("footer details").first().evaluate((element) => {
    (element as HTMLDetailsElement).open = true;
  });
  const links = await page.locator("a[href]").evaluateAll((anchors) =>
    [...new Set(anchors.map((anchor) => (anchor as HTMLAnchorElement).getAttribute("href") ?? ""))],
  );
  const deadLinks = links.filter((href) => !href || href === "#" || href.includes("localhost:undefined"));
  expect(deadLinks).toEqual([]);
  expect(errors).toEqual([]);
});

test("checkout API rejects unauthenticated order submissions", async ({ request, baseURL }) => {
  const response = await request.post(`${baseURL}/api/checkout`, {
    headers: {
      Origin: baseURL!,
      "Idempotency-Key": crypto.randomUUID(),
      "Content-Type": "application/json",
    },
    data: {},
  });
  expect(response.status()).toBe(401);
});

test("account, orders, and checkout keep guests on the sign-in flow", async ({ page }) => {
  for (const route of ["/account", "/account/addresses", "/account/orders", "/checkout"]) {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(`/login\\?returnTo=${encodeURIComponent(route)}`));
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  }
});

test("404 page is branded and SEO endpoints respond", async ({ page, request, baseURL }) => {
  const missingPage = await page.goto("/unknown-sanity-path");
  expect(missingPage?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This page isn’t here" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Return to Shringaar" })).toHaveAttribute("href", "/");
  for (const route of ["/robots.txt", "/sitemap.xml"]) {
    const response = await request.get(`${baseURL}${route}`);
    expect(response.status()).toBe(200);
  }
});

test("modal and protected route sign-in return path remain accessible", async ({ page }) => {
  await page.goto("/");
  const accountButton = page.getByRole("button", { name: "Sign in to your account" });
  await accountButton.click();
  const dialog = page.getByRole("dialog", { name: "Welcome to Shringaar" });
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(dialog).toBeHidden();
  await expect(accountButton).toBeFocused();
});
