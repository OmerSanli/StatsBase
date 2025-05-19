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
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md mx-auto flex items-center gap-2 p-2 bg-zinc-800 rounded-2xl shadow-md"
    >
      <span className="text-xl">🔍</span>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Kullanıcı adı girin..."
        className="flex-1 bg-transparent outline-none text-white placeholder-zinc-400"
      />
      <button
        type="submit"
        className="px-4 py-1 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition"
      >
        Ara
      </button>
    </form>
  );
}
