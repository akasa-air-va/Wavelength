'use client';

import React, { useState, useEffect } from 'react';
import { Gamepad2, Users, Trophy, Sparkles, Zap, Target, Lock, ArrowRight } from 'lucide-react';
import storage from '../utils/storage';

// Default topics
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
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

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

  // 🌍 GLOBAL REALTIME SYNC
  useEffect(() => {
    if (!roomCode) return;

    const loadGame = async () => {
      try {
        const result = await storage.get(`game:${roomCode}`);
        if (!result) return;

        const game = result.value;
        setGameState(game);

        if (game.phase === 'lobby') setScreen('lobby');
        if (game.phase === 'playing') setScreen('game');
        if (game.phase === 'results') setScreen('results');
      } catch (err) {
        console.log(err);
      }
    };

    loadGame();

    const sub = storage.subscribe(() => {
      loadGame();
    });

    return () => sub.unsubscribe();
  }, [roomCode]);

  const createRoom = async () => {
    if (!playerName.trim()) return alert('Enter name');

    const code = generateRoomCode();
    const playerId = `player_${Date.now()}_${Math.random()}`;

    const newGame = {
      roomCode: code,
      host: playerId,
      players: [{ id: playerId, name: playerName.trim(), score: 0 }],
      phase: 'lobby',
      currentRound: 0,
      psychicIndex: 0,
      topic: null,
      target: null,
      guesses: [],
      customTopic: null
    };

    await storage.set(`game:${code}`, newGame);

    setRoomCode(code);
    setMyPlayerId(playerId);
    setGameState(newGame);
    setScreen('lobby');
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) return alert('Missing info');

    const code = roomCode.toUpperCase().trim();
    const result = await storage.get(`game:${code}`);

    if (!result) return alert('Room not found');

    const game = result.value;
    const playerId = `player_${Date.now()}_${Math.random()}`;

    if (game.players.some(p => p.name === playerName.trim()))
      return alert('Name already taken');

    game.players.push({ id: playerId, name: playerName.trim(), score: 0 });

    await storage.set(`game:${code}`, game);

    setRoomCode(code);
    setMyPlayerId(playerId);
    setGameState(game);
    setScreen('lobby');
  };

  const startRound = async () => {
    if (myPlayerId !== gameState.host) return;
    if (gameState.players.length < 2) return alert('Need 2 players');

    const topic =
      gameState.customTopic ||
      DEFAULT_TOPICS[Math.floor(Math.random() * DEFAULT_TOPICS.length)];

    const updatedGame = {
      ...gameState,
      phase: 'playing',
      currentRound: gameState.currentRound + 1,
      topic,
      target: Math.floor(Math.random() * 101),
      guesses: [],
      customTopic: null
    };

    await storage.set(`game:${roomCode}`, updatedGame);
    setGameState(updatedGame);
    setClue('');
  };

  const submitGuess = async () => {
    const psychicId = gameState.players[gameState.psychicIndex].id;
    if (myPlayerId === psychicId) return;

    if (gameState.guesses.some(g => g.playerId === myPlayerId)) return;

    const updatedGuesses = [...gameState.guesses, { playerId: myPlayerId, guess }];
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

    await storage.set(`game:${roomCode}`, updatedGame);
    setGameState(updatedGame);
  };

