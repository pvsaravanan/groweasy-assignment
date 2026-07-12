import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/StatusBadge";

describe("StatusBadge", () => {
  it.each([
    ["GOOD_LEAD_FOLLOW_UP", "Follow up"],
    ["DID_NOT_CONNECT", "Did not connect"],
    ["BAD_LEAD", "Bad lead"],
    ["SALE_DONE", "Sale done"],
  ] as const)("renders a human label for %s", (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByTitle(status)).toBeInTheDocument();
  });
});
