import BattingLeaderboard from "@/components/features/LeaderBoard/BattingLeaderboard";
import PitchingLeaderboard from "@/components/features/LeaderBoard/PitchingLeaderboard";

const LeaderboardPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Title */}
      <h1 className="text-5xl font-extrabold text-outline text-transparent mb-8">
        Leaderboard 2024 July
      </h1>

      {/* Pitching Section */}
      <div className="mb-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">
            Pitching Leaderboard
          </h2>
          <PitchingLeaderboard />
        </div>
      </div>

      {/* Batting Section */}
      <div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">
            Batting Leaderboard
          </h2>
          <BattingLeaderboard />
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
