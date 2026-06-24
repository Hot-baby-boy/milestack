type Transaction = {
  id: string;
  type: "charge" | "fee" | "payout";
  amount: number;
  currency: string;
  created_at: string;
};

const TYPE_LABELS: Record<Transaction["type"], string> = {
  charge: "Client charge",
  fee: "Protection fee",
  payout: "Freelancer payout",
};

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  if (!transactions.length) {
    return <p className="p-4 text-sm text-slate-500">No transactions yet.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
          <th className="px-4 py-2 font-medium">Type</th>
          <th className="px-4 py-2 font-medium">Amount</th>
          <th className="px-4 py-2 font-medium">Date</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((t) => (
          <tr key={t.id} className="border-t border-slate-100">
            <td className="px-4 py-3 text-slate-700">{TYPE_LABELS[t.type]}</td>
            <td className="px-4 py-3 font-mono text-slate-600">
              {t.currency} {Number(t.amount).toLocaleString()}
            </td>
            <td className="px-4 py-3 text-slate-500">
              {new Date(t.created_at).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
