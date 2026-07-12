import clsx from "clsx";
import { CrmStatus } from "@/types/crm";

// Carbon tags — pill radius is the documented exception for status badges
const STATUS_STYLES: Record<CrmStatus, { label: string; className: string }> = {
  GOOD_LEAD_FOLLOW_UP: {
    label: "Follow up",
    className: "bg-[#d0e2ff] text-[#0043ce] dark:bg-[#0043ce] dark:text-[#d0e2ff]",
  },
  DID_NOT_CONNECT: {
    label: "Did not connect",
    className: "bg-[#e0e0e0] text-[#393939] dark:bg-[#393939] dark:text-[#e0e0e0]",
  },
  BAD_LEAD: {
    label: "Bad lead",
    className: "bg-[#ffd7d9] text-[#a2191f] dark:bg-[#a2191f] dark:text-[#ffd7d9]",
  },
  SALE_DONE: {
    label: "Sale done",
    className: "bg-[#a7f0ba] text-[#0e6027] dark:bg-[#0e6027] dark:text-[#a7f0ba]",
  },
};

export function StatusBadge({ status }: { status: CrmStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs tracking-[0.32px]",
        style.className
      )}
      title={status}
    >
      {style.label}
    </span>
  );
}
