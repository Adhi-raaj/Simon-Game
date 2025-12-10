// game.js — self-contained Simon game (no external libs or sound files)
(() => {
  const COLORS = ["green", "red", "yellow", "blue"];
  let gamePattern = [];
  let userPattern = [];
  let level = 0;
  let started = false;
  let score = 0;
  let highScore = Number(localStorage.getItem("simon_highscore") || 0);
  let soundOn = true;
  let speed = 2; // 1 slow,2 normal,3 fast

  // DOM
  const levelTitle = document.getElementById("level-title");
  const levelSpan = document.getElementById("level");
  const scoreSpan = document.getElementById("score");
  const highSpan = document.getElementById("highscore");
  const startBtn = document.getElementById("start-btn");
  const restartBtn = document.getElementById("restart-btn");
  const soundToggle = document.getElementById("sound-toggle");
  const speedSelect = document.getElementById("speed-select");
  const grid = document.getElementById("grid");

  // Initialize UI
  levelSpan.textContent = level;
  scoreSpan.textContent = score;
  highSpan.textContent = highScore;

  // WebAudio setup for simple tones
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = AudioCtx ? new AudioCtx() : null;

  function playTone(name, duration = 140) {
    if (!audioCtx || !soundOn) return;
    // map colors to frequencies
    const map = { green: 392, red: 262, yellow: 330, blue: 440, wrong: 110 };
    const freq = map[name] || 220;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    o.connect(g);
    g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    o.start();
    g.gain.exponentialRampToValueAtTime(
      0.0001,
      audioCtx.currentTime + duration / 1000
    );
    setTimeout(() => {
      try {
        o.stop();
      } catch (e) {}
    }, duration);
  }

  // flash a button visually and play sound
  function flashButton(color) {
    const el = document.getElementById(color);
    if (!el) return;
    el.classList.add("pulse");
    playTone(color, Math.max(100, flashTime() / 2));
    setTimeout(() => el.classList.remove("pulse"), flashTime());
  }

  function flashTime() {
    // speed 1 -> slow, 2 normal, 3 fast
    return speed === 1 ? 480 : speed === 2 ? 300 : 180;
  }

  // next sequence (add one color and play full pattern)
  function nextSequence() {
    userPattern = [];
    level++;
    levelSpan.textContent = level;
    levelTitle.textContent = `Level ${level}`;
    const rand = COLORS[Math.floor(Math.random() * COLORS.length)];
    gamePattern.push(rand);
    // play pattern sequentially
    let delay = 300;
    for (let i = 0; i < gamePattern.length; i++) {
      setTimeout(() => flashButton(gamePattern[i]), delay);
      delay += flashTime();
    }
  }

  // check user's answer
  function checkAnswer(idx) {
    if (gamePattern[idx] === userPattern[idx]) {
      if (userPattern.length === gamePattern.length) {
        // correct whole sequence
        score += 10 * level;
        scoreSpan.textContent = score;
        setTimeout(nextSequence, 700);
      }
    } else {
      // wrong
      playTone("wrong", 300);
      document.body.classList.add("game-over");
      levelTitle.textContent = "Game Over — Press Start";
      setTimeout(() => document.body.classList.remove("game-over"), 400);
      // update high score
      if (score > highScore) {
        highScore = score;
        localStorage.setItem("simon_highscore", highScore);
        highSpan.textContent = highScore;
      }
      // reset
      started = false;
      gamePattern = [];
      userPattern = [];
      level = 0;
      score = 0;
      levelSpan.textContent = level;
      scoreSpan.textContent = score;
    }
  }

  // start game
  function startGame() {
    if (!started) {
      // resume audio context (some browsers require user gesture)
      if (audioCtx && audioCtx.state === "suspended")
        audioCtx.resume().catch(() => {});
      started = true;
      gamePattern = [];
      userPattern = [];
      level = 0;
      score = 0;
      levelSpan.textContent = level;
      scoreSpan.textContent = score;
      levelTitle.textContent = "Level 0";
      setTimeout(nextSequence, 400);
    }
  }

  // event listeners
  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", () => {
    started = false;
    gamePattern = [];
    userPattern = [];
    level = 0;
    score = 0;
    levelSpan.textContent = level;
    scoreSpan.textContent = score;
    startGame();
  });

  soundToggle.addEventListener("change", (e) => (soundOn = e.target.checked));
  speedSelect.addEventListener("change", (e) => {
    speed = Number(e.target.value);
  });

  // allow keyboard start
  document.addEventListener(
    "keydown",
    (e) => {
      if (!started) startGame();
    },
    { once: false }
  );

  // handle tile clicks / touches
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".color-btn");
    if (!btn) return;
    if (!started) return; // ignore until game started
    const color = btn.id;
    userPattern.push(color);
    flashButton(color);
    checkAnswer(userPattern.length - 1);
  });

  // initialize highscore display if present
  highSpan.textContent = highScore;

  // accessibility: allow Enter to start when focused on Start button
  startBtn.addEventListener("keyup", (e) => {
    if (e.key === "Enter") startGame();
  });

  // small safeguard: prevent accidental double-click drag selection
  document.addEventListener("touchstart", () => {}, { passive: true });
})();
