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
