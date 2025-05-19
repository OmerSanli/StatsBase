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
    <div className="w-full max-w-md mx-auto mt-6 p-6 rounded-2xl shadow-xl bg-white/5 backdrop-blur-md text-white space-y-4 border border-white/10">
      <h2 className="text-2xl font-bold tracking-tight mb-3 flex items-center gap-2">
        📊 Kullanıcı Bilgileri
      </h2>

      <div className="space-y-2 text-sm sm:text-base">
        <div>👤 <span className="font-semibold">Kullanıcı:</span> {username}</div>
        <div>📣 <span className="font-semibold">Takipçi:</span> {follower_count}</div>
        <div>❤️ <span className="font-semibold">Beğeni Ortalaması:</span> {average_likes}</div>
        <div>💬 <span className="font-semibold">Yorum Ortalaması:</span> {average_comments}</div>
        <div>🎬 <span className="font-semibold">Reels Sayısı:</span> {reel_count}</div>
        <div>📈 <span className="font-semibold">Etkileşim:</span> {engagement_rate}%</div>
        <div>🤝 <span className="font-semibold">İşbirliği Sayısı:</span> {collaboration_count}</div>
      </div>

      {last_collaborations?.length > 0 && (
        <div className="mt-4">
          <p className="font-semibold mb-2 flex items-center gap-2">📌 Son İşbirlikleri:</p>
          <div className="flex flex-wrap gap-2">
            {last_collaborations.map((brand, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-white/10 rounded-xl text-sm font-medium hover:bg-white/20 transition"
              >
                ✨ {brand}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
