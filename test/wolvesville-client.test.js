import assert from 'node:assert/strict';
import test from 'node:test';
import { WolvesvilleApiError, WolvesvilleClient } from '../src/api/wolvesville.js';

test('adds required authentication and JSON headers', async () => {
  let request;
  const api = new WolvesvilleClient({ apiKey: 'secret', fetchImpl: async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ username: 'Test' }), { status: 200, headers: { 'content-type': 'application/json' } });
  } });
  await api.findPlayer('Test User');
  assert.equal(request.options.headers.Authorization, 'Bot secret');
  assert.equal(request.options.headers.Accept, 'application/json');
  assert.equal(request.url.searchParams.get('username'), 'Test User');
});

test('turns an API error into a typed error', async () => {
  const api = new WolvesvilleClient({ apiKey: 'secret', fetchImpl: async () => new Response(JSON.stringify({ message: 'Not found' }), { status: 404 }) });
  await assert.rejects(() => api.findPlayer('missing'), (error) => error instanceof WolvesvilleApiError && error.status === 404);
});

test('retries a transient server response', async () => {
  let calls = 0;
  const api = new WolvesvilleClient({ apiKey: 'secret', fetchImpl: async () => {
    calls += 1;
    return calls === 1 ? new Response('{}', { status: 503 }) : new Response('[]', { status: 200 });
  } });
  assert.deepEqual(await api.authorizedClans(), []);
  assert.equal(calls, 2);
});
