import { FileOperationBadge, getFileOperation } from "./FileOperationBadge";

interface ToolInvocation {
  toolName: string;
  args: Record<string, unknown>;
  state: "partial-call" | "call" | "result";
  result?: unknown;
}

interface ToolInvocationDisplayProps {
  toolInvocation: ToolInvocation;
}

export function ToolInvocationDisplay({ toolInvocation }: ToolInvocationDisplayProps) {
  const { toolName, args, state, result } = toolInvocation;
  const operation = getFileOperation(toolName, args);
  const isDone = state === "result" && result != null;

  return <FileOperationBadge operation={operation} isDone={isDone} />;
}
