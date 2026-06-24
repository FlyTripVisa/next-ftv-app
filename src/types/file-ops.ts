export enum FileOperationType {
  READ = "file_read",
  WRITE = "file_write",
  EDIT = "file_edit",
  DELETE = "file_delete",
  LIST = "file_list",
  CREATE_DIR = "dir_create",
  EXECUTE = "execute",
}

export interface FileOperation {
  operation: FileOperationType;
  path: string;
  content?: string;
  startLine?: number;
  endLine?: number;
}

export interface FileOperationResult {
  success: boolean;
  path: string;
  content?: string;
  error?: string;
  files?: string[];
}
