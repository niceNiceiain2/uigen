import { Loader2 } from "lucide-react";

export type FileOperation = {
  action: string;
  filename: string;
  secondaryFilename?: string;
};

export function getFileOperation(
  toolName: string,
  args: Record<string, unknown>
): FileOperation {
  const getFilename = (path: unknown): string => {
    if (typeof path !== "string") return "";
    return path.split("/").filter(Boolean).pop() ?? path;
  };

  if (toolName === "str_replace_editor") {
    const filename = getFilename(args.path);
    switch (args.command) {
      case "create":
        return { action: "Creating a new file", filename };
      case "str_replace":
        return { action: "Editing", filename };
      case "insert":
        return { action: "Adding code to", filename };
      case "view":
        return { action: "Reading", filename };
      default:
        return { action: "Updating", filename };
    }
  }

  if (toolName === "file_manager") {
    const filename = getFilename(args.path);
    if (args.command === "rename" && args.new_path) {
      return {
        action: "Renaming",
        filename,
        secondaryFilename: getFilename(args.new_path),
      };
    }
    if (args.command === "delete") {
      return { action: "Deleting", filename };
    }
  }

  return { action: toolName, filename: "" };
}

interface FileOperationBadgeProps {
  operation: FileOperation;
  isDone: boolean;
}

export function FileOperationBadge({ operation, isDone }: FileOperationBadgeProps) {
  const { action, filename, secondaryFilename } = operation;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
      )}
      <span className="text-neutral-500">{action}</span>
      {filename && (
        <span className="font-mono font-medium text-neutral-800">{filename}</span>
      )}
      {secondaryFilename && (
        <>
          <span className="text-neutral-400">→</span>
          <span className="font-mono font-medium text-neutral-800">{secondaryFilename}</span>
        </>
      )}
    </div>
  );
}
