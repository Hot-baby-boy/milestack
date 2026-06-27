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
    <span className="flex items-center justify-center overflow-hidden rounded-full bg-[#FF4800]" style={{width:s,height:s}}>
      <svg width={s*0.65} height={s*0.65} viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.176 18.667c-.47 0-.863-.166-1.176-.498-.314-.333-.47-.762-.47-1.288 0-.533.156-.965.47-1.295.313-.33.706-.496 1.176-.496.46 0 .848.165 1.163.496.314.33.471.762.471 1.295 0 .526-.157.955-.47 1.288-.316.332-.704.498-1.164.498zm3.157-8.48c-.304.5-.74.94-1.31 1.323-.356.236-.802.484-1.337.743-.535.258-.895.49-1.08.694-.186.203-.278.463-.278.779v.515h-2.21v-.68c0-.637.137-1.164.41-1.582.275-.417.735-.797 1.382-1.14.606-.322 1.027-.578 1.264-.767.474-.374.71-.838.71-1.39 0-.44-.16-.795-.48-1.066-.32-.27-.766-.405-1.34-.405-.623 0-1.106.172-1.447.514-.342.343-.534.852-.579 1.527l-2.255-.215c.078-1.157.49-2.065 1.234-2.726.744-.66 1.76-.99 3.048-.99 1.28 0 2.296.315 3.047.945.75.63 1.126 1.463 1.126 2.497 0 .686-.167 1.26-.505 1.424z"/>
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
    <span className="flex items-center justify-center overflow-hidden rounded-full bg-[#6C3AE0]" style={{width:s,height:s}}>
      <svg width={s*0.55} height={s*0.55} viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 3h8.5C15.538 3 18 5.462 18 8.5S15.538 14 12.5 14H8v7H4V3zm4 7.5h4.5c.828 0 1.5-.672 1.5-1.5S13.328 7.5 12.5 7.5H8v3z"/>
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

export const DETAIL_LABEL: Record<string, string> = {
  local_bank: "Account number & bank name",
  paypal:     "PayPal email address",
  payoneer:   "Payoneer email address",
  wise:       "Wise email or account details",
  raenest:    "Raenest email address",
};

export const DETAIL_PLACEHOLDER: Record<string, string> = {
  local_bank: "e.g. 0123456789 — GTBank",
  paypal:     "e.g. you@email.com",
  payoneer:   "e.g. you@email.com",
  wise:       "e.g. you@email.com",
  raenest:    "e.g. you@email.com",
};
