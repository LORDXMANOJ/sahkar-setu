// Creates the demo accounts and uploads prepared language packs.
// Run once after supabase/setup.sql:   npm run seed
import { createClient } from "@supabase/supabase-js";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^(https:\/\/[^/]+).*$/, "$1");
const secret = process.env.SUPABASE_SECRET_KEY;
const password = process.env.DEMO_PASSWORD;
if (!url || !secret || !password) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY or DEMO_PASSWORD in .env.local");
  process.exit(1);
}
const db = createClient(url, secret, { auth: { persistSession: false } });

const accounts = [
  { email: "trainee@demo.sahkarsetu.in", role: "trainee", full_name: "Lakshmi Devi", trainee_id: "SS-26-04817" },
  { email: "trainer@demo.sahkarsetu.in", role: "trainer", full_name: "Meera Joshi", trainee_id: null },
  { email: "employer@demo.sahkarsetu.in", role: "employer", full_name: "Kaveri Milk Producers' Union", trainee_id: null },
];

const { data: list, error: listErr } = await db.auth.admin.listUsers({ perPage: 200 });
if (listErr) throw listErr;

for (const a of accounts) {
  let user = list.users.find((u) => u.email === a.email);
  if (user) {
    const { error } = await db.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    if (error) throw error;
  } else {
    const { data, error } = await db.auth.admin.createUser({ email: a.email, password, email_confirm: true });
    if (error) throw error;
    user = data.user;
  }
  const { error } = await db.from("profiles").upsert({ user_id: user.id, role: a.role, full_name: a.full_name, trainee_id: a.trainee_id });
  if (error) throw new Error(`profiles: ${error.message}. Did you run supabase/setup.sql first?`);
  console.log(`ok  ${a.role.padEnd(8)} ${a.email}`);
}

const dir = ".cache/lang";
if (existsSync(dir)) {
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const pack = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
    if (!pack.complete) continue;
    const { error } = await db.from("lang_packs").upsert({ code: pack.code, pack, updated_at: new Date().toISOString() });
    if (error) throw new Error(`lang_packs: ${error.message}`);
    console.log(`ok  language pack ${pack.code}`);
  }
}
console.log("Done.");
