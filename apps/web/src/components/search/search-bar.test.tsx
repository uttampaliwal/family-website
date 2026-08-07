import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SearchResponse } from "@family/core";
import { api } from "../../lib/api-client.js";
import { I18nProvider } from "../../i18n/index.js";
import { SearchPage } from "../../pages/search.js";
import { GlobalSearch } from "./search-bar.js";

vi.mock("../../lib/api-client.js", () => ({
  api: { get: vi.fn() },
}));

const mockResults: SearchResponse = {
  q: "ali",
  people: [
    {
      id: "aaaaaaaaaaaaaaaaaaaaaaaa",
      name: "Alice Sharma",
      username: "alice",
      gender: "female",
      relationship: "mother",
      role: "user",
      avatarUrl: null,
      parentIds: [],
      joinedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
  ],
  photos: [],
  posts: [],
  events: [],
  documents: [],
  messages: [],
};

function renderBar() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nProvider>
        <MemoryRouter initialEntries={["/"]}>
          <GlobalSearch />
          <LocationProbe />
        </MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>,
  );
}

function LocationProbe() {
  const location = useLocation();
  return (
    <span data-testid="probe">
      {location.pathname}
      {location.search}
    </span>
  );
}

describe("GlobalSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue(mockResults);
  });

  it("opens a command panel with a hint before anything is typed", async () => {
    renderBar();
    fireEvent.click(screen.getAllByRole("button", { name: "Search the family" })[0]!);

    expect(screen.getByRole("dialog", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByText(/Type at least 2 letters/)).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });

  it("debounces the query and shows grouped results", async () => {
    renderBar();
    fireEvent.click(screen.getAllByRole("button", { name: "Search the family" })[0]!);

    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "ali" } });

    await waitFor(
      () =>
        expect(api.get).toHaveBeenCalledWith(
          expect.stringMatching(/\/search\?q=ali&limit=5$/),
        ),
      { timeout: 3000 },
    );
    expect(await screen.findByText("Alice Sharma")).toBeInTheDocument();
    expect(screen.getByText("People")).toBeInTheDocument();
  });

  it("navigates to the full search page on Enter without a selection", async () => {
    renderBar();
    fireEvent.click(screen.getAllByRole("button", { name: "Search the family" })[0]!);

    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "ali" } });
    await waitFor(() => expect(api.get).toHaveBeenCalled(), { timeout: 3000 });

    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(screen.getByTestId("probe").textContent).toContain("/search?q=ali");
    });
  });

  it("opens a result with the arrows + Enter", async () => {
    renderBar();
    fireEvent.click(screen.getAllByRole("button", { name: "Search the family" })[0]!);

    const input = screen.getByRole("textbox", { name: "Search" });
    fireEvent.change(input, { target: { value: "ali" } });
    await waitFor(() => expect(api.get).toHaveBeenCalled(), { timeout: 3000 });
    await screen.findByText("Alice Sharma");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("probe").textContent).toContain(
        "/members/aaaaaaaaaaaaaaaaaaaaaaaa",
      );
    });
  });

  it("closes the panel with Escape", async () => {
    renderBar();
    fireEvent.click(screen.getAllByRole("button", { name: "Search the family" })[0]!);
    expect(screen.queryByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("textbox", { name: "Search" }), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("SearchPage", () => {
  it("searches on load from the URL and renders grouped results", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <I18nProvider>
          <MemoryRouter initialEntries={["/search?q=ali"]}>
            <Routes>
              <Route path="/search" element={<SearchPage />} />
            </Routes>
          </MemoryRouter>
        </I18nProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(api.get).toHaveBeenCalled(), { timeout: 3000 });
    expect(await screen.findByText("Alice Sharma")).toBeInTheDocument();
    expect(screen.getByText("People")).toBeInTheDocument();
  });
});