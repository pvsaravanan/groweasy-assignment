import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "@/components/StatCard";

describe("StatCard", () => {
  it("renders the label and a locale-formatted value", () => {
    render(<StatCard label="Total rows" value={12345} />);
    expect(screen.getByText("Total rows")).toBeInTheDocument();
    expect(screen.getByText("12,345")).toBeInTheDocument();
  });

  it("renders zero correctly instead of as a falsy blank", () => {
    render(<StatCard label="Skipped" value={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
