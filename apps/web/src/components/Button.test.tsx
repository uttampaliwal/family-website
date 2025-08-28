/// <reference types="vitest/globals" />
import { render, screen } from "@testing-library/react";
import Button from "./Button";

describe("Button", () => {
  it("renders the button with the correct label", () => {
    render(<Button label="Click Me" />);
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  it("applies primary styles when variant is primary", () => {
    render(<Button label="Primary Button" variant="primary" />);
    const button = screen.getByText("Primary Button");
    expect(button).toHaveClass("btn-primary");
  });

  it("applies default styles when variant is default or not provided", () => {
    render(<Button label="Default Button" />);
    const button = screen.getByText("Default Button");
    expect(button).toHaveClass("btn-ghost");
  });
});
