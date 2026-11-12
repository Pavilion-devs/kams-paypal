import { Spinner } from "@/components/ui/spinner";
import { cx } from "@/components/ui/cx";

// PayPal's own button colours (gold) inside the Spoke pill geometry.
export function PayPalButton({
  label = "Pay with",
  size = "md",
  loading = false,
  onClick,
  className,
}: {
  label?: string;
  size?: "sm" | "md";
  loading?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-3xl bg-[#ffc439] font-medium text-[#111] transition-[filter] duration-[423ms] hover:brightness-95 disabled:opacity-60",
        size === "sm" ? "h-8 px-3.5 text-sm" : "h-11 px-5 text-base",
        className,
      )}
    >
      {loading ? <Spinner /> : <span>{label}</span>}
      <span className="font-bold text-[#003087] italic">
        Pay<span className="text-[#0070e0]">Pal</span>
      </span>
    </button>
  );
}
