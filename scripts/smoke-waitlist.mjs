#!/usr/bin/env node

const baseUrl = (process.env.AURORA_SMOKE_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const writeEnabled = process.env.AURORA_SMOKE_WRITE === "1";
const testEmail = process.env.AURORA_SMOKE_EMAIL || "";

async function check(name, run) {
  try {
    await run();
    console.log(`ok ${name}`);
  } catch (error) {
    console.error(`fail ${name}: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

async function expectStatus(path, expected) {
  const res = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  if (res.status !== expected) {
    throw new Error(`${path} returned ${res.status}, expected ${expected}`);
  }
}

await check("home responds", async () => {
  const res = await fetch(`${baseUrl}/`);
  if (!res.ok) throw new Error(`/ returned ${res.status}`);
  const html = await res.text();
  if (!html.includes("Aurora")) throw new Error("home does not include Aurora");
});

await check("faq responds", () => expectStatus("/faq", 200));
await check("login responds", () => expectStatus("/login", 200));
await check("diario requires auth", async () => {
  const res = await fetch(`${baseUrl}/diario`, { redirect: "manual" });
  if (![302, 303, 307, 308].includes(res.status)) {
    throw new Error(`/diario returned ${res.status}, expected redirect`);
  }
});
await check("admin does not expose without token", async () => {
  const res = await fetch(`${baseUrl}/admin`);
  if (!res.ok) throw new Error(`/admin returned ${res.status}`);
  const html = await res.text();
  if (html.includes("Lançamento, emails e rede de convites.")) {
    throw new Error("admin cockpit rendered without token");
  }
});

if (writeEnabled) {
  if (!testEmail) {
    console.error("fail waitlist write: set AURORA_SMOKE_EMAIL when AURORA_SMOKE_WRITE=1");
    process.exitCode = 1;
  } else {
    await check("waitlist accepts controlled signup", async () => {
      const res = await fetch(`${baseUrl}/api/waitlist`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          hp: "",
          attribution: {
            utm_source: "smoke",
            utm_medium: "codex",
            utm_campaign: "launch_hardening",
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.status !== "ok") {
        throw new Error(`/api/waitlist returned ${res.status}`);
      }
    });
  }
} else {
  console.log("skip waitlist write: set AURORA_SMOKE_WRITE=1 and AURORA_SMOKE_EMAIL to test signup/email");
}
