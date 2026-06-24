import { NextRequest } from "next/server";
import { FileOperationType, FileOperationResult } from "@/types/file-ops";

// In-memory file system for demo (replace with actual FS in production)
const fileSystem = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const toolCall = await request.json();

    const { name, arguments: args } = toolCall.function;
    const result: FileOperationResult = {
      success: false,
      path: args.path || "",
    };

    switch (name) {
      case FileOperationType.READ:
        result.content = fileSystem.get(args.path) || `// File not found: ${args.path}`;
        result.success = true;
        break;

      case FileOperationType.WRITE:
        fileSystem.set(args.path, args.content);
        result.content = args.content;
        result.success = true;
        break;

      case FileOperationType.EDIT:
        const existing = fileSystem.get(args.path) || "";
        const lines = existing.split("\n");
        const startLine = (args.startLine || 1) - 1;
        const endLine = args.endLine || lines.length;
        lines.splice(startLine, endLine - startLine, ...(args.content || "").split("\n"));
        const newContent = lines.join("\n");
        fileSystem.set(args.path, newContent);
        result.content = newContent;
        result.success = true;
        break;

      case FileOperationType.DELETE:
        fileSystem.delete(args.path);
        result.success = true;
        break;

      case FileOperationType.LIST:
        const files = Array.from(fileSystem.keys()).filter((f) => f.startsWith(args.path));
        result.files = files;
        result.success = true;
        break;

      case FileOperationType.CREATE_DIR:
        result.success = true;
        break;

      default:
        result.error = `Unknown operation: ${name}`;
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
