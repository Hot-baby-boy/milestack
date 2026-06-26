import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function fileEmoji(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return { icon: "📄", bg: "#FEF2F2" };
  if (["fig","sketch","xd"].includes(ext)) return { icon: "🎨", bg: "#EFF6FF" };
  if (["zip","rar","tar"].includes(ext)) return { icon: "🗂️", bg: "#F1F5F9" };
  if (["png","jpg","jpeg","gif","webp","svg"].includes(ext)) return { icon: "🖼️", bg: "#ECFDF5" };
  if (["pptx","key"].includes(ext)) return { icon: "📊", bg: "#FFF7ED" };
  if (["docx","doc","txt"].includes(ext)) return { icon: "📝", bg: "#F5F3FF" };
  return { icon: "📁", bg: "#F8FAFC" };
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default async function FilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects").select("id, name").order("created_at", { ascending: false });
  const ids = (projects ?? []).map(p => p.id);
  const projectMap = Object.fromEntries((projects ?? []).map(p => [p.id, p.name]));

  const { data: files } = ids.length
    ? await supabase
        .from("project_files")
        .select("id, project_id, file_name, file_size, created_at, storage_path")
        .in("project_id", ids)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] as { id: string; project_id: string; file_name: string; file_size: number; created_at: string; storage_path: string }[] };

  return (
    <div>
      <div className="sticky top-0 z-30 hidden h-[72px] items-center border-b border-slate-200 bg-white px-8 lg:flex">
        <h1 className="text-[19px] font-bold tracking-tight text-[#0F172A]">Files</h1>
      </div>

      <div className="px-4 py-5 sm:px-8 sm:py-8">
        <h2 className="mb-1 text-[18px] font-bold text-[#0F172A] lg:hidden">Files</h2>
        <p className="mb-4 text-[13px] text-slate-500 sm:mb-6 sm:text-[13.5px]">
          {files?.length ? `${files.length} file${files.length !== 1 ? "s" : ""} across ${ids.length} workspace${ids.length !== 1 ? "s" : ""}.` : "All files from your workspaces."}
        </p>

        {!(files?.length) ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-8 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <svg className="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"/></svg>
            </div>
            <h3 className="mb-1 text-[15px] font-bold text-[#0F172A]">No files yet</h3>
            <p className="text-sm text-slate-500">Files are shared inside each workspace&apos;s chat.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5">
            {(files ?? []).map(f => {
              const { icon, bg } = fileEmoji(f.file_name);
              return (
                <Link key={f.id} href={`/dashboard/${f.project_id}`}
                  className="group flex flex-col items-center gap-2 rounded-[12px] border border-slate-200 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[9px] text-lg" style={{background: bg}}>
                    {icon}
                  </div>
                  <div className="w-full min-w-0">
                    <div className="truncate text-[12.5px] font-semibold text-[#0F172A]">{f.file_name}</div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {fmtSize(f.file_size)} · {new Date(f.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                    <div className="mt-1 truncate font-mono text-[10.5px] text-slate-300">{projectMap[f.project_id]}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
