const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

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