import { useState } from "react";

export default function UsernameInput({ onSubmit }) {
  const [username, setUsername] = useState("");
  const [sessionId, setSessionId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && sessionId.trim()) {
      onSubmit(username.trim(), sessionId.trim());
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="input-group"
      style={{ marginTop: "30px" }}
    >
      <span>🔍</span>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Instagram kullanıcı adı"
      />
      <input
        type="text"
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
        placeholder="sessionid (çerezden alınır)"
        style={{ marginLeft: "10px" }}
      />
      <button type="submit">Ara</button>
    </form>
  );
}
