import React, { useState } from "react";

export default function SessionInput({ onSessionReady }) {
  const [session, setSession] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (session.trim()) onSessionReady(session.trim());
  };

  return (
    <div
      className="card"
      style={{
        background: "#1c1c1e",
        color: "#f2f2f7",
        padding: "24px",
        borderRadius: "20px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        marginBottom: "30px"
      }}
    >
      <h2 style={{ fontSize: "1.2rem", marginBottom: "12px" }}>🔐 Instagram Session ID</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          rows="4"
          placeholder="Buraya Instagram session ID’nizi yapıştırın..."
          value={session}
          onChange={(e) => setSession(e.target.value)}
          style={{
            width: "100%",
            background: "#2c2c2e",
            border: "1px solid #3a3a3c",
            borderRadius: "12px",
            padding: "12px",
            color: "#fff",
            fontFamily: "inherit",
            resize: "none"
          }}
        />
        <div style={{ marginTop: "16px", textAlign: "right" }}>
          <button
            type="submit"
            style={{
              background: "#0a84ff",
              color: "#fff",
              padding: "10px 20px",
              border: "none",
              borderRadius: "12px",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
