const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export class WolvesvilleApiError extends Error {
  constructor(message, { status = null, code = null, retryAfterMs = null } = {}) {
    super(message);
    this.name = 'WolvesvilleApiError';
    this.status = status;
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

function retryDelay(response, attempt) {
  const value = response.headers.get('retry-after');
  if (value) {
    const seconds = Number(value);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);
    const date = Date.parse(value);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  }
  return 500 * 2 ** attempt;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class WolvesvilleClient {
  constructor({ apiKey, baseUrl = 'https://api.wolvesville.com', timeoutMs = 10_000, fetchImpl = fetch }) {
    if (!apiKey) throw new Error('A Wolvesville API key is required.');
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
    this.fetch = fetchImpl;
  }

  async get(path, query = {}, { retries = 2 } = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      let response;
      try {
        response = await this.fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bot ${this.apiKey}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'wolvesville-discord-bot/1.0',
          },
          signal: AbortSignal.timeout(this.timeoutMs),
        });
      } catch (error) {
        if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
          throw new WolvesvilleApiError('Wolvesville API timed out.', { code: 'TIMEOUT' });
        }
        throw new WolvesvilleApiError('Could not connect to Wolvesville API.', { code: 'NETWORK' });
      }

      if (response.ok) {
        if (response.status === 204) return null;
        return response.json();
      }

      const delay = retryDelay(response, attempt);
      if (RETRYABLE_STATUSES.has(response.status) && attempt < retries) {
        await sleep(Math.min(delay, 5_000));
        continue;
      }

      let body = {};
      try {
        body = await response.json();
      } catch {
        // The status is still useful when an upstream proxy returns non-JSON.
      }
      throw new WolvesvilleApiError(
        body.message || body.error || `Wolvesville API returned HTTP ${response.status}.`,
        { status: response.status, code: body.code, retryAfterMs: response.status === 429 ? delay : null },
      );
    }

    throw new WolvesvilleApiError('Wolvesville API request failed.');
  }

  findPlayer(username) { return this.get('/players/search', { username }); }
  highscores() { return this.get('/players/highscores'); }
  roles(locale = 'vi') { return this.get('/roles', { locale }); }
  rotations(locale = 'vi') { return this.get('/roleRotations', { locale }); }
  rankedSeason() { return this.get('/ranked/season'); }
  rankedLeaderboard(language) { return this.get('/ranked/leaderboard', { language }); }
  searchClans(name, exactName = false) { return this.get('/clans/search', { name, exactName }); }
  authorizedClans() { return this.get('/clans/authorized'); }
  clanInfo(clanId) { return this.get(`/clans/${encodeURIComponent(clanId)}/info`); }
  clanMembers(clanId) { return this.get(`/clans/${encodeURIComponent(clanId)}/members`); }
  activeClanQuest(clanId) { return this.get(`/clans/${encodeURIComponent(clanId)}/quests/active`); }
}
