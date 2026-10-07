import { kv } from "@vercel/kv";
import crypto from "crypto";

const NS = "us:";

function parse(value) {
  if (!value) return null;
  return typeof value === "string" ? JSON.parse(value) : value;
}

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function ensureUsers() {
  const existing = await kv.get(NS + "auth:init");
  if (existing) return;

  const defaults = {
    Charlie: {
      passwordHash: hash(process.env.US_CHARLIE_PASSWORD || "change-me-charlie"),
      recoveryHash: hash(process.env.US_CHARLIE_RECOVERY || "charlie-recovery"),
    },
    Tayla: {
      passwordHash: hash(process.env.US_TAYLA_PASSWORD || "change-me-tayla"),
      recoveryHash: hash(process.env.US_TAYLA_RECOVERY || "tayla-recovery"),
    },
  };

  await kv.set(NS + "auth:users", JSON.stringify(defaults));
  await kv.set(NS + "auth:init", "1");
}

function sessionCookie(sessionId) {
  return [
    "us_session=" + sessionId,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=" + 60 * 60 * 24 * 90,
    "Secure",
  ].join("; ");
}

async function createSession(username) {
  const sid = crypto.randomBytes(24).toString("hex");
  await kv.set(
    NS + "session:" + sid,
    JSON.stringify({
      user: username,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 90,
    })
  );
  return sid;
}

export async function POST(req) {
  await ensureUsers();

  const body = await req.json();
  const {
    action,
    username,
    password,
    recoveryCode,
    newPassword,
  } = body;

  const users = parse(await kv.get(NS + "auth:users")) || {};

  if (action === "login") {
    const account = users[username];

    if (!account || account.passwordHash !== hash(password || "")) {
      return Response.json({ error: "Invalid login" }, { status: 401 });
    }

    const sid = await createSession(username);

    return new Response(JSON.stringify({ ok: true, user: username }), {
      headers: {
        "content-type": "application/json",
        "set-cookie": sessionCookie(sid),
      },
    });
  }

  if (action === "logout") {
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "content-type": "application/json",
        "set-cookie":
          "us_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure",
      },
    });
  }

  if (action === "recover") {
    const account = users[username];

    if (
      !account ||
      account.recoveryHash !== hash(recoveryCode || "") ||
      !newPassword
    ) {
      return Response.json({ error: "Invalid recovery code" }, { status: 401 });
    }

    account.passwordHash = hash(newPassword);
    await kv.set(NS + "auth:users", JSON.stringify(users));

    const sid = await createSession(username);

    return new Response(JSON.stringify({ ok: true, user: username }), {
      headers: {
        "content-type": "application/json",
        "set-cookie": sessionCookie(sid),
      },
    });
  }

  return Response.json({ error: "Bad action" }, { status: 400 });
}
