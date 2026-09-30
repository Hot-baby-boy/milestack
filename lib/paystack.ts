import crypto from "crypto";

const BASE_URL = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

async function paystackFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const json = await res.json();
  if (!res.ok || json.status === false) {
    throw new Error(json.message ?? `Paystack request failed: ${path}`);
  }
  return json.data as T;
}

// Verifies the x-paystack-signature header on an incoming webhook request.
// Must be computed over the RAW request body — never the parsed JSON.
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const hash = crypto.createHmac("sha512", secretKey()).update(rawBody).digest("hex");
  return hash === signature;
}

export function nairaToKobo(amountNaira: number): number {
  return Math.round(amountNaira * 100);
}

// Independently asks Paystack whether a charge actually succeeded — never
// trust a client-side "it worked" callback on its own. Used right after the
// Paystack popup closes, since Paystack's server-to-server webhook can't
// reach a localhost dev server (it remains a backstop in production).
export async function verifyTransaction(reference: string) {
  return paystackFetch<{ status: string; reference: string; amount: number }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
}

// Resolves an account number + bank code to the real account holder's
// name, so a typo can't send real money to the wrong person.
export async function resolveBankAccount(accountNumber: string, bankCode: string) {
  return paystackFetch<{ account_number: string; account_name: string; bank_id: number }>(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
  );
}

// Creates (or Paystack dedupes) a transfer recipient for a freelancer's
// verified bank account. Returns the recipient_code to store and reuse.
export async function createTransferRecipient(params: {
  name: string;
  accountNumber: string;
  bankCode: string;
}) {
  const data = await paystackFetch<{ recipient_code: string }>("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "nuban",
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: "NGN",
    }),
  });
  return data.recipient_code;
}

export async function initiateTransfer(params: {
  recipientCode: string;
  amountKobo: number;
  reference: string;
  reason: string;
}) {
  return paystackFetch<{ status: string; transfer_code: string }>("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount: params.amountKobo,
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason,
    }),
  });
}

export async function refundCharge(params: { transactionReference: string; amountKobo: number; reference: string }) {
  return paystackFetch<{ status: string }>("/refund", {
    method: "POST",
    body: JSON.stringify({
      transaction: params.transactionReference,
      amount: params.amountKobo,
      merchant_note: params.reference,
    }),
  });
}

// Nigerian banks Paystack supports for NUBAN transfers, with their bank
// codes. A small hardcoded list avoids an extra live API call on every
// page load — extend as needed.
export const NIGERIAN_BANKS = [
  { name: "Test Bank (Paystack test mode only)", code: "001" },
  { name: "Access Bank", code: "044" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank", code: "214" },
  { name: "Globus Bank", code: "00103" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "50211" },
  { name: "Moniepoint MFB", code: "50515" },
  { name: "Opay", code: "999992" },
  { name: "Palmpay", code: "999991" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank For Africa", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
] as const;
