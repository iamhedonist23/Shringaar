import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

test("homepage search to product to cart requires sign-in before checkout", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Shringaar/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /imitation jewellery/i,
  );
  const heroImage = page.getByRole("img", {
    name: "A close-up of Shringaar festive earrings",
  });
  await expect(heroImage).toHaveAttribute("loading", "eager");
  await expect(heroImage).toHaveAttribute(
    "src",
    /\/_next\/image\?url=.*festival-earrings\.jpg%3Fhero%3D1/,
  );
  await expect(heroImage).toHaveJSProperty("complete", true);
  const heroImages = page.locator("main > section").first().locator("img");
  await expect(heroImages).toHaveCount(2);
  await expect(heroImages.nth(1)).toHaveAttribute("loading", "eager");
  await expect(heroImages.nth(1)).toHaveAttribute(
    "src",
    /\/_next\/image\?url=.*%3Fhero%3D1/,
  );

  const search = page.getByRole("searchbox", { name: "Search jewellery" }).first();
  await search.fill("jhumka");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=jhumka/);
  await expect(page.getByRole("heading", { name: /Results for/i })).toBeVisible();

  await page.locator('a[href^="/products/"]').first().click();
  await expect(page).toHaveURL(/\/products\/[^/]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to bag" })).toBeVisible();
  await page.getByRole("button", { name: "Add to bag" }).click();

  await page.getByRole("link", { name: /Shopping bag, 1 item/ }).click();
  await expect(page.getByRole("heading", { name: "Shopping bag" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue to checkout" })).toBeVisible();
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fcheckout$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("mobile navigation is keyboard operable and honors reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = await page.goto("/");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");

  const menuButton = page.getByRole("button", { name: "Open navigation menu" });
  await expect(
    page.getByRole("searchbox", { name: "Search jewellery" }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(menuButton).toBeFocused();
  const focusStyle = await menuButton.evaluate((element) => getComputedStyle(element).boxShadow);
  expect(focusStyle).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Close navigation menu" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeFocused();
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );

  const transitionDuration = await page
    .locator('a[href^="/products/"] img')
    .first()
    .evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(transitionDuration.split(",").every((duration) => parseFloat(duration) <= 0.001)).toBe(
    true,
  );

  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow, `horizontal overflow at ${width}px`).toBe(false);
  }
});

test("homepage bottom sections and footer are responsive and accessible", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  await expect(page.getByRole("region", { name: "Shopping with Shringaar" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Customer love" })).toBeVisible();
  await expect(page.getByText("Your story belongs here.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "#ShringaarMoments" })).toBeVisible();
  await expect(page.locator("#newsletter-email")).toHaveAttribute("type", "email");
  await expect(page.getByRole("checkbox")).toHaveAttribute("required", "");
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("link", { name: "Shringaar home" }).last()).toBeVisible();
  const headerLogo = page.locator('header a[aria-label="Shringaar home"] img');
  const footerLogo = page.locator('footer a[aria-label="Shringaar home"] img');
  await expect(headerLogo).toBeVisible();
  await expect(footerLogo).toBeVisible();
  await expect(headerLogo).toHaveJSProperty("naturalWidth", 1414);
  await expect(footerLogo).toHaveJSProperty("naturalWidth", 1414);

  const shopAccordion = page.locator("footer details").filter({
    has: page.locator("summary", { hasText: "Shop" }),
  });
  await shopAccordion.locator("summary").click();
  await expect(shopAccordion.getByRole("link", { name: "Earrings & Jhumkas" })).toBeVisible();

  await page.route("**/api/newsletter", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: "Thanks for subscribing." }),
    }),
  );
  await page.locator("#newsletter-email").fill("shopper@example.com");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Subscribe" }).click();
  await expect(page.getByRole("status")).toHaveText("Thanks for subscribing.");

  await page.evaluate(() => window.scrollTo(0, 700));
  const backToTop = page.getByRole("button", { name: "Back to top" });
  await expect(backToTop).toBeVisible();
  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(backToTop).toBeHidden();

  const headerLayering = await page.locator("header").evaluate((header) => ({
    zIndex: getComputedStyle(header).zIndex,
    background: getComputedStyle(header).backgroundColor,
  }));
  expect(Number(headerLayering.zIndex)).toBeGreaterThan(0);
  expect(headerLayering.background).not.toBe("rgba(0, 0, 0, 0)");

  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 812 });
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows, `homepage/footer overflow at ${width}px`).toBe(false);
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  const firstShopLink = await page
    .getByRole("link", { name: "Earrings & Jhumkas" })
    .last()
    .boundingBox();
  const secondShopLink = await page
    .getByRole("link", { name: "Chandbalis" })
    .last()
    .boundingBox();
  expect(firstShopLink).not.toBeNull();
  expect(secondShopLink).not.toBeNull();
  expect(secondShopLink!.y - firstShopLink!.y).toBeLessThanOrEqual(40);
});

