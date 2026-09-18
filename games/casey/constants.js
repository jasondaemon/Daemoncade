export const TILE_SIZE = 36;
export const CENTER_EPS = 0.9;
export const TURN_WINDOW = TILE_SIZE * 0.35;
export const COLS = 28;
export const ROWS = 31;
export const HUD_HEIGHT = 32;
export const BASE_WIDTH = COLS * TILE_SIZE;
export const BASE_HEIGHT = ROWS * TILE_SIZE + HUD_HEIGHT;

export const PLAYER_SPEED = 148;
export const ENEMY_SPEED = 132;
export const ENEMY_FRIGHT_SPEED = 104;
export const ENEMY_EATEN_SPEED = ENEMY_SPEED * 1.6;

export const POWER_DURATION = 7;
export const BONUS_SCORE = 300;
export const BONUS_INTERVAL_MIN = 15;
export const BONUS_INTERVAL_MAX = 30;
export const BONUS_DURATION = 9;

export const PELLET_SCORE = 10;
export const POWER_SCORE = 0;
export const EAT_SCORES = [200, 400, 800, 1600];

export const LEVEL_SPEED_STEP = 3;
export const FRIGHT_BLINK_TIME = 2.2;
export const FLOW_WINDOW = 1.45;
export const MAX_FLOW_MULTIPLIER = 5;
export const RAMP_AIR_TIME = 0.82;
export const BOOST_DURATION = 3.2;
export const BOOST_SPEED_MULTIPLIER = 1.65;
export const BOOST_MIN_CHARGE = 35;

export const SCATTER_CHASE_SCHEDULE = [
  { mode: "scatter", duration: 7 },
  { mode: "chase", duration: 20 },
  { mode: "scatter", duration: 7 },
  { mode: "chase", duration: 20 },
  { mode: "scatter", duration: 5 },
  { mode: "chase", duration: 20 },
  { mode: "scatter", duration: 5 },
  { mode: "chase", duration: 999 },
];

export const OFFROAD_PARTS = [
  "bumper",
  "shocks",
  "lights",
  "winch",
  "snorkel",
  "roofrack",
  "boards",
];

export const SETTINGS_KEY = "casey.settings";
export const HIGHSCORE_KEY = "casey.highscore";
export const HIGHSCORES_KEY = "casey.highscores";
export const DIFFICULTY_HIGHSCORES_KEY = "casey.highscores.byDifficulty";
export const DIFFICULTY_KEY = "casey.difficulty";

export const DIFFICULTIES = {
  easy: {
    id: "easy",
    label: "Sunday Drive",
    rating: "★",
    description: "Jeeps wander, hesitate, and give Casey more room.",
    intelligence: "local",
    mistakeRate: 0.42,
    speed: 0.9,
    releaseDelay: 1.18,
  },
  normal: {
    id: "normal",
    label: "Trail Rated",
    rating: "★★",
    description: "Balanced rivals with distinct pursuit personalities.",
    intelligence: "local",
    mistakeRate: 0.08,
    speed: 1,
    releaseDelay: 1,
  },
  hard: {
    id: "hard",
    label: "Black Diamond",
    rating: "★★★",
    description: "Jeeps read the maze and hunt by the shortest routes.",
    intelligence: "path",
    mistakeRate: 0,
    speed: 1.07,
    releaseDelay: 0.78,
  },
};
