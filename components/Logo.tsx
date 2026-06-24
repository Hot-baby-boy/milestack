export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="0" y="0" width="32" height="32" rx="7" fill="#03081A" />
      <path
        d="M8 20 L12 11 L16 20 L20 11 L24 20"
        stroke="#10B981"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="8" cy="20" r="2.1" fill="#10B981" />
      <circle cx="12" cy="11" r="2.1" fill="#10B981" />
      <circle cx="16" cy="20" r="2.1" fill="none" stroke="#10B981" strokeWidth="2" />
      <circle cx="20" cy="11" r="2.1" fill="#10B981" />
      <circle cx="24" cy="20" r="2.1" fill="#10B981" />
    </svg>
  );
}
