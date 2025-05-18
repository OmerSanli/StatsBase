import { useState } from 'react'

function App() {
  const [result, setResult] = useState(null);

  const analyzeUser = async () => {
    const response = await fetch("http://localhost:3000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "testuser" }),
    });
    const data = await response.json();
    setResult(data);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>StatsBase</h1>
      <button onClick={analyzeUser}>Test API</button>
      <pre>{result && JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}

export default App;
