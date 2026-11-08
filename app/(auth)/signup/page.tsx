import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { loadCategories } from "@/lib/talent/categories";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
  const supabase = await createClient();
  const { mains } = await loadCategories(supabase);
  return <Suspense fallback={null}><SignupForm categories={mains} /></Suspense>;
}
