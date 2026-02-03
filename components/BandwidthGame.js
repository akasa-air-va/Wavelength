'use client';

import React, { useState, useEffect } from 'react';
import {
  Gamepad2, Users, Trophy, Sparkles, Zap,
  Target, Lock, ArrowRight
} from 'lucide-react';

/* =======================
   TOPICS
======================= */

const DEFAULT_TOPICS = [
  { left: "Completely Untrustworthy", right: "100% Trustworthy" },
  { left: "Boring Movie", right: "Best Movie Ever" },
  { left: "Worst Food", right: "Best Food" },
  { left: "Least Scary", right: "Most Terrifying" },
  { left: "Weakest Superpower", right: "Strongest Superpower" },
  { left: "Worst Pick-up Line", right: "Best Pick-up Line" },
  { left: "Most Awkward", right: "Most Smooth" },
  { left: "Least Funny", right: "Funniest Thing Ever" }
];

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

/* =======================
   MAIN COMPONENT
======================= */

export default function BandwidthGame() {

  const [screen, setScreen] = useState('home');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const [gameState, setGameState] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);

  const [guess, setGuess] = useState(50);
  const [clue, setClue] = useState('');

  const [customLeft, setCustomLeft] = useState('');
  const [customRight, setCustomRight] = useState('');

  /* =======================
     GAME POLLING
  ======================= */

  useEffect(() => {
    if (!roomCode || !myPlayerId) return;

    const interval = setInterval(async () => {
      try {
        const result = await window.storage.get(`game:${roomCode}`, true);
        if (!result) return;

        const game = JSON.parse(result.value);
        setGameState(game);

        if (game.phase === 'lobby') setScreen('lobby');
        if (game.phase === 'playing') setScreen('game');
        if (game.phase === 'results') setScreen('results');

      } catch {}
    }, 1000);

    return () => clearInterval(interval);
  }, [roomCode, myPlayerId]);

  /* =======================
     CREATE ROOM
  ======================= */

  const createRoom = async () => {

    if (!playerName.trim()) return alert("Enter name!");

    const code = generateRoomCode();
    const id = `player_${Date.now()}_${Math.random()}`;

    const newGame = {
      roomCode: code,
      host: id,
      players: [{ id, name: playerName.trim(), score: 0 }],
      phase: 'lobby',
      currentRound: 0,
      psychicIndex: 0,
      topic: null,
      target: null,
      guesses: [],
      customTopic: null
    };

    await window.storage.set(`game:${code}`, JSON.stringify(newGame), true);

    setRoomCode(code);
    setMyPlayerId(id);
    setGameState(newGame);
    setScreen('lobby');
  };

  /* =======================
     JOIN ROOM
  ======================= */

  const joinRoom = async () => {

    if (!playerName.trim() || !roomCode.trim())
      return alert("Fill all fields!");

    const code = roomCode.toUpperCase();

    const result = await window.storage.get(`game:${code}`, true);
    if (!result) return alert("Room not found!");

    const game = JSON.parse(result.value);

    if (game.players.some(p => p.name === playerName.trim()))
      return alert("Name taken!");

    const id = `player_${Date.now()}_${Math.random()}`;

    game.players.push({ id, name: playerName.trim(), score: 0 });

    await window.storage.set(`game:${code}`, JSON.stringify(game), true);

    setRoomCode(code);
    setMyPlayerId(id);
    setGameState(game);
    setScreen('lobby');
  };

  /* =======================
     START ROUND
  ======================= */

  const startRound = async () => {

    if (myPlayerId !== gameState.host) return;

    if (gameState.players.length < 2)
      return alert("Need 2 players!");

    const topic = gameState.customTopic ||
      DEFAULT_TOPICS[Math.floor(Math.random() * DEFAULT_TOPICS.length)];

    const target = Math.floor(Math.random() * 101);

    const updated = {
      ...gameState,
      phase: 'playing',
      currentRound: gameState.currentRound + 1,
      topic,
      target,
      guesses: [],
      customTopic: null
    };

    await window.storage.set(`game:${roomCode}`, JSON.stringify(updated), true);
    setGameState(updated);
  };

  /* =======================
     SUBMIT GUESS
  ======================= */

  const submitGuess = async () => {

    const psychicId = gameState.players[gameState.psychicIndex].id;

    if (myPlayerId === psychicId) return;

    if (gameState.guesses.some(g => g.playerId === myPlayerId)) return;

    const updatedGuesses = [
      ...gameState.guesses,
      { playerId: myPlayerId, guess }
    ];

    let updatedGame = { ...gameState, guesses: updatedGuesses };

    const nonPsychics = gameState.players.filter(
      (_, i) => i !== gameState.psychicIndex
    );

    if (updatedGuesses.length === nonPsychics.length) {

      updatedGame.players = gameState.players.map(p => {

        const g = updatedGuesses.find(x => x.playerId === p.id);
        if (!g) return p;

        const d = Math.abs(g.guess - gameState.target);

        let pts = 0;
        if (d <= 5) pts = 4;
        else if (d <= 10) pts = 3;
        else if (d <= 20) pts = 2;
        else if (d <= 30) pts = 1;

        return { ...p, score: p.score + pts };
      });

      updatedGame.phase = 'results';
      updatedGame.psychicIndex =
        (gameState.psychicIndex + 1) % gameState.players.length;
    }

    await window.storage.set(`game:${roomCode}`, JSON.stringify(updatedGame), true);
    setGameState(updatedGame);
  };

  /* =======================
     NEXT ROUND
  ======================= */

  const nextRound = async () => {

    if (myPlayerId !== gameState.host) return;

    const updated = {
      ...gameState,
      phase: 'lobby',
      topic: null,
      target: null,
      guesses: []
    };

    await window.storage.set(`game:${roomCode}`, JSON.stringify(updated), true);
    setGameState(updated);
  };

  /* =======================
     CUSTOM TOPIC
  ======================= */

  const setCustomTopic = async () => {

    if (myPlayerId !== gameState.host) return;

    if (!customLeft || !customRight)
      return alert("Fill both!");

    const updated = {
      ...gameState,
      customTopic: {
        left: customLeft.trim(),
        right: customRight.trim()
      }
    };

    await window.storage.set(`game:${roomCode}`, JSON.stringify(updated), true);
    setGameState(updated);

    setCustomLeft('');
    setCustomRight('');
  };

  /* =======================
     HELPERS
  ======================= */

  const psychic =
    gameState?.players[gameState.psychicIndex];

  const isPsychic =
    psychic?.id === myPlayerId;

  const hasGuessed =
    gameState?.guesses?.some(g => g.playerId === myPlayerId);

  /* =======================
     UI
  ======================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white font-mono p-4">

      {/* HOME */}
      {screen === 'home' && (
        <div className="text-center space-y-10 mt-20">

          <Gamepad2 size={90} className="mx-auto text-yellow-300 animate-bounce" />

          <h1 className="text-7xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 text-transparent bg-clip-text">
            BANDWIDTH
          </h1>

          <input
            className="px-6 py-4 bg-black/40 border-2 border-purple-400 rounded-xl text-xl"
            placeholder="YOUR NAME"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
          />

          <div className="flex justify-center gap-6">

            <button onClick={createRoom}
              className="bg-pink-500 px-8 py-4 rounded-xl font-black hover:scale-105">
              CREATE
            </button>

            <button onClick={() => setScreen('join')}
              className="bg-cyan-500 px-8 py-4 rounded-xl font-black hover:scale-105">
              JOIN
            </button>

          </div>
        </div>
      )}

      {/* JOIN */}
      {screen === 'join' && (
        <div className="text-center space-y-6 mt-24">

          <input
            placeholder="ROOM CODE"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value)}
            className="px-6 py-4 text-2xl bg-black/40 border-2 border-cyan-400 rounded-xl"
          />

          <button onClick={joinRoom}
            className="bg-cyan-500 px-10 py-4 rounded-xl font-black hover:scale-105">
            JOIN GAME
          </button>

          <button onClick={() => setScreen('home')}
            className="block mx-auto text-purple-300 mt-6">
            Back
          </button>
        </div>
      )}

      {/* LOBBY */}
      {screen === 'lobby' && gameState && (

        <div className="max-w-3xl mx-auto space-y-6">

          <h2 className="text-center text-5xl font-black text-yellow-300">
            {roomCode}
          </h2>

          {gameState.players.map(p => (
            <div key={p.id}
              className="flex justify-between bg-black/40 p-4 rounded-xl">

              <span>{p.name}</span>
              <span className="text-yellow-300 font-black">{p.score}</span>

            </div>
          ))}

          {myPlayerId === gameState.host && (
            <>
              <div className="flex gap-2">
                <input
                  placeholder="Left extreme"
                  value={customLeft}
                  onChange={e => setCustomLeft(e.target.value)}
                  className="flex-1 bg-black/40 p-2 rounded"
                />
                <input
                  placeholder="Right extreme"
                  value={customRight}
                  onChange={e => setCustomRight(e.target.value)}
                  className="flex-1 bg-black/40 p-2 rounded"
                />
              </div>

              <button onClick={setCustomTopic}
                className="bg-purple-600 px-6 py-3 rounded">
                SET CUSTOM TOPIC
              </button>

              <button onClick={startRound}
                className="bg-green-500 w-full py-4 rounded-xl font-black text-2xl">
                START ROUND
              </button>
            </>
          )}
        </div>
      )}

      {/* GAME */}
      {screen === 'game' && gameState && (

        <div className="max-w-2xl mx-auto space-y-8 text-center">

          <h2 className="text-4xl font-black text-yellow-300">
            ROUND {gameState.currentRound}
          </h2>

          <p className="text-xl">
            {gameState.topic.left} ←→ {gameState.topic.right}
          </p>

          {isPsychic ? (

            <div>
              <p className="text-6xl font-black text-pink-400">
                {gameState.target}
              </p>
              <textarea
                className="mt-4 w-full bg-black/40 p-3 rounded"
                value={clue}
                onChange={e => setClue(e.target.value)}
                placeholder="Give clue..."
              />
            </div>

          ) : (

            !hasGuessed ? (
              <>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={guess}
                  onChange={e => setGuess(+e.target.value)}
                  className="w-full"
                />

                <p className="text-4xl">{guess}</p>

                <button onClick={submitGuess}
                  className="bg-cyan-500 px-10 py-4 rounded-xl font-black">
                  SUBMIT
                </button>
              </>
            ) : (
              <p className="text-green-400 text-3xl">Guess submitted!</p>
            )
          )}

        </div>
      )}

      {/* RESULTS */}
      {screen === 'results' && gameState && (

        <div className="max-w-3xl mx-auto space-y-6">

          <h2 className="text-center text-6xl font-black text-yellow-300">
            {gameState.target}
          </h2>

          {gameState.guesses.map(g => {

            const p = gameState.players.find(x => x.id === g.playerId);

            return (
              <div key={g.playerId}
                className="bg-black/40 p-4 rounded-xl flex justify-between">

                <span>{p.name}</span>
                <span>{g.guess}</span>

              </div>
            );
          })}

          {myPlayerId === gameState.host && (
            <button onClick={nextRound}
              className="bg-green-500 w-full py-4 rounded-xl font-black text-2xl">
              NEXT ROUND
            </button>
          )}
        </div>
      )}

    </div>
  );
}
