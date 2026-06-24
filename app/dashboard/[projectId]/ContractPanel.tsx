"use client";

import { useState } from "react";
import { generateContract, signContract } from "@/lib/contracts/actions";

type Signature = { user_id: string; signed_name: string; signed_at: string };
type Contract = { id: string; content: string; status: "draft" | "signed" };

export function ContractPanel({
  projectId,
  isFreelancer,
  contract,
  signatures,
  freelancerId,
  clientId,
  defaultSignedName,
}: {
  projectId: string;
  isFreelancer: boolean;
  contract: Contract | null;
  signatures: Signature[];
  freelancerId: string;
  clientId: string | null;
  defaultSignedName: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(defaultSignedName);

  const currentUserId = isFreelancer ? freelancerId : clientId;
  const hasSigned = signatures.some((s) => s.user_id === currentUserId);

  async function onGenerate() {
    setPending(true);
    setError(null);
    const result = await generateContract(projectId);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  async function onSign() {
    if (!contract) return;
    setPending(true);
    setError(null);
    const result = await signContract(contract.id, projectId, name);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  if (!contract) {
    if (!isFreelancer) {
      return <p className="mt-2 text-sm text-slate-500">The freelancer hasn&apos;t generated an agreement yet.</p>;
    }
    return (
      <div className="mt-3">
        <p className="text-sm text-slate-500">
          Generate a scope agreement from this project&apos;s current milestones.
        </p>
        <button
          onClick={onGenerate}
          disabled={pending}
          className="mt-3 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {pending ? "Generating…" : "Generate agreement"}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
        {contract.content}
      </pre>

      <div className="mt-4 space-y-2">
        {signatures.map((s) => (
          <p key={s.user_id} className="text-sm text-slate-500">
            Signed by <span className="font-medium text-slate-700">{s.signed_name}</span> on{" "}
            {new Date(s.signed_at).toLocaleDateString()}
          </p>
        ))}
      </div>

      {contract.status === "signed" ? (
        <p className="mt-4 text-sm font-medium text-emerald-600">Agreement fully signed.</p>
      ) : hasSigned ? (
        <p className="mt-4 text-sm text-slate-500">Waiting for the other party to sign.</p>
      ) : (
        <div className="mt-4 flex max-w-sm items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={onSign}
            disabled={pending}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {pending ? "Signing…" : "Sign"}
          </button>
        </div>
      )}

      {isFreelancer && contract.status === "draft" && (
        <button
          onClick={onGenerate}
          disabled={pending}
          className="mt-3 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Regenerate from current milestones
        </button>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
