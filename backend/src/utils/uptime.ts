const startTime = Date.now();

export function getUptimeMs(): number {
  return Date.now() - startTime;
}

export function getUptimeSeconds(): number {
  return Math.floor(getUptimeMs() / 1000);
}
