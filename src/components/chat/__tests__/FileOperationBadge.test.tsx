import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { FileOperationBadge, getFileOperation } from "../FileOperationBadge";

afterEach(cleanup);

describe("getFileOperation", () => {
  it("returns 'Creating a new file' action for str_replace_editor create", () => {
    const op = getFileOperation("str_replace_editor", { command: "create", path: "/components/Card.jsx" });
    expect(op.action).toBe("Creating a new file");
    expect(op.filename).toBe("Card.jsx");
  });

  it("returns 'Editing' action for str_replace_editor str_replace", () => {
    const op = getFileOperation("str_replace_editor", { command: "str_replace", path: "/App.jsx" });
    expect(op.action).toBe("Editing");
    expect(op.filename).toBe("App.jsx");
  });

  it("returns 'Adding code to' action for str_replace_editor insert", () => {
    const op = getFileOperation("str_replace_editor", { command: "insert", path: "/src/utils.ts" });
    expect(op.action).toBe("Adding code to");
    expect(op.filename).toBe("utils.ts");
  });

  it("returns 'Reading' action for str_replace_editor view", () => {
    const op = getFileOperation("str_replace_editor", { command: "view", path: "/index.tsx" });
    expect(op.action).toBe("Reading");
    expect(op.filename).toBe("index.tsx");
  });

  it("returns 'Updating' action for unknown str_replace_editor command", () => {
    const op = getFileOperation("str_replace_editor", { command: "undo_edit", path: "/App.jsx" });
    expect(op.action).toBe("Updating");
    expect(op.filename).toBe("App.jsx");
  });

  it("returns rename operation with secondaryFilename for file_manager rename", () => {
    const op = getFileOperation("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" });
    expect(op.action).toBe("Renaming");
    expect(op.filename).toBe("old.jsx");
    expect(op.secondaryFilename).toBe("new.jsx");
  });

  it("returns 'Deleting' action for file_manager delete", () => {
    const op = getFileOperation("file_manager", { command: "delete", path: "/components/Button.tsx" });
    expect(op.action).toBe("Deleting");
    expect(op.filename).toBe("Button.tsx");
  });

  it("falls back to toolName with empty filename for unknown tools", () => {
    const op = getFileOperation("some_other_tool", { command: "do_thing" });
    expect(op.action).toBe("some_other_tool");
    expect(op.filename).toBe("");
  });

  it("extracts filename from nested path", () => {
    const op = getFileOperation("str_replace_editor", { command: "create", path: "/src/components/ui/Button.tsx" });
    expect(op.filename).toBe("Button.tsx");
  });
});

describe("FileOperationBadge", () => {
  it("shows action and filename when in progress", () => {
    render(
      <FileOperationBadge
        operation={{ action: "Creating a new file", filename: "App.jsx" }}
        isDone={false}
      />
    );
    expect(screen.getByText("Creating a new file")).toBeDefined();
    expect(screen.getByText("App.jsx")).toBeDefined();
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  it("shows green dot when done", () => {
    render(
      <FileOperationBadge
        operation={{ action: "Editing", filename: "Card.jsx" }}
        isDone={true}
      />
    );
    expect(screen.getByText("Editing")).toBeDefined();
    expect(screen.getByText("Card.jsx")).toBeDefined();
    expect(document.querySelector(".bg-emerald-500")).toBeTruthy();
    expect(document.querySelector(".animate-spin")).toBeNull();
  });

  it("shows rename with arrow and secondary filename", () => {
    render(
      <FileOperationBadge
        operation={{ action: "Renaming", filename: "old.jsx", secondaryFilename: "new.jsx" }}
        isDone={true}
      />
    );
    expect(screen.getByText("Renaming")).toBeDefined();
    expect(screen.getByText("old.jsx")).toBeDefined();
    expect(screen.getByText("→")).toBeDefined();
    expect(screen.getByText("new.jsx")).toBeDefined();
  });

  it("renders without filename when filename is empty", () => {
    render(
      <FileOperationBadge
        operation={{ action: "some_other_tool", filename: "" }}
        isDone={false}
      />
    );
    expect(screen.getByText("some_other_tool")).toBeDefined();
  });

  it("shows spinner when not done", () => {
    render(
      <FileOperationBadge
        operation={{ action: "Reading", filename: "index.tsx" }}
        isDone={false}
      />
    );
    expect(document.querySelector(".animate-spin")).toBeTruthy();
    expect(document.querySelector(".bg-emerald-500")).toBeNull();
  });
});