test("typing in the desktop search keeps the focus indicator rounded", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const search = page.getByRole("searchbox", { name: "Search jewellery" }).first();
  await search.fill("jhumka");
  await expect(search).toHaveValue("jhumka");

  const searchStyle = await search.evaluate((input) => {
    const form = input.closest("form");
    return {
      inputOutlineStyle: getComputedStyle(input).outlineStyle,
      formBorderRadius: getComputedStyle(form!).borderRadius,
      formRing: getComputedStyle(form!).boxShadow,
    };
  });
  expect(searchStyle.inputOutlineStyle).toBe("none");
  expect(searchStyle.formBorderRadius).toBe("9999px");
  expect(searchStyle.formRing).not.toBe("none");
});

test("category listing links to real product detail", async ({ page }) => {
  await page.goto("/categories/jhumkas");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/jhumka/i);
  const productLink = page.locator('a[href^="/products/"]').first();
  await expect(productLink).toBeVisible();
  await productLink.click();
  await expect(page).toHaveURL(/\/products\/[^/]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("product images use Next image handling and unknown products return 404", async ({ page }) => {
  await page.goto("/products/noor-kundan-dome-jhumkas");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/products\/noor-kundan-dome-jhumkas$/,
  );
  const structuredProduct = await page
    .locator('script[type="application/ld+json"]')
    .first()
    .evaluate((element) => JSON.parse(element.textContent ?? "{}"));
  expect(structuredProduct["@type"]).toBe("Product");
  expect(structuredProduct.brand.name).toBe("Shringaar");

  const productImage = page.locator("main img").first();
  await expect(productImage).toHaveAttribute("src", /\/_next\/image\?/);
  await expect
    .poll(() => productImage.evaluate((image: HTMLImageElement) => image.naturalWidth > 0))
    .toBe(true);

  const missingProduct = await page.goto("/products/not-a-real-product");
  expect(missingProduct?.status()).toBe(404);
});

test("product image failures present an accessible fallback", async ({ page }) => {
  await page.route("**/_next/image**", (route) => route.abort());
  await page.goto("/products/noor-kundan-dome-jhumkas");
  await expect(
    page.getByRole("img", { name: /Noor Kundan Dome Jhumkas.*image unavailable/i }).first(),
  ).toBeVisible();
});

test("account icon opens an accessible sign-in dialog and restores focus on Escape", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Sign in to your account" });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Welcome to Shringaar" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await page.setViewportSize({ width: 375, height: 844 });
  await trigger.click();
  await expect(dialog).toBeVisible();
  const sheet = await dialog.boundingBox();
  expect(sheet).not.toBeNull();
  expect((sheet?.y ?? 0) + (sheet?.height ?? 0)).toBeGreaterThan(840);
});

test("customer account pages render accessible forms and protect account routes", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Faccount$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/register");

  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeVisible();
  await expect(page.getByLabel("Password")).toHaveAttribute("minlength", "12");

  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();

  await page.goto("/reset-password?error=INVALID_TOKEN");
  await expect(page.getByRole("heading", { name: "Reset link unavailable" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Request another link" })).toHaveAttribute(
    "href",
    "/forgot-password",
  );
});
