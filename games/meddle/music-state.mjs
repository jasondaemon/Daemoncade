export function musicRequestCurrent(request, currentRequest, enabled, volume, hidden) {
  return request === currentRequest && enabled && volume > 0 && !hidden;
}

export function effectiveMusicVolume(enabled, volume, duckFactor = 1) {
  if (!enabled || volume <= 0) return 0;
  return Math.max(0, Math.min(1, volume * Math.max(0, Math.min(1, duckFactor))));
}

export function cueAllowed(now, lastPlayed, minimumInterval) {
  return !Number.isFinite(lastPlayed) || now - lastPlayed >= minimumInterval;
}
