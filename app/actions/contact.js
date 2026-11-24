"use server";

export async function submitContact(formData) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const company = formData.get("company")?.toString().trim() || null;
  const message = formData.get("message")?.toString().trim();

  if (!name || !email || !message) {
    return { ok: false, error: "Please fill in all required fields." };
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    console.error("Supabase env vars missing");
    return { ok: false, error: "Server configuration error. Please try again later." };
  }

  const res = await fetch(`${url}/rest/v1/contacts`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ name, email, company, message }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Supabase insert failed:", res.status, body);
    return { ok: false, error: "Failed to send message. Please try again." };
  }

  return { ok: true };
}
