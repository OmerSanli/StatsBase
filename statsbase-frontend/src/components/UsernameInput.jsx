import React, { useState } from "react";

export default function UsernameInput({ onSubmit }) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) onSubmit(username.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="input-group"
      style={{
        display: "flex",
        alignItems: "center",
        background: "#2c2c2e",
        borderRadius: "16px",
        padding: "12px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
        maxWidth: "600px",
        margin: "0 auto 20px",
        gap: "10px"
      }}
    >
      <span style={{ fontSize: "1.2rem" }}>🔍</span>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Instagram kullanıcı adı"
        style={{
          flex: 1,
          padding: "10px",
          border: "none",
          outline: "none",
          background: "transparent",
          color: "#f2f2f7",
          fontSize: "1rem"
        }}
      />
      <button
        type="submit"
        style={{
          background: "#0a84ff",
          color: "#fff",
          padding: "10px 16px",
          borderRadius: "10px",
          border: "none",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        Ara
      </button>
    </form>
  );
}
