"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RealtimeWorkspace({ projectId }: { projectId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`workspace-realtime-${projectId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "milestones",
        filter: `project_id=eq.${projectId}`,
      }, () => router.refresh())
      .on("postgres_changes", {
        event: "*", schema: "public", table: "projects",
        filter: `id=eq.${projectId}`,
      }, () => router.refresh())
      .on("postgres_changes", {
        event: "*", schema: "public", table: "ledger_entries",
        filter: `project_id=eq.${projectId}`,
      }, () => router.refresh())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId, router]);

  return null;
}
