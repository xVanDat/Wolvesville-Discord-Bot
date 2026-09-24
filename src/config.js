import 'dotenv/config';
import { language } from './i18n.js';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function positiveInteger(name, fallback) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

export const config = Object.freeze({
  language,
  discordToken: required('DISCORD_TOKEN'),
  discordClientId: required('DISCORD_CLIENT_ID'),
  discordGuildId: process.env.DISCORD_GUILD_ID?.trim() || null,
  wolvesvilleApiKey: required('WOLVESVILLE_API_KEY'),
  wolvesvilleBaseUrl:
    process.env.WOLVESVILLE_API_BASE_URL?.trim() || 'https://api.wolvesville.com',
  wolvesvilleTimeoutMs: positiveInteger('WOLVESVILLE_API_TIMEOUT_MS', 10_000),
});
