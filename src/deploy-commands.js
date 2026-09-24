import { REST, Routes } from 'discord.js';
import { commands } from './commands/index.js';
import { config } from './config.js';

const rest = new REST({ version: '10' }).setToken(config.discordToken);
const body = commands.map((command) => command.data.toJSON());
const route = config.discordGuildId
  ? Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId)
  : Routes.applicationCommands(config.discordClientId);

try {
  console.log(`Registering ${body.length} ${config.discordGuildId ? 'guild' : 'global'} slash commands...`);
  await rest.put(route, { body });
  console.log('Slash commands registered successfully.');
} catch (error) {
  console.error('Failed to register slash commands:', error);
  process.exitCode = 1;
}
