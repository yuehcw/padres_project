const PlayerBio = ({ player }) => {
  const formatHeightWeight = (height, weight) => {
    if (!height || !weight) return "N/A";
    const feet = Math.floor(height);
    const inches = Math.round((height - feet) * 12);
    return `${feet}'${inches}" ${weight}LBS`;
  };

  return (
    <div className="relative">
      {/* Background Image */}
      <div className="w-full h-64 overflow-hidden mt-10">
        <img
          src={"/1.png"}
          alt="Team Logo"
          className="w-[15%] h-auto mx-[5%] object-contain"
        />
      </div>

      {/* Player Headshot Circle */}
      <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-accent">
          <img
            src={player.imageUrl || "/placeholder-headshot.png"}
            alt={`${player.firstName} ${player.lastName}`}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Player Info */}
      <div className="text-center mt-40">
        <h1 className="text-4xl font-bold text-white">
          {player.firstName} {player.lastName}
        </h1>

        <div className="mt-4 text-gray-300 space-y-1">
          <p>
            {player.position} |{" "}
            {formatHeightWeight(player.height, player.weight)} | Age:{" "}
            {player.age}
          </p>
          <p>Birth Place: {player.birthPlace}</p>
        </div>
      </div>
    </div>
  );
};

export default PlayerBio;
