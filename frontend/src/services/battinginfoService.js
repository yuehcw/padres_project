const API_URL = import.meta.env.VITE_PROXY_URL || "http://127.0.0.1:5000";

export const fetchBattingStats = async (playerId) => {
  try {
    const response = await fetch(
      `${API_URL}/batting/stats?player_id=${playerId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching batting stats:", error);
    throw error;
  }
};

export const fetchSprayChartData = async (playerId) => {
  try {
    const response = await fetch(
      `${API_URL}/batting/spray-chart?player_id=${playerId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching spray chart data:", error);
    throw error;
  }
};

export const fetchZoneHeatmapData = async (playerId) => {
  try {
    const response = await fetch(
      `${API_URL}/batting/zone-heatmap?player_id=${playerId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching zone heatmap data:", error);
    throw error;
  }
};

export const fetchPitchTrends = async (playerId) => {
  try {
    const response = await fetch(
      `${API_URL}/batting/pitch-trends?player_id=${playerId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching pitch trends data:", error);
    throw error;
  }
};

export const fetchBattingLeaderboard = async () => {
  try {
    const response = await fetch(`${API_URL}/batting/leaderboard`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching batting leaderboard:", error);
    throw error;
  }
};