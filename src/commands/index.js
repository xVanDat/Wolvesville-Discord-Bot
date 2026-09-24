import * as player from './wolves-player.js';
import * as highscores from './wolves-highscores.js';
import * as roles from './wolves-roles.js';
import * as rotation from './wolves-rotation.js';
import * as ranked from './wolves-ranked.js';
import * as clan from './clan.js';

export const commands = [player, highscores, roles, rotation, ranked, clan];
export const commandMap = new Map(commands.map((command) => [command.data.name, command]));
