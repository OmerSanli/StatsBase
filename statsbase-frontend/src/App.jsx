import { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/test`)
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage('Backend error'));
  }, []);

  return (
    <div style={{ padding: "2rem", color: "white", backgroundColor: "#1a1a1a", height: "100vh" }}>
      <h1>StatsBase</h1>
      <p>Backend says: {message}</p>
    </div>
  );
}

export default App;
