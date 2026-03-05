import net from "node:net";

/**
 * Validates CIDR string format (IPv4: a.b.c.d/mask, mask 0-32).
 * Does not validate that the host bits are zero.
 */
export function validateCidr(cidr: string): boolean {
  if (typeof cidr !== "string" || !cidr.trim()) return false;
  const parts = cidr.trim().split("/");
  if (parts.length !== 2) return false;
  const ip = parts[0].trim();
  const maskStr = parts[1].trim();
  if (net.isIP(ip) !== 4) return false;
  const mask = parseInt(maskStr, 10);
  if (Number.isNaN(mask) || mask < 0 || mask > 32) return false;
  return true;
}

/** Parse IPv4 to 32-bit number (big-endian). */
function ipv4ToNumber(ip: string): number | null {
  if (net.isIP(ip) !== 4) return null;
  return ip.split(".").reduce((acc, oct) => (acc << 8) | (parseInt(oct, 10) & 0xff), 0) >>> 0;
}

/**
 * Returns true if the given IP is inside the CIDR range.
 * Supports IPv4 only (e.g. "192.168.1.0/24").
 */
export function isIpInCidr(ip: string, cidr: string): boolean {
  if (net.isIP(ip) !== 4 || !validateCidr(cidr)) return false;
  const [rangeIp, maskStr] = cidr.trim().split("/");
  const mask = parseInt(maskStr, 10);
  const ipNum = ipv4ToNumber(ip);
  const rangeNum = ipv4ToNumber(rangeIp);
  if (ipNum == null || rangeNum == null) return false;
  const maskBits = mask === 0 ? 0 : 0xffffffff << (32 - mask);
  return (ipNum & maskBits) === (rangeNum & maskBits);
}

/**
 * Returns true if the given IP is in any of the CIDR ranges.
 */
export function isIpInAllowlist(ip: string, cidrList: string[]): boolean {
  if (!Array.isArray(cidrList) || cidrList.length === 0) return false;
  return cidrList.some((cidr) => typeof cidr === "string" && isIpInCidr(ip, cidr));
}
