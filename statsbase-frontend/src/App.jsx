import { useState } from "react";
import UsernameInput from "./components/UsernameInput";
import UserDataCard from "./components/UserDataCard";
import ColdStartProgress from "./components/ColdStartProgress";

function App() {
  const [username, setUsername] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coldStart, setColdStart] = useState(false);

  const fetchUserData = async (username) => {
    setUsername(username);
    setUserData(null); // her yeni sorguda eski datayı sıfırla
    setLoading(true);
    setColdStart(false);

    const timeout = setTimeout(() => setColdStart(true), 3000); // 3 sn sonra hala cevap gelmediyse cold start kabul et

    try {
      const res = await fetch(`https://statsbase.onrender.com/api/stats/${username}`);
      const data = await res.json();
      setUserData(data);
    } catch (err) {
      console.error("Veri çekme hatası:", err);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      setColdStart(false);
    }
  };

  return (
    <div className="container">
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "20px", textAlign: "center" }}>
        📊 StatsBase
      </h1>

      <UsernameInput onSubmit={fetchUserData} />

      {loading && coldStart && <ColdStartProgress />}
      {loading && !coldStart && (
        <p style={{ textAlign: "center", marginTop: "20px" }}>⏳ Yükleniyor...</p>
      )}

      {userData && <UserDataCard data={userData} username={username} />}
    </div>
  );
}

export default App;
