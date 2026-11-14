import { expect, test, type Page } from "@playwright/test";
import { profile } from "../src/lib/wall";

type MockPost = { id: string; author_name: string; body: string; photo_url: string | null; created_at: string };

async function mockBackend(page: Page) {
  const state = { posts: [] as MockPost[], uploadError: false, postError: false, uploads: 0 };
  await page.routeWebSocket("**/realtime/v1/**", (socket) => socket.close());
  await page.route("https://wall-test.supabase.co/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "OPTIONS") {
      return route.fulfill({ status: 200, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    }
    if (url.pathname === "/rest/v1/posts") {
      if (request.method() === "POST") {
        if (state.postError) return route.fulfill({ status: 403, json: { message: "Test insert denied", code: "42501" } });
        const post = { ...request.postDataJSON(), id: crypto.randomUUID(), created_at: new Date().toISOString() } as MockPost;
        state.posts.unshift(post);
        return route.fulfill({ status: 201, json: post });
      }
      return route.fulfill({ json: state.posts });
    }
    if (url.pathname.startsWith("/storage/v1/object/wall-photos/posts/")) {
      ++state.uploads;
      if (state.uploadError) return route.fulfill({ status: 400, json: { statusCode: "404", error: "Bucket not found", message: "Bucket not found" } });
      return route.fulfill({ json: { Key: "wall-photos/posts/test.png" } });
    }
    return route.fulfill({ status: 404, json: {} });
  });
  return state;
}

const photo = {
  name: "moment.png",
  mimeType: "image/png",
  buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZkAAAAASUVORK5CYII=", "base64"),
};

test("automatically uses the profile name, prevents empty posts, and enforces 280 Unicode characters", async ({ page }) => {
  const state = await mockBackend(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Anna", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Share", exact: true })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: "Your name", exact: true })).toHaveCount(0);
  await expect(page.locator(".profile-information dt").first()).toHaveText("Bio");
  await expect(page.locator(".profile-information dd").first()).toHaveText(profile.bio);
  await page.getByLabel("What's on your mind?", { exact: true }).fill("\u{1F600}".repeat(281));
  await expect(page.locator("#character-count")).toHaveText("0 characters remaining");
  await page.getByLabel("What's on your mind?", { exact: true }).fill("Hello from the wall!");
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Your post was shared." })).toBeVisible();
  const newest = page.locator(".wall-post").first();
  await expect(newest.getByRole("heading")).toHaveText(profile.name);
  await expect(newest.locator(".post-body")).toHaveText("Hello from the wall!");
  expect(state.posts).toHaveLength(1);
  expect(state.posts[0].author_name).toBe(profile.name);
  await expect(page.locator("#message")).toHaveValue("");
  await expect(page.locator("#character-count")).toHaveText("280 characters remaining");
  await page.screenshot({ path: "test-results/wall-desktop.png", fullPage: true });
});

test("photo-only posts preserve drafts on upload and insert failures and reuse a successful upload", async ({ page }) => {
  const state = await mockBackend(page);
  await page.goto("/");
  await page.locator("#post-photo").setInputFiles(photo);
  await expect(page.getByAltText("Selected photo preview")).toBeVisible();
  state.uploadError = true;
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.locator(".form-error")).toContainText('"wall-photos"');
  await expect(page.getByAltText("Selected photo preview")).toBeVisible();
  state.uploadError = false;
  state.postError = true;
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.locator(".form-error")).toContainText("Test insert denied");
  state.postError = false;
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Your post was shared." })).toBeVisible();
  expect(state.uploads).toBe(2);
  expect(state.posts[0].photo_url).toContain("/storage/v1/object/public/wall-photos/posts/");
  expect(state.posts[0].body).toBe("");
  expect(state.posts[0].author_name).toBe(profile.name);
  await expect(page.getByAltText("Selected photo preview")).toHaveCount(0);
});

test("polls for another visitor's post and fits a mobile screen", async ({ page }) => {
  const state = await mockBackend(page);
  await page.clock.install();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByText("Loading the wall…", { exact: true })).toHaveCount(0);
  state.posts = [{ id: crypto.randomUUID(), author_name: "Morgan", body: "A post from another tab", photo_url: null, created_at: new Date().toISOString() }];
  await page.clock.fastForward(16_000);
  await expect(page.locator(".wall-post").first()).toContainText("A post from another tab");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/wall-mobile.png", fullPage: true });
});
