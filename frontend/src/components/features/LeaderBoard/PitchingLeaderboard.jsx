import { fetchPitchingLeaderboard } from "@/services/pitchinginfoService";
import { fetchPlayerBio } from "@/services/playerbioService";
import { useEffect, useState } from "react";

const PitchingLeaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "bbe", 
    direction: "desc", 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPitchingLeaderboard();

        if (!Array.isArray(data)) {
          throw new Error("Invalid data format received");
        }

        const enhancedData = await Promise.all(
          data.map(async (player) => {

            if (!player.player_id) {
              return {
                ...player,
                headshot: "/default-headshot.png",
              };
            }

            try {
              const bioResponse = await fetchPlayerBio(player.player_id);
              const playerData = bioResponse.player || bioResponse;

              return {
                ...player,
                headshot: playerData.imageUrl || "/default-headshot.png",
              };
            } catch (error) {
              return {
                ...player,
                headshot: "/default-headshot.png",
              };
            }
          })
        );

        const sortedData = enhancedData.sort((a, b) => b.bbe - a.bbe);

        const rankedData = sortedData.map((player, index) => ({
          ...player,
          rank: index + 1,
        }));

        setLeaderboardData(rankedData);
      } catch (err) {
        setError("Failed to load leaderboard data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedData = [...leaderboardData].sort((a, b) => {
      if (a[key] === b[key]) return 0;
      if (direction === "asc") {
        return a[key] < b[key] ? -1 : 1;
      }
      return a[key] > b[key] ? -1 : 1;
    });

    const rankedData = sortedData.map((player, index) => ({
      ...player,
      rank: index + 1, 
    }));

    setLeaderboardData(rankedData);
  };

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {/* Category Headers */}
            <th colSpan="5"></th>
            <th
              colSpan="3"
              className="text-center text-xs font-medium text-gray-500 uppercase border-l border-r border-t border-gray-400"
            >
              Exit Velocity (MPH)
            </th>
            <th
              colSpan="2"
              className="text-center text-xs font-medium text-gray-500 uppercase border-l border-r border-t border-gray-400"
            >
              Distance (ft)
            </th>
            <th
              colSpan="2"
              className="text-center text-xs font-medium text-gray-500 uppercase border-l border-r border-t border-gray-400"
            >
              Hard Hit
            </th>
            <th
              colSpan="2"
              className="text-center text-xs font-medium text-gray-500 uppercase border-l border-r border-t border-gray-400"
            >
              Barrels
            </th>
          </tr>
          <tr>
            {/* Column Headers */}
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Rk.
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Player{" "}
            </th>
            <th
              className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer"
              onClick={() => handleSort("bbe")}
            >
              BBE{" "}
              {sortConfig.key === "bbe" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer"
              onClick={() => handleSort("launch_angle")}
            >
              LA (°){" "}
              {sortConfig.key === "launch_angle" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer"
              onClick={() => handleSort("la_sweet_spot_pct")}
            >
              LA SwSp%{" "}
              {sortConfig.key === "la_sweet_spot_pct" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </th>

            {/* Exit Velocity */}
            <th
              className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-l border-gray-400 cursor-pointer"
              onClick={() => handleSort("max_exit_velo")}
            >
              Max
              {sortConfig.key === "max_exit_velo" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer"
              onClick={() => handleSort("avg_exit_velo")}
            >
              Avg
              {sortConfig.key === "avg_exit_velo" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer"
              onClick={() => handleSort("ev50")}
            >
              EV50
              {sortConfig.key === "ev50" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </th>

            {/* Distance */}
            <th
              className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-l border-gray-400 cursor-pointer"
              onClick={() => handleSort("max_distance")}
            >
              Max
              {sortConfig.key === "max_distance" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer"
              onClick={() => handleSort("avg_distance")}
            >
              Avg
              {sortConfig.key === "avg_distance" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </th>

            {/* Hard Hit */}
            <th
              className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-l border-gray-400 cursor-pointer"
              onClick={() => handleSort("hard_hits_calculated")}
            >
              95+ MPH
              {sortConfig.key === "hard_hits_calculated" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer"
              onClick={() => handleSort("hard_hit_pct")}
            >
              %
              {sortConfig.key === "hard_hit_pct" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </th>

            {/* Barrels */}
            <th
              className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-l border-gray-400 cursor-pointer"
              onClick={() => handleSort("barrels")}
            >
              #
              {sortConfig.key === "barrels" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </th>
            <th
              className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r border-gray-400 cursor-pointer"
              onClick={() => handleSort("barrel_pct")}
            >
              BBE %
              {sortConfig.key === "barrel_pct" &&
                (sortConfig.direction === "asc" ? "↑" : "↓")}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {leaderboardData.map((player) => (
            <tr key={player.player_id} className="hover:bg-gray-50">
              <td className="px-3 py-2 whitespace-nowrap text-sm text-black border-b border-t border-gray-400">
                {player.rank}
              </td>
              <td className="px-3 py-2 whitespace-nowrap border-b border-t border-gray-400">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8">
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      src={player.headshot}
                      alt={player.name}
                      onError={(e) => {
                        e.target.src = "/default-headshot.png";
                      }}
                    />
                  </div>
                  <div className="ml-2 text-sm text-black">{player.name}</div>
                </div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-black text-center border-b border-t border-gray-400">
                {player.bbe}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-black text-center border-b border-t border-gray-400">
                {player.launch_angle?.toFixed(1)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-black text-center border-b border-t border-gray-400">
                {player.la_sweet_spot_pct?.toFixed(1)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-black text-center border-b border-t border-l border-gray-400">
                {player.max_exit_velo?.toFixed(1)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-black text-center border-b border-t border-gray-400">
                {player.avg_exit_velo?.toFixed(1)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-black text-center border-b border-t border-r border-gray-400">
                {player.ev50?.toFixed(1)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-black text-center border-b border-t border-gray-400">
                {player.max_distance}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-black text-center border-b border-t border-r border-gray-400">
                {player.avg_distance}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-black text-center border-b border-t border-gray-400">
                {player.hard_hits_calculated}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-black text-center border-b border-t border-r border-gray-400">
                {player.hard_hit_pct?.toFixed(1)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-black text-center border-b border-t border-gray-400">
                {player.barrels}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-black text-center border-b border-t border-r border-gray-400">
                {player.barrel_pct?.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PitchingLeaderboard;
