import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepIndicator } from "@/components/StepIndicator";

describe("StepIndicator", () => {
  it("shows step numbers for upcoming steps and a checkmark for done steps", () => {
    render(<StepIndicator current={3} />);

    // Steps 1 and 2 are done: their numbers are replaced by a checkmark, not visible as text.
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText("2")).not.toBeInTheDocument();

    // Step 3 (current) and step 4 (upcoming) still show their numbers.
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("bolds the active step's label", () => {
    render(<StepIndicator current={2} />);
    const activeLabel = screen.getByText("Preview & confirm").parentElement;
    expect(activeLabel).toHaveClass("font-semibold");
  });

  it("renders all four step labels", () => {
    render(<StepIndicator current={1} />);
    expect(screen.getByText("Upload")).toBeInTheDocument();
    expect(screen.getByText("Preview & confirm")).toBeInTheDocument();
    expect(screen.getByText("AI processing")).toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();
  });
});
