import { Camera01Icon, CheckmarkBadge01Icon, Link01Icon, SparklesIcon, Tag01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { PanelBackdrop } from "./panel-backdrop";

const steps = [
  { tag: "Photo received", tagClass: "bg-sky-soft text-sky-deep", text: "IMG_2041.jpg · seller note: “₦25,000, 35 cm”", icon: Camera01Icon, tilt: "rotate-[8deg] translate-x-2" },
  { tag: "Claude is cataloguing", tagClass: "bg-amber-soft text-amber-deep", text: "Handwoven raffia basket · Home & Living · handmade", icon: SparklesIcon, tilt: "" },
  { tag: "Listed in 6.4s", tagClass: "bg-lime-soft text-lime-deep", text: "$16.50 · converted at ₦1,520 per USD", icon: Tag01Icon, tilt: "-rotate-[12deg] -translate-x-1" },
] as const;

export function SnapArt() {
  return (
    <div className="relative size-full overflow-hidden rounded-2xl">
      <PanelBackdrop tone="sky" />
      <div className="font-ui relative flex h-full flex-col justify-center gap-3 px-4">
        {steps.map((s) => (
          <div key={s.tag} className={`bg-surface rounded-xl p-3 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.18)] ${s.tilt}`}>
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${s.tagClass}`}>{s.tag}</span>
            <p className="mt-2 text-[11px] leading-snug">{s.text}</p>
            <HugeiconsIcon icon={s.icon} size={14} className="text-faint mt-2" aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgentArt() {
  return (
    <div className="relative size-full overflow-hidden rounded-2xl">
      <PanelBackdrop tone="pink" />
      <div className="font-ui relative flex h-full items-center px-4">
        <div className="bg-surface w-full rounded-xl p-4 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.25)]">
          <p className="text-[12px] font-medium">Your agent endpoint</p>
          <p className="text-subtle mt-1 text-[9px]">Paste into any MCP client</p>
          <div className="border-line mt-3 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[10px]">
            <HugeiconsIcon icon={Link01Icon} size={12} aria-hidden="true" />
            <span className="font-mono">kams.app/mcp/ada-weaves</span>
          </div>
          <p className="text-muted mt-3 text-[9px]">Agents that shopped today</p>
          <div className="mt-1.5 grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
            {["Claude", "ChatGPT", "Kams"].map((name, index) => (
              <span key={name} className={`rounded-md py-1 ${index === 0 ? "bg-lime text-olive" : "bg-soft"}`}>
                {name}
              </span>
            ))}
          </div>
          <span className="bg-ink text-soft mt-4 block rounded-full py-1.5 text-center text-[10px] font-medium">Copy MCP link</span>
        </div>
      </div>
    </div>
  );
}

export function PaidArt() {
  return (
    <div className="relative size-full overflow-hidden rounded-2xl">
      <PanelBackdrop tone="lime" />
      <div className="font-ui relative flex h-full items-end pl-5">
        <div className="bg-surface h-[85%] w-full rounded-tl-xl p-4 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.2)]">
          <p className="text-[15px] font-medium">Ada Weaves</p>
          <p className="text-subtle text-[9px]">Paid with PayPal this week</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-[9px]">
            {[
              ["Revenue", "$103.50"],
              ["You keep", "$98.12"],
              ["Orders", "4"],
              ["Via AI agents", "3"],
            ].map(([label, value]) => (
              <span key={label} className="text-subtle">
                {label}
                <span className="text-ink block font-mono text-[13px]">{value}</span>
              </span>
            ))}
          </div>
          <div className="border-hairline mt-4 border-t pt-3 text-[10px]">
            <p className="flex justify-between">
              <span>Raffia basket</span>
              <span className="text-lime-deep inline-flex items-center gap-1">
                <HugeiconsIcon icon={CheckmarkBadge01Icon} size={11} aria-hidden="true" />
                Captured
              </span>
            </p>
            <p className="mt-2 flex justify-between">
              <span>Adire throw</span>
              <span className="text-lime-deep">Captured</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
