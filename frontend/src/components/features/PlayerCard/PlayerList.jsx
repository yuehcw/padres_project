import Modal from "@/components/common/Modal";
import PlayerCard from "@/components/features/PlayerCard/PlayerCard";
import { fetchPlayers } from "@/services/playerbioService";
import { useEffect, useState } from "react";

const PlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState("All");
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const categories = [
    "All",
    "Pitchers",
    "Catchers",
    "Infielders",
    "Outfielders",
  ];

  const getCategoryForPosition = (position) => {
    if (["SP", "RP"].includes(position)) return "Pitchers";
    if (position === "C") return "Catchers";
    if (["1B", "2B", "3B", "SS"].includes(position)) return "Infielders";
    if (["LF", "CF", "RF"].includes(position)) return "Outfielders";
    return "";
  };

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const data = await fetchPlayers();
        setPlayers(data);
      } catch (err) {
        setError("Failed to load players");
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, []);

  const filteredPlayers =
    selectedPosition === "All"
      ? players
      : players.filter(
          (player) =>
            getCategoryForPosition(player.position) === selectedPosition
        );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        <p className="text-xl">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-5xl font-extrabold text-outline text-transparent">
          Roster 2024 July
        </h1>

        <div className="inline-flex bg-stone-800 rounded-full p-1 gap-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedPosition(category)}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedPosition === category
                  ? "bg-accent text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPlayers.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onCardClick={setSelectedPlayer}
          />
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No players found for the selected position.
        </div>
      )}

      {selectedPlayer && (
        <Modal
          playerId={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
};

export default PlayerList;
