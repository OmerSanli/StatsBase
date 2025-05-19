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
    <div className="w-full max-w-xl mx-auto mt-10 px-6 py-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl backdrop-blur-md">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-2xl">📊</span>
        <h2 className="text-2xl font-bold tracking-tight text-white">Kullanıcı Bilgileri</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-white/90 text-[15px]">
        <InfoCard emoji="👤" label="Kullanıcı" value={`@${username}`} />
        <InfoCard emoji="📣" label="Takipçi" value={follower_count} />
        <InfoCard emoji="❤️" label="Beğeni Ortalaması" value={average_likes} />
        <InfoCard emoji="💬" label="Yorum Ortalaması" value={average_comments} />
        <InfoCard emoji="🎬" label="Reels Sayısı" value={reel_count} />
        <InfoCard emoji="📈" label="Etkileşim" value={`${engagement_rate}%`} />
        <InfoCard emoji="🤝" label="İşbirliği Sayısı" value={collaboration_count} />
      </div>

      {last_collaborations?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            📌 Son İşbirlikleri
          </h3>
          <ul className="list-disc list-inside text-white/80 space-y-1">
            {last_collaborations.map((brand, idx) => (
              <li key={idx}>✨ {brand}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InfoCard({ emoji, label, value }) {
  return (
    <div className="bg-white/5 rounded-xl px-4 py-3 shadow-sm hover:bg-white/10 transition">
      <span className="text-lg">{emoji}</span>{' '}
      <strong className="text-white">{label}:</strong>{' '}
      <span className="block text-sm text-white/80 mt-1">{value}</span>
    </div>
  );
}
