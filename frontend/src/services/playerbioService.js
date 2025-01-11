const API_URL = import.meta.env.VITE_PROXY_URL || "http://127.0.0.1:5000";

export const fetchPlayers = async () => {
  try {
    const response = await fetch(`${API_URL}/player/bio`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.players;
  } catch (error) {
    console.error("Error fetching players:", error);
    throw error;
  }
};

export const fetchPlayerBio = async (playerId) => {
  try {
    const response = await fetch(`${API_URL}/player/bio/${playerId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch player data");
    }
    const data = await response.json();
    return data.player;
  } catch (error) {
    throw new Error("Error fetching player data: " + error.message);
  }
};
