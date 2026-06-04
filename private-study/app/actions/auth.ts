"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function getAuthRedirect(path: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(path, siteUrl).toString();
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("signupEmail") ?? "").trim().toLowerCase();
  const password = String(formData.get("signupPassword") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const sex = String(formData.get("sex") ?? "");
  const age = Number(formData.get("age"));

  if (!firstName || !lastName || !Number.isInteger(age) || age < 18 || age > 120) {
    redirect("/auth/login?error=Please%20enter%20a%20valid%20name%20and%20age.");
  }

  if (!["female", "male", "intersex", "prefer_not_to_say"].includes(sex)) {
    redirect("/auth/login?error=Please%20select%20a%20valid%20sex%20option.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthRedirect("/setup"),
      data: {
        first_name: firstName,
        last_name: lastName,
        display_name: email,
        sex,
        age
      }
    }
  });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    redirect("/auth/login?message=Account%20created.%20Please%20check%20your%20email%20to%20confirm%20the%20account%2C%20then%20log%20in.");
  }

  redirect("/setup");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
