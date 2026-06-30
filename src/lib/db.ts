import { getCloudflareContext } from "./cloudflare";

export interface VisaPackage {
  id: number;
  name: string;
  flag: string;
  price: string;
  visaType: string;
  description?: string;
  processing_time?: string;
  validity?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Application {
  id: string;
  visa_id?: number;
  user_id?: string;
  email: string;
  full_name?: string;
  phone?: string;
  country: string;
  visa_type?: string;
  status: "Pending" | "Approved" | "Rejected";
  priority?: "Normal" | "High" | "Urgent";
  submission_date?: string;
  updated_at?: string;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: "user" | "admin";
  created_at?: string;
  last_login?: string;
  is_active: boolean;
}

export interface ChatMessage {
  id?: number;
  user_id?: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  tokens_used?: number;
}

export interface FileMetadata {
  id?: number;
  file_key: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  user_id?: string;
  application_id?: string;
  uploaded_at?: string;
  is_deleted: boolean;
}

export interface Payment {
  id?: number;
  application_id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method?: string;
  transaction_id?: string;
  status: "Pending" | "Completed" | "Failed";
  payment_date?: string;
}

// ============================================
// DATABASE OPERATIONS
// ============================================

export class D1Database {
  private db: D1Database;

  constructor() {
    const { db } = getCloudflareContext();
    this.db = db;
  }

  // ---------- VISA OPERATIONS ----------
  async getAllVisas(): Promise<VisaPackage[]> {
    const result = await this.db.prepare(
      "SELECT * FROM visas ORDER BY id DESC"
    ).all();
    return result.results as VisaPackage[];
  }

  async getVisaById(id: number): Promise<VisaPackage | null> {
    const result = await this.db.prepare(
      "SELECT * FROM visas WHERE id = ?"
    ).bind(id).first();
    return result as VisaPackage | null;
  }

