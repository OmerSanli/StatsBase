import { useState, useEffect } from "react";

export default function SessionInput({ onSessionReady }) {
  const [sessionid, setSessionid] = useState("");
  const [hasSavedSession, setHasSavedSession] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ig_sessionid");
    if (stored) {
      setHasSavedSession(true);
      onSessionReady(stored); // sessioni backend'e iletiriz
    }
  }, [onSessionReady]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sessionid.trim()) {
      localStorage.setItem("ig_sessionid", sessionid.trim());
      onSessionReady(sessionid.trim());
      setHasSavedSession(true);
    }
  };

  const handleReset = () => {
    localStorage.removeItem("ig_sessionid");
    setSessionid("");
    setHasSavedSession(false);
  };

  if (hasSavedSession) {
    return (
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        ✅ Instagram oturumu bulundu.
        <br />
        <button onClick={handleReset} style={{ marginTop: "10px" }}>
          🔄 Değiştir
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="input-group" style={{ marginTop: "20px" }}>
      <input
        type="text"
        placeholder="Instagram sessionid giriniz..."
        value={sessionid}
        onChange={(e) => setSessionid(e.target.value)}
      />
      <button type="submit">Kaydet</button>
    </form>
  );
}
