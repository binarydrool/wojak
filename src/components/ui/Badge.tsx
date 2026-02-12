interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "red" | "gray";
  className?: string;
}

const VARIANT_STYLES: Record<string, string> = {
  green: "bg-green-500/15 text-green-400 border-green-500/30",
  red: "bg-red-500/15 text-red-400 border-red-500/30",
  gray: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

export default function Badge({ children, variant = "gray", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${VARIANT_STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
