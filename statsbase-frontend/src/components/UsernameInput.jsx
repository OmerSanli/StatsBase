import { useState } from "react";

export default function UsernameInput({ onSubmit }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-group">
      <span>🔍</span>
      <input
        type="text"
        placeholder="Kullanıcı adı girin..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button type="submit">Ara</button>
    </form>
  );
}
