import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationDisplay } from "../ToolInvocationDisplay";

afterEach(cleanup);

describe("ToolInvocationDisplay", () => {
  it("shows spinner and user-friendly message when creating a file", () => {
    render(
      <ToolInvocationDisplay
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "call",
        }}
      />
    );
    expect(screen.getByText("Creating a new file")).toBeDefined();
    expect(screen.getByText("App.jsx")).toBeDefined();
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  it("shows green dot when the tool call is complete", () => {
    render(
      <ToolInvocationDisplay
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "result",
          result: "File created: /App.jsx",
        }}
      />
    );
    expect(screen.getByText("Creating a new file")).toBeDefined();
    expect(screen.getByText("App.jsx")).toBeDefined();
    expect(document.querySelector(".bg-emerald-500")).toBeTruthy();
    expect(document.querySelector(".animate-spin")).toBeNull();
  });

  it("shows spinner when state is result but result is null", () => {
    render(
      <ToolInvocationDisplay
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "str_replace", path: "/utils.ts" },
          state: "result",
          result: null,
        }}
      />
    );
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  it("shows editing message for str_replace command", () => {
    render(
      <ToolInvocationDisplay
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "str_replace", path: "/Card.jsx" },
          state: "call",
        }}
      />
    );
    expect(screen.getByText("Editing")).toBeDefined();
    expect(screen.getByText("Card.jsx")).toBeDefined();
  });

  it("renders file_manager rename with arrow notation", () => {
    render(
      <ToolInvocationDisplay
        toolInvocation={{
          toolName: "file_manager",
          args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
          state: "result",
          result: { success: true },
        }}
      />
    );
    expect(screen.getByText("Renaming")).toBeDefined();
    expect(screen.getByText("old.jsx")).toBeDefined();
    expect(screen.getByText("→")).toBeDefined();
    expect(screen.getByText("new.jsx")).toBeDefined();
  });
});
