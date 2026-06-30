"use client";

import { useState, useEffect } from "react";

interface VisaPackage {
  id: number;
  name: string;
  flag: string;
  price: string;
  visaType: string;
}

interface VisaApplication {
  id: string;
  email: string;
  country: string;
  status: "Pending" | "Approved" | "Rejected";
  date: string;
}

export default function AdminPage() {
  const [visas, setVisas] = useState<VisaPackage[]>([]);
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [stats, setStats] = useState({ totalApps: 0, totalVisas: 0, totalUsers: 0 });
  const [newVisa, setNewVisa] = useState({ name: "", flag: "", price: "", visaType: "" });
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("🤖 AI responses will appear here.");
  const [loading, setLoading] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      const [visasRes, appsRes, statsRes] = await Promise.all([
        fetch("/api/visas"),
        fetch("/api/applications"),
        fetch("/api/stats"),
      ]);
      const visasData = await visasRes.json();
      const appsData = await appsRes.json();
      const statsData = await statsRes.json();
      setVisas(visasData.data || []);
      setApplications(appsData.data || []);
      setStats(statsData.data || { totalApps: 0, totalVisas: 0, totalUsers: 0 });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddVisa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisa.name || !newVisa.flag || !newVisa.price || !newVisa.visaType) {
      alert("সব ফিল্ড পূরণ করুন");
      return;
    }
    try {
      const res = await fetch("/api/visas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVisa),
      });
      if (res.ok) {
        setNewVisa({ name: "", flag: "", price: "", visaType: "" });
        fetchData();
        alert("✅ Visa added successfully!");
      }
    } catch (error) {
      console.error("Failed to add visa:", error);
    }
  };

  const handleStatusUpdate = async (id: string, status: "Approved" | "Rejected") => {
    try {
      const res = await fetch(`/api/applications/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDeleteVisa = async (id: number) => {
    if (!confirm("Delete this visa package?")) return;
    try {
      const res = await fetch(`/api/visas/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Failed to delete visa:", error);
    }
  };

  const handleAskAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiResponse("⏳ Thinking...");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, messages: [] }),
      });
      const data = await res.json();
      setAiResponse(`🧠 ${data.response || "No response"}`);
    } catch (error) {
      setAiResponse("❌ AI error: " + (error as Error).message);
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", width: "100%", minHeight: "100vh", background: "#010101", padding: "0 16px 120px" }}>
      <header className="glass-header">
        <div className="logo-text">🛠 Admin Panel</div>
        <a href="/chat" style={{ background: "#1a1a1f", border: "1px solid #333", color: "#fff", padding: "3px 10px", borderRadius: "10px", fontSize: "10px", cursor: "pointer", textDecoration: "none" }}>
          User Mode
        </a>
      </header>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", margin: "20px 0" }}>
        {[
          { label: "Total Applications", value: stats.totalApps },
          { label: "Active Visas", value: stats.totalVisas },
          { label: "Total Users", value: stats.totalUsers },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "#0f0f13", border: "1px solid #222", borderRadius: "16px", padding: "10px 6px", textAlign: "center" }}>
            <h4 style={{ fontSize: "10px", color: "#8a8a93", marginBottom: "4px" }}>{stat.label}</h4>
            <p style={{ fontSize: "16px", fontWeight: "800", color: "#ff9933" }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Add Visa Form */}
      <div style={{ background: "#0c0c0f", border: "1px solid #1f1f24", borderRadius: "24px", padding: "18px 14px", marginBottom: "20px" }}>
        <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#fff", marginBottom: "14px", borderLeft: "3.5px solid #ff5500", paddingLeft: "8px" }}>
          ➕ Create New Visa Post
        </h4>
        <form onSubmit={handleAddVisa}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <input
              type="text"
              placeholder="Country"
              value={newVisa.name}
              onChange={(e) => setNewVisa({ ...newVisa, name: e.target.value })}
              style={{ background: "#020204", border: "1px solid #2d2d35", borderRadius: "12px", padding: "10px 12px", color: "#fff", fontSize: "16px", outline: "none", fontFamily: "inherit" }}
            />
            <input
              type="text"
              placeholder="Flag Emoji"
              value={newVisa.flag}
              onChange={(e) => setNewVisa({ ...newVisa, flag: e.target.value })}
              style={{ background: "#020204", border: "1px solid #2d2d35", borderRadius: "12px", padding: "10px 12px", color: "#fff", fontSize: "16px", outline: "none", fontFamily: "inherit" }}
            />
            <input
              type="text"
              placeholder="Price"
              value={newVisa.price}
              onChange={(e) => setNewVisa({ ...newVisa, price: e.target.value })}
              style={{ background: "#020204", border: "1px solid #2d2d35", borderRadius: "12px", padding: "10px 12px", color: "#fff", fontSize: "16px", outline: "none", fontFamily: "inherit" }}
            />
            <input
              type="text"
              placeholder="Visa Type"
              value={newVisa.visaType}
              onChange={(e) => setNewVisa({ ...newVisa, visaType: e.target.value })}
              style={{ background: "#020204", border: "1px solid #2d2d35", borderRadius: "12px", padding: "10px 12px", color: "#fff", fontSize: "16px", outline: "none", fontFamily: "inherit" }}
            />
          </div>
          <button type="submit" style={{ background: "#ff5500", color: "#000", fontWeight: "800", fontSize: "13px", padding: "11px", borderRadius: "16px", width: "100%", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 10px rgba(255,85,0,0.25)" }}>
            Publish
          </button>
        </form>
      </div>

      {/* Visa Applications List */}
      <div style={{ background: "#0c0c0f", border: "1px solid #1f1f24", borderRadius: "24px", padding: "18px 14px", marginBottom: "20px" }}>
        <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#fff", marginBottom: "14px", borderLeft: "3.5px solid #ff5500", paddingLeft: "8px" }}>
          📋 Visa Applications
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "280px", overflowY: "auto" }}>
          {applications.length === 0 ? (
            <div style={{ textAlign: "center", color: "#666", fontSize: "11px", padding: "25px" }}>No applications yet</div>
          ) : (
            applications.map((app) => (
              <div key={app.id} style={{ background: "#121217", border: "1px solid #1c1c22", borderRadius: "18px", padding: "12px 14px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <h5 style={{ fontSize: "13px", fontWeight: "700", color: "#fff" }}>{app.country} Visa</h5>
                  <p style={{ fontSize: "11px", color: "#999" }}>User: {app.email}</p>
                  <span style={{
                    fontSize: "10px",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontWeight: "700",
                    display: "inline-block",
                    background: app.status === "Pending" ? "rgba(255,170,0,0.15)" : app.status === "Approved" ? "rgba(0,200,100,0.15)" : "rgba(255,50,50,0.15)",
                    color: app.status === "Pending" ? "#ffa31a" : app.status === "Approved" ? "#00e676" : "#ff3333",
                  }}>
                    {app.status}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => handleStatusUpdate(app.id, "Approved")} style={{ padding: "9px 12px", borderRadius: "12px", cursor: "pointer", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.4)", color: "#00e676", fontSize: "11px", fontWeight: "700", fontFamily: "inherit" }}>
                    ✅ Approve
                  </button>
                  <button onClick={() => handleStatusUpdate(app.id, "Rejected")} style={{ padding: "9px 12px", borderRadius: "12px", cursor: "pointer", background: "rgba(255,51,51,0.1)", border: "1px solid rgba(255,51,51,0.4)", color: "#ff3333", fontSize: "11px", fontWeight: "700", fontFamily: "inherit" }}>
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Visa Packages List */}
      <div style={{ background: "#0c0c0f", border: "1px solid #1f1f24", borderRadius: "24px", padding: "18px 14px", marginBottom: "20px" }}>
        <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#fff", marginBottom: "14px", borderLeft: "3.5px solid #ff5500", paddingLeft: "8px" }}>
          📂 Current Visa Packages
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {visas.map((visa) => (
            <div key={visa.id} style={{ background: "#121217", border: "1px solid #1c1c22", borderRadius: "18px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h5 style={{ fontSize: "13px", fontWeight: "700", color: "#fff" }}>{visa.flag} {visa.name}</h5>
                <p style={{ fontSize: "11px", color: "#999" }}>{visa.price} | {visa.visaType}</p>
              </div>
              <button onClick={() => handleDeleteVisa(visa.id)} style={{ padding: "9px 12px", borderRadius: "12px", cursor: "pointer", background: "rgba(255,51,51,0.08)", border: "1px solid rgba(255,51,51,0.25)", color: "#ff3333", fontSize: "11px", fontWeight: "700", fontFamily: "inherit" }}>
                🗑️ Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Workers AI Section */}
      <div style={{ background: "#0c0c0f", border: "1px solid #00e0ff33", borderRadius: "24px", padding: "18px 14px" }}>
        <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#fff", marginBottom: "14px", borderLeft: "3.5px solid #00e0ff", paddingLeft: "8px" }}>
          🧠 Workers AI · Smart Assist
        </h4>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ask AI about visas..."
            style={{ flex: 2, minWidth: "140px", background: "#020204", border: "1px solid #2d2d35", borderRadius: "12px", padding: "10px 12px", color: "#fff", fontSize: "16px", outline: "none", fontFamily: "inherit" }}
          />
          <button onClick={handleAskAI} style={{ flex: 1, minWidth: "80px", background: "#00b4d8", color: "#000", fontWeight: "800", fontSize: "13px", padding: "11px", borderRadius: "16px", cursor: "pointer", fontFamily: "inherit" }}>
            Ask AI
          </button>
        </div>
        <div style={{ marginTop: "12px", background: "#0a0a0e", borderRadius: "20px", padding: "14px", border: "1px solid #1f1f24", fontSize: "13px", color: "#b0b0b0", minHeight: "50px", wordBreak: "break-word" }}>
          {aiResponse}
        </div>
      </div>
    </div>
  );
}