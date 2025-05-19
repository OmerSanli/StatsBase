export default function UserDataCard({ data, username }) {
  const {
    follower_count,
    average_likes,
    average_comments,
    engagement_rate,
    profile_pic_url,
  } = data;

  return (
    <div className="card">
      <div className="card-title">📋 Kullanıcı Bilgileri</div>

      {/* Profil fotoğrafı */}
      {profile_pic_url && (
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img
            src={profile_pic_url}
            alt={`${username} profil fotoğrafı`}
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #ddd"
            }}
          />
        </div>
      )}

      <div className="info-grid">
        <InfoBox label="Kullanıcı" value={`@${username}`} />
        <InfoBox label="Takipçi" value={follower_count?.toLocaleString()} />
        <InfoBox label="Beğeni Ortalaması" value={average_likes?.toFixed(0)} />
        <InfoBox label="Yorum Ortalaması" value={average_comments?.toFixed(0)} />
        <InfoBox label="Etkileşim" value={`${engagement_rate?.toFixed(2)}%`} />
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="info-box">
      <div className="label">{label}</div>
      <span>{value || "Bilinmiyor"}</span>
    </div>
  );
}
