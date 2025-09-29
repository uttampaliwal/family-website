import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { Form } from "../FormLegacy";
import { ToastProvider } from "../../context/ToastProvider";

// Mock the useToast hook
vi.mock("../../hooks/useToast", () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ToastProvider>{component}</ToastProvider>
    </BrowserRouter>,
  );
};

describe("Form Component", () => {
  const mockSubmit = vi.fn();

  beforeEach(() => {
    mockSubmit.mockClear();
  });

  it("renders form fields correctly", () => {
    const fields = [
      {
        name: "email",
        type: "email" as const,
        label: "Email",
        required: true,
        placeholder: "Enter your email",
      },
      {
        name: "password",
        type: "password" as const,
        label: "Password",
        required: true,
        placeholder: "Enter your password",
      },
    ];

    renderWithProviders(
      <Form fields={fields} onSubmit={mockSubmit} submitLabel="Submit" />,
    );

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    const fields = [
      {
        name: "email",
        type: "email" as const,
        label: "Email",
        required: true,
        placeholder: "Enter your email",
      },
    ];

    renderWithProviders(
      <Form fields={fields} onSubmit={mockSubmit} submitLabel="Submit" />,
    );

    const submitButton = screen.getByRole("button", { name: "Submit" });
    fireEvent.click(submitButton);

    // Form should not submit with empty required field
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("submits form with valid data", async () => {
    const fields = [
      {
        name: "email",
        type: "email" as const,
        label: "Email",
        required: true,
        placeholder: "Enter your email",
      },
      {
        name: "message",
        type: "textarea" as const,
        label: "Message",
        required: false,
        placeholder: "Enter your message",
      },
    ];

    renderWithProviders(
      <Form fields={fields} onSubmit={mockSubmit} submitLabel="Submit" />,
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const messageInput = screen.getByLabelText(/Message/i);
    const submitButton = screen.getByRole("button", { name: "Submit" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(messageInput, { target: { value: "Test message" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        email: "test@example.com",
        message: "Test message",
      });
    });
  });

  it("validates email format", async () => {
    const fields = [
      {
        name: "email",
        type: "email" as const,
        label: "Email",
        required: true,
        placeholder: "Enter your email",
      },
    ];

    renderWithProviders(
      <Form fields={fields} onSubmit={mockSubmit} submitLabel="Submit" />,
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const submitButton = screen.getByRole("button", { name: "Submit" });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(submitButton);

    // Form should not submit with invalid email
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("handles form submission errors", async () => {
    const fields = [
      {
        name: "email",
        type: "email" as const,
        label: "Email",
        required: true,
        placeholder: "Enter your email",
      },
    ];

    const failingSubmit = vi
      .fn()
      .mockRejectedValue(new Error("Submission failed"));

    renderWithProviders(
      <Form fields={fields} onSubmit={failingSubmit} submitLabel="Submit" />,
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const submitButton = screen.getByRole("button", { name: "Submit" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(failingSubmit).toHaveBeenCalled();
    });

    // Button should not be stuck in loading state
    expect(submitButton).not.toBeDisabled();
  });

  it("shows loading state during submission", async () => {
    const fields = [
      {
        name: "email",
        type: "email" as const,
        label: "Email",
        required: true,
        placeholder: "Enter your email",
      },
    ];

    const slowSubmit = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

    renderWithProviders(
      <Form fields={fields} onSubmit={slowSubmit} submitLabel="Submit" />,
    );

    const emailInput = screen.getByLabelText(/Email/i);
    const submitButton = screen.getByRole("button", { name: "Submit" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(slowSubmit).toHaveBeenCalled();
    });
  });

  it("handles different field types correctly", () => {
    const fields = [
      {
        name: "text",
        type: "text" as const,
        label: "Text Field",
        required: false,
      },
      {
        name: "select",
        type: "select" as const,
        label: "Select Field",
        required: false,
        options: [
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
        ],
      },
      {
        name: "checkbox",
        type: "checkbox" as const,
        label: "Checkbox Field",
        required: false,
      },
    ];

    renderWithProviders(
      <Form fields={fields} onSubmit={mockSubmit} submitLabel="Submit" />,
    );

    expect(screen.getByLabelText("Text Field")).toBeInTheDocument();
    expect(screen.getByLabelText("Select Field")).toBeInTheDocument();
    expect(screen.getByLabelText("Checkbox Field")).toBeInTheDocument();
  });
});
