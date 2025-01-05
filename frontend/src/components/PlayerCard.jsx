import React from 'react';

const PlayerCard = ({ player }) => {
  const formatHeight = (height) => {
    if (!height) return 'N/A';
    const feet = Math.floor(height);
    const inches = Math.round((height - feet) * 12);
    return `${feet}'${inches}"`;
  };

  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-48">
        <img 
          className="w-full h-full object-cover"
          src={player.imageUrl || '/placeholder-player.png'} 
          alt={`${player.firstName} ${player.lastName}`}
          onError={(e) => {
            e.target.src = '/placeholder-player.png';
          }}
        />
      </div>
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2 text-gray-800">
          {player.firstName} {player.lastName}
        </div>
        <div className="space-y-1">
          <p className="text-gray-700">
            <span className="font-semibold">Position:</span> {player.position}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Age:</span> {player.age}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Height:</span> {formatHeight(player.height)}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Weight:</span> {player.weight ? `${player.weight} lbs` : 'N/A'}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">From:</span> {player.birthPlace || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;