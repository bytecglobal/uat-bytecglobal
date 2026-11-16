/**
 * Idempotent Database Seeding Script for Supabase PostgreSQL
 * Run via: node supabase/seed.js
 */
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seed() {
  console.log("Starting idempotent Supabase database initialization...");

  // 1. Initial Super Admin
  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || "admin@bytecglobal.com").toLowerCase().trim();
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

  if (adminPassword) {
    const { data: existingAdmins, error: fetchErr } = await supabase
      .from("admin_users")
      .select("id, email")
      .limit(1);

    if (fetchErr) {
      console.warn("Could not query admin_users (ensure migrations have run first):", fetchErr.message);
    } else if (!existingAdmins || existingAdmins.length === 0) {
      console.log(`Creating initial Super Admin (${adminEmail})...`);
      const salt = bcrypt.genSaltSync(12);
      const passwordHash = bcrypt.hashSync(adminPassword, salt);

      const { error: insertErr } = await supabase.from("admin_users").insert({
        name: "Bytec Super Admin",
        email: adminEmail,
        password_hash: passwordHash,
        role: "SUPER_ADMIN",
        status: "active",
      });

      if (insertErr) {
        console.error("Failed to seed initial admin:", insertErr.message);
      } else {
        console.log("Super Admin created successfully.");
      }
    } else {
      console.log("Admin account(s) already exist. Skipping admin creation to prevent credential overwrites.");
    }
  } else {
    console.log("INITIAL_ADMIN_PASSWORD not set in environment. Skipping initial admin creation.");
  }

  console.log("Database seeding completed.");
}

seed().catch((err) => {
  console.error("Seed execution failed:", err);
  process.exit(1);
});
