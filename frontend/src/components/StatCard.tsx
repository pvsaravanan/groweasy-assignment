import clsx from "clsx";

interface StatCardProps {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning";
}

// Carbon stat tile: hairline border, 0px corners, light-weight display number
export function StatCard({ label, value, tone = "default" }: StatCardProps) {
  return (
    <div className="flex min-w-[150px] flex-1 flex-col gap-1 rounded-none border border-hairline bg-canvas p-4">
      <p className="text-xs tracking-[0.32px] text-ink-muted">{label}</p>
      <p
        className={clsx(
          "text-3xl font-light tabular-nums leading-tight tracking-normal",
          tone === "default" && "text-ink",
          tone === "success" && "text-success",
          tone === "warning" && "text-ink"
        )}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}