  async createVisa(visa: Omit<VisaPackage, "id" | "created_at" | "updated_at">): Promise<number> {
    const result = await this.db.prepare(
      `INSERT INTO visas (name, flag, price, visaType, description, processing_time, validity) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      visa.name,
      visa.flag,
      visa.price,
      visa.visaType,
      visa.description || null,
      visa.processing_time || null,
      visa.validity || null
    ).run();
    return result.meta?.last_row_id || 0;
  }

  async updateVisa(id: number, visa: Partial<VisaPackage>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (visa.name) { fields.push("name = ?"); values.push(visa.name); }
    if (visa.flag) { fields.push("flag = ?"); values.push(visa.flag); }
    if (visa.price) { fields.push("price = ?"); values.push(visa.price); }
    if (visa.visaType) { fields.push("visaType = ?"); values.push(visa.visaType); }
    if (visa.description !== undefined) { fields.push("description = ?"); values.push(visa.description); }
    if (visa.processing_time !== undefined) { fields.push("processing_time = ?"); values.push(visa.processing_time); }
    if (visa.validity !== undefined) { fields.push("validity = ?"); values.push(visa.validity); }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await this.db.prepare(
      `UPDATE visas SET ${fields.join(", ")} WHERE id = ?`
    ).bind(...values).run();

    return result.success;
  }

  async deleteVisa(id: number): Promise<boolean> {
    const result = await this.db.prepare(
      "DELETE FROM visas WHERE id = ?"
    ).bind(id).run();
    return result.success;
  }

  // ---------- APPLICATION OPERATIONS ----------
  async getAllApplications(): Promise<Application[]> {
    const result = await this.db.prepare(
      "SELECT * FROM applications ORDER BY submission_date DESC"
    ).all();
    return result.results as Application[];
  }

  async getApplicationsByUser(email: string): Promise<Application[]> {
    const result = await this.db.prepare(
      "SELECT * FROM applications WHERE email = ? ORDER BY submission_date DESC"
    ).bind(email).all();
    return result.results as Application[];
  }

  async getApplicationById(id: string): Promise<Application | null> {
    const result = await this.db.prepare(
      "SELECT * FROM applications WHERE id = ?"
    ).bind(id).first();
    return result as Application | null;
  }

  async createApplication(app: Omit<Application, "submission_date" | "updated_at">): Promise<string> {
    const id = `app_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const result = await this.db.prepare(
      `INSERT INTO applications (id, visa_id, user_id, email, full_name, phone, country, visa_type, status, priority, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      app.visa_id || null,
      app.user_id || null,
      app.email,
      app.full_name || null,
      app.phone || null,
      app.country,
      app.visa_type || null,
      app.status || "Pending",
      app.priority || "Normal",
      app.notes || null
    ).run();
    return id;
  }

  async updateApplicationStatus(id: string, status: "Pending" | "Approved" | "Rejected"): Promise<boolean> {
    const result = await this.db.prepare(
      "UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(status, id).run();
    return result.success;
  }

  async updateApplication(id: string, data: Partial<Application>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.status) { fields.push("status = ?"); values.push(data.status); }
    if (data.priority) { fields.push("priority = ?"); values.push(data.priority); }
    if (data.full_name) { fields.push("full_name = ?"); values.push(data.full_name); }
    if (data.phone) { fields.push("phone = ?"); values.push(data.phone); }
    if (data.notes !== undefined) { fields.push("notes = ?"); values.push(data.notes); }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await this.db.prepare(
      `UPDATE applications SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(...values).run();

    return result.success;
  }

  // ---------- USER OPERATIONS ----------
  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db.prepare(
      "SELECT * FROM users WHERE email = ?"
    ).bind(email).first();
    return result as User | null;
  }

  async createUser(user: Omit<User, "created_at" | "last_login">): Promise<string> {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const result = await this.db.prepare(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      user.email,
      user.password_hash,
      user.full_name || null,
      user.phone || null,
      user.role || "user",
      user.is_active ? 1 : 0
    ).run();
    return id;
  }

  async updateUserLastLogin(email: string): Promise<boolean> {
    const result = await this.db.prepare(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = ?"
    ).bind(email).run();
    return result.success;
  }

  // ---------- CHAT HISTORY OPERATIONS ----------
  async saveChatMessage(message: Omit<ChatMessage, "id" | "timestamp">): Promise<number> {
    const result = await this.db.prepare(
      `INSERT INTO chat_history (user_id, session_id, role, content, tokens_used)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      message.user_id || null,
      message.session_id,
      message.role,
      message.content,
      message.tokens_used || 0
    ).run();
    return result.meta?.last_row_id || 0;
  }

  async getChatHistory(session_id: string, limit: number = 50): Promise<ChatMessage[]> {
    const result = await this.db.prepare(
      "SELECT * FROM chat_history WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?"
    ).bind(session_id, limit).all();
    return result.results as ChatMessage[];
  }

  // ---------- FILE METADATA OPERATIONS ----------
  async saveFileMetadata(file: Omit<FileMetadata, "id" | "uploaded_at" | "is_deleted">): Promise<number> {
    const result = await this.db.prepare(
      `INSERT INTO file_metadata (file_key, file_name, file_size, mime_type, user_id, application_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      file.file_key,
      file.file_name,
      file.file_size,
      file.mime_type,
      file.user_id || null,
      file.application_id || null
    ).run();
    return result.meta?.last_row_id || 0;
  }

  async getFileByKey(file_key: string): Promise<FileMetadata | null> {
    const result = await this.db.prepare(
      "SELECT * FROM file_metadata WHERE file_key = ? AND is_deleted = 0"
    ).bind(file_key).first();
    return result as FileMetadata | null;
  }

  async deleteFileMetadata(file_key: string): Promise<boolean> {
    const result = await this.db.prepare(
      "UPDATE file_metadata SET is_deleted = 1 WHERE file_key = ?"
    ).bind(file_key).run();
    return result.success;
  }

  // ---------- PAYMENT OPERATIONS ----------
  async createPayment(payment: Omit<Payment, "id" | "payment_date" | "status">): Promise<number> {
    const result = await this.db.prepare(
      `INSERT INTO payments (application_id, user_id, amount, currency, payment_method, transaction_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      payment.application_id,
      payment.user_id,
      payment.amount,
      payment.currency || "USD",
      payment.payment_method || null,
      payment.transaction_id || null,
      payment.status || "Pending"
    ).run();
    return result.meta?.last_row_id || 0;
  }

  async updatePaymentStatus(transaction_id: string, status: "Pending" | "Completed" | "Failed"): Promise<boolean> {
    const result = await this.db.prepare(
      "UPDATE payments SET status = ? WHERE transaction_id = ?"
    ).bind(status, transaction_id).run();
    return result.success;
  }

  // ---------- STATISTICS ----------
  async getDashboardStats() {
    const [totalApps, totalVisas, totalUsers, pendingApps, approvedApps, rejectedApps] = await Promise.all([
      this.db.prepare("SELECT COUNT(*) as count FROM applications").first(),
      this.db.prepare("SELECT COUNT(*) as count FROM visas").first(),
      this.db.prepare("SELECT COUNT(DISTINCT email) as count FROM applications").first(),
      this.db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'Pending'").first(),
      this.db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'Approved'").first(),
      this.db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'Rejected'").first(),
    ]);

    return {
      totalApplications: totalApps?.count || 0,
      totalVisas: totalVisas?.count || 0,
      totalUsers: totalUsers?.count || 0,
      pendingApplications: pendingApps?.count || 0,
      approvedApplications: approvedApps?.count || 0,
      rejectedApplications: rejectedApps?.count || 0,
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================
let dbInstance: D1Database | null = null;

export function getDatabase(): D1Database {
  if (!dbInstance) {
    dbInstance = new D1Database();
  }
  return dbInstance;
}