const nextRound = async () => {
  if (myPlayerId !== gameState.host) return;

  const updatedGame = {
    ...gameState,
    phase: 'lobby',
    topic: null,
    target: null,
    guesses: []
  };

  await storage.set(`game:${roomCode}`, updatedGame);
  setGameState(updatedGame);
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white font-mono p-4 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* HOME SCREEN */}
        {screen === 'home' && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="inline-block animate-bounce">
                <Gamepad2 size={80} className="text-yellow-300 drop-shadow-glow" />
              </div>
              <h1 className="text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 drop-shadow-lg animate-gradient bg-[length:200%_200%]">
                BANDWIDTH
              </h1>
              <p className="text-xl text-purple-200 tracking-wide">The Ultimate Spectrum Guessing Game</p>
            </div>

            <div className="bg-black/40 backdrop-blur-xl border-4 border-purple-400 rounded-3xl p-8 max-w-md mx-auto shadow-2xl shadow-purple-500/50">
              <input
                type="text"
                placeholder="YOUR NAME"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-6 py-4 bg-purple-900/50 border-2 border-purple-400 rounded-xl text-white placeholder-purple-300 text-center text-xl font-bold tracking-wider focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-400/50 transition-all"
                maxLength={20}
              />

              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={createRoom}
                  className="group relative px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl font-black text-xl tracking-wide hover:scale-105 active:scale-95 transition-all shadow-lg shadow-pink-500/50 hover:shadow-pink-500/80"
                >
                  <Sparkles className="inline mr-2 group-hover:rotate-12 transition-transform" size={24} />
                  CREATE
                </button>
                <button
                  onClick={() => setScreen('join')}
                  className="group relative px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-black text-xl tracking-wide hover:scale-105 active:scale-95 transition-all shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/80"
                >
                  <Users className="inline mr-2 group-hover:scale-110 transition-transform" size={24} />
                  JOIN
                </button>
              </div>
            </div>

            <div className="bg-purple-900/30 backdrop-blur-sm border-2 border-purple-400/50 rounded-2xl p-6 max-w-2xl mx-auto">
              <h3 className="text-2xl font-black text-yellow-300 mb-4">HOW TO PLAY</h3>
              <div className="space-y-3 text-left text-purple-100 text-sm">
                <p>🎯 One player is the <span className="text-pink-400 font-bold">PSYCHIC</span> each round</p>
                <p>🎲 Psychic gets a secret number on a spectrum (0-100)</p>
                <p>💬 Psychic gives a clue to help others guess</p>
                <p>🎮 Players submit guesses and earn points based on accuracy</p>
                <p>🏆 Closest guess = Most points!</p>
              </div>
            </div>
          </div>
        )}

        {/* JOIN SCREEN */}
        {screen === 'join' && (
          <div className="text-center space-y-8 animate-fade-in">
            <button
              onClick={() => setScreen('home')}
              className="text-purple-300 hover:text-white transition-colors flex items-center gap-2 mx-auto"
            >
              ← Back
            </button>
            
            <div className="bg-black/40 backdrop-blur-xl border-4 border-cyan-400 rounded-3xl p-8 max-w-md mx-auto shadow-2xl shadow-cyan-500/50">
              <Lock className="mx-auto mb-4 text-cyan-300" size={60} />
              <h2 className="text-4xl font-black mb-6 text-cyan-300">ENTER CODE</h2>
              
              <input
                type="text"
                placeholder="ROOM CODE"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-6 py-4 bg-cyan-900/50 border-2 border-cyan-400 rounded-xl text-white placeholder-cyan-300 text-center text-2xl font-black tracking-widest focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/50 transition-all mb-6"
                maxLength={6}
              />

              <button
                onClick={joinRoom}
                className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-black text-xl tracking-wide hover:scale-105 active:scale-95 transition-all shadow-lg shadow-cyan-500/50"
              >
                JOIN GAME
                <ArrowRight className="inline ml-2" size={24} />
              </button>
            </div>
          </div>
        )}

        {/* LOBBY SCREEN */}
        {screen === 'lobby' && gameState && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="inline-block bg-black/50 backdrop-blur-xl border-4 border-yellow-400 rounded-2xl px-8 py-4 shadow-2xl shadow-yellow-500/50">
                <p className="text-sm text-yellow-300 font-bold mb-1">ROOM CODE</p>
                <p className="text-5xl font-black tracking-widest text-yellow-300">{roomCode}</p>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-xl border-4 border-purple-400 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black text-purple-300 flex items-center gap-3">
                  <Users size={32} />
                  PLAYERS ({gameState.players.length})
                </h2>
                <button
                  onClick={leaveGame}
                  className="px-4 py-2 bg-red-500/20 border-2 border-red-400 rounded-lg text-red-300 hover:bg-red-500/40 transition-all"
                >
                  LEAVE
                </button>
              </div>

              <div className="space-y-3">
                {gameState.players.map((player, idx) => (
                  <div
                    key={player.id}
                    className={`p-4 rounded-xl border-2 ${
                      player.id === myPlayerId
                        ? 'bg-pink-500/30 border-pink-400'
                        : 'bg-purple-900/30 border-purple-400/50'
                    } flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${
                        idx === gameState.psychicIndex ? 'bg-gradient-to-br from-yellow-400 to-pink-500' : 'bg-purple-500'
                      } flex items-center justify-center font-black text-xl`}>
                        {player.name[0].toUpperCase()}
                      </div>
                      <span className="font-bold text-lg">{player.name}</span>
                      {player.id === gameState.host && (
                        <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-black rounded">HOST</span>
                      )}
                      {idx === gameState.psychicIndex && (
                        <span className="px-2 py-1 bg-pink-500 text-white text-xs font-black rounded animate-pulse">NEXT PSYCHIC</span>
                      )}
                    </div>
                    <div className="text-2xl font-black text-yellow-300">{player.score}</div>
                  </div>
                ))}
              </div>

              {myPlayerId === gameState.host && (
                <div className="mt-8 space-y-4">
                  <div className="bg-purple-900/50 border-2 border-purple-400/50 rounded-xl p-4">
                    <h3 className="text-lg font-black text-purple-300 mb-3">CUSTOM TOPIC (OPTIONAL)</h3>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Left extreme (e.g., Boring)"
                        value={customLeft}
                        onChange={(e) => setCustomLeft(e.target.value)}
                        className="w-full px-4 py-2 bg-purple-900/50 border border-purple-400 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-pink-400"
                        maxLength={50}
                      />
                      <input
                        type="text"
                        placeholder="Right extreme (e.g., Amazing)"
                        value={customRight}
                        onChange={(e) => setCustomRight(e.target.value)}
                        className="w-full px-4 py-2 bg-purple-900/50 border border-purple-400 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-pink-400"
                        maxLength={50}
                      />
                      <button
                        onClick={setCustomTopic}
                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold transition-all"
                      >
                        SET CUSTOM TOPIC
                      </button>
                    </div>
                    {gameState.customTopic && (
                      <div className="mt-3 p-3 bg-green-500/20 border border-green-400 rounded-lg">
                        <p className="text-green-300 text-sm font-bold">
                          ✓ Next round: {gameState.customTopic.left} ←→ {gameState.customTopic.right}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={startRound}
                    disabled={gameState.players.length < 2}
                    className="w-full px-8 py-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-black text-2xl tracking-wide hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Zap className="inline mr-2" size={28} />
                    START ROUND {gameState.currentRound + 1}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* GAME SCREEN */}
        {screen === 'game' && gameState && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-4xl font-black text-yellow-300 mb-2">ROUND {gameState.currentRound}</h2>
              <div className="inline-block bg-pink-500/20 border-2 border-pink-400 rounded-xl px-6 py-3">
                <p className="text-sm text-pink-300 font-bold mb-1">PSYCHIC</p>
                <p className="text-2xl font-black text-pink-300">{psychicPlayer?.name}</p>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-xl border-4 border-yellow-400 rounded-3xl p-8 shadow-2xl">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-black text-yellow-300">SPECTRUM</h3>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-left">
                    <p className="text-sm text-purple-300 font-bold mb-1">0</p>
                    <p className="text-lg font-black text-purple-200">{gameState.topic.left}</p>
                  </div>
                  <div className="flex-1 h-3 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 rounded-full"></div>
                  <div className="flex-1 text-right">
                    <p className="text-sm text-yellow-300 font-bold mb-1">100</p>
                    <p className="text-lg font-black text-yellow-200">{gameState.topic.right}</p>
                  </div>
                </div>
              </div>
            </div>

            {isPsychic ? (
              <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-xl border-4 border-pink-400 rounded-3xl p-8 shadow-2xl animate-pulse">
                <Target className="mx-auto mb-4 text-pink-300" size={60} />
                <h3 className="text-3xl font-black text-pink-300 text-center mb-6">YOU ARE THE PSYCHIC!</h3>
                <div className="bg-black/40 rounded-2xl p-6 mb-6">
                  <p className="text-sm text-pink-300 font-bold mb-2 text-center">YOUR SECRET TARGET</p>
                  <p className="text-7xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-400">
                    {gameState.target}
                  </p>
                </div>
                <div className="space-y-3">
                  <label className="block text-purple-300 font-bold">Give a clue to help others guess:</label>
                  <textarea
                    value={clue}
                    onChange={(e) => setClue(e.target.value)}
                    placeholder="Example: 'This is like how I feel about pineapple on pizza'"
                    className="w-full px-4 py-3 bg-purple-900/50 border-2 border-purple-400 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:border-pink-400 h-24 resize-none"
                    maxLength={200}
                  />
                  <p className="text-purple-300 text-sm">Share this clue verbally or in chat to help players guess!</p>
                </div>
              </div>
            ) : (
              <div className="bg-black/40 backdrop-blur-xl border-4 border-cyan-400 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-3xl font-black text-cyan-300 text-center mb-6">MAKE YOUR GUESS</h3>
                
                {!hasGuessed ? (
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-purple-300 font-bold">0</span>
                        <span className="text-4xl font-black text-cyan-300">{guess}</span>
                        <span className="text-yellow-300 font-bold">100</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={guess}
                        onChange={(e) => setGuess(parseInt(e.target.value))}
                        className="w-full h-4 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 rounded-full appearance-none cursor-pointer slider"
                      />
                    </div>
                    
                    <button
                      onClick={submitGuess}
                      className="w-full px-8 py-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-black text-2xl tracking-wide hover:scale-105 active:scale-95 transition-all shadow-lg shadow-cyan-500/50"
                    >
                      SUBMIT GUESS
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="text-6xl">✓</div>
                    <p className="text-2xl font-black text-green-400">GUESS SUBMITTED!</p>
                    <p className="text-lg text-purple-300">Your guess: <span className="text-white font-black text-2xl">{guess}</span></p>
                    <p className="text-purple-300">Waiting for other players...</p>
                    <div className="pt-4">
                      <p className="text-sm text-purple-400">
                        {gameState.guesses.length} / {gameState.players.length - 1} players have guessed
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isPsychic && gameState.guesses.length > 0 && (
              <div className="bg-purple-900/30 border-2 border-purple-400 rounded-2xl p-4 text-center">
                <p className="text-purple-300">
                  {gameState.guesses.length} / {gameState.players.length - 1} players have guessed
                </p>
              </div>
            )}
          </div>
        )}

        {/* RESULTS SCREEN */}
        {screen === 'results' && gameState && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <Trophy className="mx-auto mb-4 text-yellow-300 animate-bounce" size={80} />
              <h2 className="text-5xl font-black text-yellow-300 mb-2">ROUND RESULTS</h2>
            </div>

            <div className="bg-black/40 backdrop-blur-xl border-4 border-yellow-400 rounded-3xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <p className="text-sm text-yellow-300 font-bold mb-2">TARGET NUMBER</p>
                <p className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
                  {gameState.target}
                </p>
                <p className="text-lg text-purple-300 mt-4">
                  <span className="font-bold">Psychic:</span> {psychicPlayer?.name}
                </p>
              </div>

              <div className="space-y-3">
                {gameState.guesses
                  .map(g => {
                    const player = gameState.players.find(p => p.id === g.playerId);
                    const distance = Math.abs(g.guess - gameState.target);
                    let points = 0;
                    if (distance <= 5) points = 4;
                    else if (distance <= 10) points = 3;
                    else if (distance <= 20) points = 2;
                    else if (distance <= 30) points = 1;
                    return { ...g, player, distance, points };
                  })
                  .sort((a, b) => a.distance - b.distance)
                  .map((result, idx) => (
                    <div
                      key={result.playerId}
                      className={`p-4 rounded-xl border-2 ${
                        idx === 0
                          ? 'bg-yellow-500/30 border-yellow-400'
                          : 'bg-purple-900/30 border-purple-400/50'
                      } flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl font-black text-yellow-300">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                        </span>
                        <div>
                          <p className="font-black text-xl">{result.player.name}</p>
                          <p className="text-sm text-purple-300">
                            Guess: {result.guess} (Off by {result.distance})
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-yellow-300">+{result.points}</p>
                        <p className="text-sm text-purple-300">points</p>
                      </div>
                    </div>
                  ))}
              </div>

              {myPlayerId === gameState.host && (
                <button
                  onClick={nextRound}
                  className="w-full mt-8 px-8 py-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-black text-2xl tracking-wide hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-500/50"
                >
                  NEXT ROUND
                  <ArrowRight className="inline ml-2" size={28} />
                </button>
              )}

              {myPlayerId !== gameState.host && (
                <p className="text-center mt-6 text-purple-300">Waiting for host to start next round...</p>
              )}
            </div>

            <div className="bg-purple-900/30 backdrop-blur-sm border-2 border-purple-400 rounded-2xl p-6">
              <h3 className="text-2xl font-black text-purple-300 mb-4 flex items-center gap-2">
                <Trophy size={24} />
                LEADERBOARD
              </h3>
              <div className="space-y-2">
                {[...gameState.players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, idx) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-purple-900/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-black text-yellow-300 w-8">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                        </span>
                        <span className="font-bold">{player.name}</span>
                      </div>
                      <span className="text-2xl font-black text-yellow-300">{player.score}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .delay-2000 {
          animation-delay: 2s;
        }

        .delay-4000 {
          animation-delay: 4s;
        }

        .drop-shadow-glow {
          filter: drop-shadow(0 0 20px rgba(253, 224, 71, 0.8));
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 30px;
          height: 30px;
          background: white;
          border: 4px solid #fbbf24;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.8);
        }

        .slider::-moz-range-thumb {
          width: 30px;
          height: 30px;
          background: white;
          border: 4px solid #fbbf24;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.8);
        }
      `}</style>
    </div>
  );
}
