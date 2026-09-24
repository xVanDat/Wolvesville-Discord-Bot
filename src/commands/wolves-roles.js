import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COLORS, truncate } from '../utils/format.js';
import { defer } from '../utils/response.js';

const TEAMS = ['VILLAGER', 'WEREWOLF', 'SOLO', 'RANDOM'];

export const data = new SlashCommandBuilder()
  .setName('wov-roles')
  .setDescription('Tra cứu vai trò Wolvesville')
  .addStringOption((o) => o.setName('query').setDescription('Tên hoặc ID vai trò').setMaxLength(50))
  .addStringOption((o) => o.setName('team').setDescription('Lọc phe').addChoices(...TEAMS.map((x) => ({ name: x, value: x }))))
  .addStringOption((o) => o.setName('locale').setDescription('Ngôn ngữ nội dung').addChoices({ name: 'Tiếng Việt', value: 'vi' }, { name: 'English', value: 'en' }));

export async function execute(interaction, api) {
  await defer(interaction);
  const query = interaction.options.getString('query')?.trim().toLocaleLowerCase() || '';
  const team = interaction.options.getString('team');
  const locale = interaction.options.getString('locale') || 'vi';
  const result = await api.roles(locale);
  let roles = result.roles || [];
  if (query) roles = roles.filter((r) => r.name.toLocaleLowerCase().includes(query) || r.id.toLocaleLowerCase().includes(query));
  if (team === 'SOLO') roles = roles.filter((r) => !['VILLAGER', 'WEREWOLF', 'RANDOM', 'RANDOM_VOTING', 'RANDOM_VILLAGER', 'RANDOM_WEREWOLF', 'RANDOM_KILLER'].includes(r.team));
  else if (team === 'RANDOM') roles = roles.filter((r) => r.team.startsWith('RANDOM'));
  else if (team) roles = roles.filter((r) => r.team === team);

  const shown = roles.slice(0, 10);
  const embed = new EmbedBuilder().setColor(COLORS.primary).setTitle(`Vai trò Wolvesville (${roles.length})`);
  if (!shown.length) embed.setDescription('Không tìm thấy vai trò phù hợp.');
  else embed.addFields(shown.map((r) => ({ name: `${r.name} · ${r.team}`, value: truncate(`${r.description}\nID: \`${r.id}\``, 1024) })));
  if (roles.length > shown.length) embed.setFooter({ text: `Hiển thị 10/${roles.length}. Hãy thêm query hoặc team để lọc.` });
  await interaction.editReply({ embeds: [embed] });
}
