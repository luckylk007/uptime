const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

// Read .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const parts = line.trim().split("=");
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
    if (key) env[key] = val;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", url ? url.substring(0, 30) + "..." : "MISSING");
console.log("Supabase Anon Key:", key ? "Present (length: " + key.length + ")" : "MISSING");

if (!url || !key) {
  console.error("ERROR: Missing URL or Key in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  console.log("\nConnecting to Supabase PostgreSQL tables...\n");

  const { data: monitors, error: monErr } = await supabase
    .from("monitors")
    .select("*")
    .limit(1);

  if (monErr) {
    console.error("❌ Monitors Table Error:", monErr.message);
  } else {
    console.log("✅ Monitors table connected! Found records:", monitors.length);
  }

  const { data: checks, error: chkErr } = await supabase
    .from("checks")
    .select("*")
    .limit(1);

  if (chkErr) {
    console.error("❌ Checks Table Error:", chkErr.message);
  } else {
    console.log("✅ Checks table connected! Found records:", checks.length);
  }

  const { data: incidents, error: incErr } = await supabase
    .from("incidents")
    .select("*")
    .limit(1);

  if (incErr) {
    console.error("❌ Incidents Table Error:", incErr.message);
  } else {
    console.log("✅ Incidents table connected! Found records:", incidents.length);
  }

  if (!monErr && !chkErr && !incErr) {
    console.log("\n🎉 ALL SUPABASE TABLES ARE WORKING & CONNECTED PERFECTLY!\n");
  }
}

test();