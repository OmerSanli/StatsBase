import { useState } from "react";
import UsernameInput from "./components/UsernameInput";
import UserDataCard from "./components/UserDataCard";


function App() {
  const [username, setUsername] = useState("");
  const [userData, setUserData] = useState(null);

  const fetchUserData = async (username) => {
  try {
    const response = await fetch(`https://statsbase.onrender.com/api/stats/${username}`);
    const json = await response.json();
    setUserData(json);
    setUsername(username); // ← bu eksikti!
  } catch (error) {
    console.error("Veri çekme hatası:", error);
  }
};

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <h1>📊 StatsBase Frontend</h1>
      <UsernameInput onSubmit={fetchUserData} />
      {userData && <UserDataCard data={userData} username={username} />}
    </div>
  );
}

export default App;
