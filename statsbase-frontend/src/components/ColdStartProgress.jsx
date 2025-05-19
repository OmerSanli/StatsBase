import { useEffect, useState } from "react";

export default function ColdStartProgress() {
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 95 ? prev + 5 : prev));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="progress-container">
      <p style={{ textAlign: "center", marginBottom: "8px" }}>
        🔄 Sunucu başlatılıyor... %{progress}
      </p>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
