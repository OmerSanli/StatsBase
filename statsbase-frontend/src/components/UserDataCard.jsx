<div className="card">
  <div className="card-title">📊 Kullanıcı Bilgileri</div>

  <div className="info-grid">
    <div className="info-box">👤 Kullanıcı <span>@{username}</span></div>
    <div className="info-box">📣 Takipçi <span>{follower_count}</span></div>
    <div className="info-box">❤️ Beğeni Ortalaması <span>{average_likes}</span></div>
    <div className="info-box">💬 Yorum Ortalaması <span>{average_comments}</span></div>
    <div className="info-box">🎬 Reels Sayısı <span>{reel_count}</span></div>
    <div className="info-box">📈 Etkileşim <span>{engagement_rate}%</span></div>
    <div className="info-box">🤝 İşbirliği Sayısı <span>{collaboration_count}</span></div>
  </div>

  {last_collaborations?.length > 0 && (
    <ul className="collab-list">
      <li>📌 Son İşbirlikleri:</li>
      {last_collaborations.map((brand, idx) => (
        <li key={idx}>✨ {brand}</li>
      ))}
    </ul>
  )}
</div>
