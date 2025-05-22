import React, { useState } from "react";
import UsernameInput from "./components/UsernameInput";
import UserDataCard from "./components/UserDataCard";
import ColdStartProgress from "./components/ColdStartProgress";
import SessionInput from "./components/SessionInput";

function App() {
  const [username, setUsername] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [coldStart, setColdStart] = useState(false);
  const [sessionid, setSessionid] = useState("");

  const fetchUserData = async (username) => {
    if (!sessionid) {
      alert("Önce Instagram sessionID girin.");
      return;
    }

    setUserData(null);
    setLoading(true);
    setColdStart(false);

    const timeout = setTimeout(() => setColdStart(true), 3000);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/instagram/${username}`, {
        headers: {
          "X-IG-Session": sessionid
        }
      });
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

      <SessionInput onSessionReady={setSessionid} />
      <UsernameInput onSubmit={fetchUserData} />

      {loading && coldStart && <ColdStartProgress />}
      {loading && !coldStart && <p style={{ textAlign: "center", marginTop: "20px" }}>⏳ Yükleniyor...</p>}
      {userData && <UserDataCard data={userData} username={username} />}
    </div>
  );
}

export default App;
