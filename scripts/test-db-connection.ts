import "dotenv/config";
import { readFileSync } from "node:fs";
import { Client } from "pg";

const ca = readFileSync(new URL("../supabase/prod-ca-2021.crt", import.meta.url), "utf8");

async function test(name: string, url: string | undefined) {
  if (!url) {
    console.log(name, "SKIP (no url)");
    return;
  }
  // node-postgres merges ssl config parsed from the URL's sslmode with the
  // explicit `ssl` option in a way that drops our CA — strip it and rely
  // solely on the explicit option below.
  const bareUrl = url.replace(/[?&]sslmode=[^&]+/, "");
  const client = new Client({
    connectionString: bareUrl,
    ssl: { ca, rejectUnauthorized: true },
  });
  try {
    await client.connect();
    const r = await client.query('select current_user, count(*)::int as users from "User"');
    console.log(name, "OK", r.rows[0]);
  } catch (e) {
    console.log(name, "FAIL", (e as Error).message);
  } finally {
    await client.end().catch(() => {});
  }
}

async function main() {
  await test("DATABASE_URL (pooled, txn)", process.env.DATABASE_URL);
  await test("DIRECT_URL (pooled, session)", process.env.DIRECT_URL);
}

main();
