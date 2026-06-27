// Brand logo components for payout methods

export const PayoutLogo = ({ method, size = 20 }: { method: string; size?: number }) => {
  const s = size;

  if (method === "local_bank") return (
    <span className="flex items-center justify-center rounded-full bg-slate-100" style={{width:s,height:s}}>
      <svg width={s*0.6} height={s*0.6} viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11"/>
      </svg>
    </span>
  );

  if (method === "paypal") return (
    <span className="flex items-center justify-center overflow-hidden rounded-full bg-[#003087]" style={{width:s,height:s}}>
      <svg width={s*0.6} height={s*0.6} viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
      </svg>
    </span>
  );

  if (method === "payoneer") return (
    <span className="flex items-center justify-center overflow-hidden rounded-full bg-white border border-slate-100" style={{width:s,height:s}}>
      <svg width={s*0.82} height={s*0.82} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="payoneer-g" x1="1" y1="0.5" x2="0" y2="0.5" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stop-color="#FF4500"/>
            <stop offset="20%"  stop-color="#FF8C00"/>
            <stop offset="40%"  stop-color="#FFD700"/>
            <stop offset="55%"  stop-color="#7CFC00"/>
            <stop offset="70%"  stop-color="#00CED1"/>
            <stop offset="85%"  stop-color="#6A5ACD"/>
            <stop offset="100%" stop-color="#FF69B4"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="36" fill="none" stroke="url(#payoneer-g)" strokeWidth="14"/>
      </svg>
    </span>
  );

  if (method === "wise") return (
    <span className="flex items-center justify-center overflow-hidden rounded-full bg-[#163300]" style={{width:s,height:s}}>
      <svg width={s*0.65} height={s*0.65} viewBox="0 0 24 24" fill="#9FE870" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.437 3.9l-3.6 12.862L11.05 3.9H7.7l-3.787 12.862L.326 3.9H0l4.388 16.2h3.125L11.35 7.238l3.837 12.862h3.125L22.7 3.9h-.263z"/>
      </svg>
    </span>
  );

  if (method === "raenest") return (
    <span className="flex items-center justify-center overflow-hidden rounded-full" style={{width:s,height:s,background:"#4B3FE4"}}>
      <svg width={s*0.78} height={s*0.78} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rn-cream" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#F5EAD4"/>
            <stop offset="60%"  stopColor="#E8D5B7"/>
            <stop offset="100%" stopColor="#C4AA88"/>
          </linearGradient>
          <linearGradient id="rn-shadow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#C4AA88"/>
            <stop offset="100%" stopColor="#A08060"/>
          </linearGradient>
        </defs>
        {/* Back-left arc of ribbon (darker, behind) */}
        <path d="M50 18 C28 18 12 32 12 50 C12 68 28 82 50 82 C56 82 61 81 66 79"
          fill="none" stroke="url(#rn-shadow)" strokeWidth="11" strokeLinecap="round"/>
        {/* Front-right arc of ribbon (lighter, in front) */}
        <path d="M34 21 C39 19 44 18 50 18 C72 18 88 32 88 50 C88 68 72 82 50 82"
          fill="none" stroke="url(#rn-cream)" strokeWidth="11" strokeLinecap="round"/>
        {/* Twist crossing — the key feature: ribbon loops through itself */}
        <path d="M66 79 C60 76 54 70 50 62 C46 54 44 46 38 40 C34 35 28 32 22 34"
          fill="none" stroke="url(#rn-cream)" strokeWidth="11" strokeLinecap="round"/>
        {/* Cover the crossing point to create depth */}
        <path d="M34 21 C30 28 28 36 30 44 C32 52 38 58 44 62"
          fill="none" stroke="url(#rn-shadow)" strokeWidth="11" strokeLinecap="round"/>
      </svg>
    </span>
  );

  return null;
};

export const METHODS = [
  { value: "local_bank", label: "Local Bank" },
  { value: "paypal",     label: "PayPal" },
  { value: "payoneer",   label: "Payoneer" },
  { value: "wise",       label: "Wise" },
  { value: "raenest",    label: "Raenest" },
];

export type FieldDef = {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "email" | "select";
  options?: string[];
};

// Defines which fields to collect per payout method
export const METHOD_FIELDS: Record<string, FieldDef[]> = {
  paypal: [
    { key: "email", label: "PayPal email address", placeholder: "you@paypal.com", type: "email" },
  ],
  payoneer: [
    { key: "email", label: "Payoneer email address", placeholder: "you@email.com", type: "email" },
  ],
  local_bank: [
    { key: "bank_name",      label: "Bank name",           placeholder: "e.g. GTBank" },
    { key: "account_number", label: "Account number",      placeholder: "e.g. 0123456789" },
    { key: "routing",        label: "Routing / sort code", placeholder: "e.g. 058152522" },
  ],
  wise: [
    { key: "bank_name",      label: "Bank name",       placeholder: "e.g. Wise" },
    { key: "account_number", label: "Account number",  placeholder: "e.g. 9876543210" },
    { key: "routing",        label: "Routing number",  placeholder: "e.g. 026073150" },
  ],
  raenest: [
    { key: "bank_name",      label: "Bank name",      placeholder: "e.g. Raenest" },
    { key: "account_number", label: "Account number", placeholder: "e.g. 1234567890" },
    { key: "account_type",   label: "Account type",   placeholder: "Select type", type: "select", options: ["Checking", "Savings"] },
  ],
};
