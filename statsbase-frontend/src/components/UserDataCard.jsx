export default function UserDataCard({ data, username }) {
  const {
    follower_count,
    average_likes,
    average_comments,
    reel_count,
    engagement_rate,
    collaboration_count,
    last_collaborations,
  } = data;

  return (
    <div className="card">
      <div className="card-title">📋 Kullanıcı Bilgileri</div>
      <div className="info-grid">
        <InfoBox label="Kullanıcı" value={`@${username}`} />
        <InfoBox label="Takipçi" value={follower_count} />
        <InfoBox label="Beğeni Ortalaması" value={average_likes} />
        <InfoBox label="Yorum Ortalaması" value={average_comments} />
        <InfoBox label="Reels Sayısı" value={reel_count} />
        <InfoBox label="Etkileşim" value={`${engagement_rate}%`} />
        <InfoBox label="İşbirliği Sayısı" value={collaboration_count} />
      </div>

      {last_collaborations?.length > 0 && (
        <ul className="collab-list">
          <strong>📌 Son İşbirlikleri:</strong>
          {last_collaborations.map((brand, idx) => (
            <li key={idx}>✨ {brand}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="info-box">
      <div className="label">{label}</div>
      <span>{value}</span>
    </div>
  );
}
