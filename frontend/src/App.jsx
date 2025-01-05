import React from "react";
import PlayerList from "./components/PlayerList";
import "./styles/App.css";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">MLB Team Roster</h1>
        </div>
      </header>
      <main>
        <PlayerList />
      </main>
    </div>
  );
}

export default App;
