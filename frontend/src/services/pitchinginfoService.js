const API_URL = import.meta.env.VITE_PROXY_URL || "http://127.0.0.1:5000";

export const fetchPitchingData = async (playerId) => {
  try {
    const response = await fetch(
      `${API_URL}/pitching/info?player_id=${playerId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching pitching data:", error);
    throw error;
  }
};

export const fetchPitchUsageByDate = async (playerId) => {
  try {
    const response = await fetch(
      `${API_URL}/pitching/usage_by_date?player_id=${playerId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching pitch usage by date:", error);
    throw error;
  }
};

export const fetchPitchDistribution = async (playerId) => {
  try {
    const response = await fetch(
      `${API_URL}/pitching/distribution?player_id=${playerId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching pitch distribution:", error);
    throw error;
  }
};

export const fetchPitchingLeaderboard = async () => {
  try {
    const response = await fetch(`${API_URL}/pitching/leaderboard`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Number of players received:", data.data.length);
    return data.data;
  } catch (error) {
    console.error("Error fetching pitching leaderboard:", error);
    throw error;
  }
};
