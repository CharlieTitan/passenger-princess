import { kv } from "@vercel/kv";
import crypto from "node:crypto";
const parse = value => !value ? null : typeof value === "string" ? JSON.parse(value) : value;
const usersAllowed = ["Charlie", "Tayla"];
const digest = value => crypto.createHash("sha256").update(value).digest("hex");
function encode(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `scrypt:${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}
function matches(password, stored) {
  if (typeof stored !== "string") return false;
  const parts = stored.split(":");
  const candidate = parts[0] === "scrypt" && parts.length === 3
    ? crypto.scryptSync(password, parts[1], 64).toString("hex") : digest(password);
  const expected = parts[0] === "scrypt" ? parts[2] : stored;
  return candidate.length === expected.length && crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}
async function ensureUsers() {
  if (await kv.get("us:auth:users")) return;
  const names = ["US_CHARLIE_PASSWORD", "US_TAYLA_PASSWORD", "US_CHARLIE_RECOVERY", "US_TAYLA_RECOVERY"];
  if (names.some(name => !process.env[name] || process.env[name].length < 12)) throw new Error("Authentication setup required");
  const accounts = Object.fromEntries(usersAllowed.map(user => [user, {
    passwordHash: encode(process.env[`US_${user.toUpperCase()}_PASSWORD`]),
    recoveryHash: encode(process.env[`US_${user.toUpperCase()}_RECOVERY`])
  }]));
  await kv.set("us:auth:users", JSON.stringify(accounts), { nx: true });
}
function reply(body, status = 200, cookie) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store", ...(cookie ? {"Set-Cookie": cookie} : {}) } });
}
const cookie = sid => `us_session=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sid ? 7776000 : 0}; Secure`;
async function session(username) {
  const sid = crypto.randomBytes(24).toString("hex");
  await kv.set("us:session:" + sid, JSON.stringify({ user: username, createdAt: Date.now() + 1, expiresAt: Date.now() + 7776000000 }), { ex: 7776000 });
  return sid;
}
export async function POST(req) {
  // Same-origin browser requests only; absent Origin remains compatible with native clients.
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return reply({ error: "Forbidden" }, 403);
  let body;
  try { body = await req.json(); } catch { return reply({ error: "Invalid request" }, 400); }
  if (body.action === "logout") {
    const sid = req.cookies.get("us_session")?.value;
    if (sid) await kv.del("us:session:" + sid);
    return reply({ ok: true }, 200, cookie(""));
  }
  const {action, username} = body;
  if (!["login", "recover"].includes(action) || !usersAllowed.includes(username)) return reply({ error: "Invalid login" }, 401);
  const value = action === "recover" ? body.recoveryCode : body.password;
  if (typeof value !== "string" || value.length > 1024) return reply({ error: "Invalid login" }, 401);
  const rateKey = `us:auth:attempts:${username}:${Math.floor(Date.now() / 900000)}`;
  const attempts = await kv.incr(rateKey);
  if (attempts === 1) await kv.expire(rateKey, 900);
  if (attempts > 20) return reply({ error: "Too many attempts. Try again in 15 minutes." }, 429);
  try { await ensureUsers(); } catch { return reply({ error: "Authentication setup required" }, 503); }
  const accounts = parse(await kv.get("us:auth:users"));
  const account = accounts?.[username];
  // Historical bootstrap codes were predictable. Fail closed until configured securely.
  if (action === "recover" && account?.recoveryHash === digest(username.toLowerCase() + "-recovery")) {
    return reply({ error: "Recovery setup required. Contact Charlie." }, 503);
  }
  if (!account || !matches(value, action === "recover" ? account.recoveryHash : account.passwordHash)) return reply({ error: "Invalid login or recovery code" }, 401);
  if (action === "recover") {
    if (typeof body.newPassword !== "string" || body.newPassword.length < 12 || body.newPassword.length > 1024) return reply({ error: "Use a password of at least 12 characters" }, 400);
    const passwordHash = encode(body.newPassword);
    // Revocation epoch invalidates older sessions without deleting unrelated app keys.
    const sessionsRevokedAt = Date.now();
    let saved = false;
    for (let attempt = 0; attempt < 8; attempt++) {
      const current = parse(await kv.get("us:auth:users"));
      if (!matches(value, current?.[username]?.recoveryHash)) return reply({error:"Invalid recovery code"},401);
      const updated = {...current, [username]: {...current[username],passwordHash,sessionsRevokedAt}};
      saved = Number(await kv.eval("if redis.call('GET',KEYS[1])~=ARGV[1] then return 0 end; redis.call('SET',KEYS[1],ARGV[2]); return 1", ["us:auth:users"], [JSON.stringify(current),JSON.stringify(updated)])) === 1;
      if (saved) break;
    }
    if (!saved) return reply({error:"Account changed; please retry"},409);
  }
  // Retain existing hashes until an explicit password change, avoiding concurrent login writes.
  return reply({ ok: true, user: username }, 200, cookie(await session(username)));
}
