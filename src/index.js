import { Client, Events, GatewayIntentBits } from 'discord.js';
import { WolvesvilleClient } from './api/wolvesville.js';
import { commandMap } from './commands/index.js';
import { config } from './config.js';
import { sendError } from './utils/response.js';

const api = new WolvesvilleClient({
  apiKey: config.wolvesvilleApiKey,
  baseUrl: config.wolvesvilleBaseUrl,
  timeoutMs: config.wolvesvilleTimeoutMs,
});
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready as ${readyClient.user.tag}.`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = commandMap.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction, api);
  } catch (error) {
    console.error(`Command ${interaction.commandName} failed:`, error instanceof Error ? error.message : error);
    await sendError(interaction, error);
  }
});

client.on(Events.Error, (error) => console.error('Discord client error:', error.message));

await client.login(config.discordToken);
