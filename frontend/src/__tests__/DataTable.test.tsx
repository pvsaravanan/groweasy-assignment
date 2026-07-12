import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable, DataTableColumn } from "@/components/DataTable";

interface Row {
  name: string;
  email: string;
}

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Name", render: (r) => r.name },
  { key: "email", header: "Email", render: (r) => r.email },
];

describe("DataTable", () => {
  it("renders column headers and row values", () => {
    const rows: Row[] = [{ name: "Jane Doe", email: "jane@example.com" }];
    render(<DataTable columns={columns} rows={rows} rowKey={(_r, i) => i} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("shows the empty message when there are no rows", () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(_r, i) => i} emptyMessage="Nothing here." />);
    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
  });

  it("renders every row when under the virtualization threshold", () => {
    const rows: Row[] = Array.from({ length: 50 }, (_, i) => ({ name: `Person ${i}`, email: `p${i}@example.com` }));
    render(<DataTable columns={columns} rows={rows} rowKey={(_r, i) => i} />);
    expect(screen.getAllByRole("row")).toHaveLength(51); // 50 data rows + 1 header row
  });
});
