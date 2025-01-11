const PlayerCard = ({ player, onCardClick }) => {
  const formatHeight = (height) => {
    if (!height) return "N/A";
    const feet = Math.floor(height);
    const inches = Math.round((height - feet) * 12);
    return `${feet}'${inches}"`;
  };

  return (
    <div
      className="max-w-sm rounded-xl overflow-hidden shadow-lg bg-stone-800 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 hover:outline hover:outline-4 hover:outline-accent cursor-pointer"
      onClick={() => onCardClick(player.id)}
    >
      <div className="relative h-48">
        <img
          className="w-full h-full object-cover"
          src={player.imageUrl || "/placeholder-player.png"}
          alt={`${player.firstName} ${player.lastName}`}
          onError={(e) => {
            e.target.src = "/placeholder-player.png";
          }}
        />
      </div>
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2 text-white">
          {player.firstName} {player.lastName}
        </div>
        <div className="space-y-1">
          <p className="text-gray-300">
            <span className="font-semibold">Position:</span> {player.position}
          </p>
          {/* <p className="text-gray-300">
            <span className="font-semibold">Age:</span> {player.age}
          </p>
          <p className="text-gray-300">
            <span className="font-semibold">Height:</span>{" "}
            {formatHeight(player.height)}
          </p>
          <p className="text-gray-300">
            <span className="font-semibold">Weight:</span>{" "}
            {player.weight ? `${player.weight} lbs` : "N/A"}
          </p> */}
          {/* <p className="text-gray-300">
            <span className="font-semibold">From:</span>{" "}
            {player.birthPlace || "N/A"}
          </p> */}
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
