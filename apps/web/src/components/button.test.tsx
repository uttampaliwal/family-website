import { Button } from "@family/ui";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Button", () => {
  it("renders with children", () => {
    render(<Button>Say hello</Button>);
    expect(
      screen.getByRole("button", { name: "Say hello" }),
    ).toBeInTheDocument();
  });

  it("applies the primary variant styles", () => {
    const { container } = render(<Button>Save</Button>);
    expect(container.firstChild).toHaveClass("bg-primary");
  });
});
