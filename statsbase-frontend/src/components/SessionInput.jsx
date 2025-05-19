import { useState } from "react";

export default function SessionInput({ onSubmit }) {
  const [session, setSession] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (session.trim()) onSubmit(session.trim());
  };

  return (
    <div className="card">
      <h2>🔐 Instagram Session ID</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          rows="4"
          placeholder="Buraya Instagram session ID’ni yapıştır..."
          value={session}
          onChange={(e) => setSession(e.target.value)}
        />
        <div style={{ marginTop: "12px", textAlign: "right" }}>
          <button type="submit">Kaydet</button>
        </div>
      </form>
    </div>
  );
}
