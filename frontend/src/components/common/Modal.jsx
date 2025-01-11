import BattingStats from "@/components/features/Modal/battingStats";
import PitchingStats from "@/components/features/Modal/PitchingStats";
import PlayerBio from "@/components/features/Modal/PlayerBio";
import { fetchPlayerBio } from "@/services/playerbioService";
import { useEffect, useState } from "react";

const Modal = ({ playerId, onClose }) => {
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPlayerData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPlayerBio(playerId);
        setPlayerData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPlayerData();
  }, [playerId]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-gray-900 rounded-lg w-[1000px] max-h-[90vh] flex flex-col relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-6 text-gray-300 hover:text-white text-5xl font-bold z-10"
        >
          ×
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-[600px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-[600px] text-red-500">
              {error}
            </div>
          ) : playerData ? (
            <div>
              <PlayerBio player={playerData} />

              <div className="p-6">
                {["SP", "RP"].includes(playerData.position) ? (
                  <PitchingStats playerId={playerId} />
                ) : (
                  <BattingStats playerId={playerId} />
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-[600px] text-gray-300">
              No player data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
