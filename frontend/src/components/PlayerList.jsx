import React, { useState, useEffect } from 'react';
import { fetchPlayers } from '../services/playerbioService';
import PlayerCard from './PlayerCard';

const PlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState('ALL');

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const data = await fetchPlayers();
        setPlayers(data);
      } catch (err) {
        setError('Failed to load players');
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, []);

  const positions = ['ALL', ...new Set(players.map(player => player.position))].sort();
  
  const filteredPlayers = selectedPosition === 'ALL' 
    ? players 
    : players.filter(player => player.position === selectedPosition);

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
      <h1 className="text-3xl font-bold mb-6 text-gray-800">San Diego Padres Roster</h1>
      
      <div className="mb-6">
        <select 
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e.target.value)}
          className="block w-full md:w-auto px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {positions.map(position => (
            <option key={position} value={position}>
              {position === 'ALL' ? 'All Positions' : position}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPlayers.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
      
      {filteredPlayers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No players found for the selected position.
        </div>
      )}
    </div>
  );
};

export default PlayerList;