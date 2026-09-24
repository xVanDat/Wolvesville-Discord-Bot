import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COLORS, roleChoice, truncate } from '../utils/format.js';
import { defer } from '../utils/response.js';

const MODES = ['quick', 'advanced', 'sandbox', 'ranked', 'crazy-fun'];

export const data = new SlashCommandBuilder()
  .setName('wov-rotation')
  .setDescription('Xem role rotation đang hoạt động')
  .addStringOption((o) => o.setName('mode').setDescription('Chế độ chơi').addChoices(...MODES.map((x) => ({ name: x, value: x }))))
  .addStringOption((o) => o.setName('locale').setDescription('Ngôn ngữ').addChoices({ name: 'Tiếng Việt', value: 'vi' }, { name: 'English', value: 'en' }));

export async function execute(interaction, api) {
  await defer(interaction);
  const mode = interaction.options.getString('mode');
  const locale = interaction.options.getString('locale') || 'vi';
  let categories = await api.rotations(locale);
  if (mode) categories = categories.filter((c) => c.gameMode === mode);
  const embed = new EmbedBuilder().setColor(COLORS.primary).setTitle('Role rotation hiện tại');
  for (const category of categories.slice(0, 8)) {
    const rotations = (category.roleRotations || []).slice(0, 4).map((item, index) => {
      const slots = (item.roleRotation?.roles || []).map((slot) => slot.map(roleChoice).join(' | ')).join(', ');
      return `**#${index + 1}** (${Math.round((item.probability ?? 0) * 100)}%): ${slots || '—'}`;
    });
    embed.addFields({ name: category.gameModeName || category.gameMode, value: truncate(rotations.join('\n') || 'Chưa có rotation.', 1024) });
  }
  if (!categories.length) embed.setDescription('Không có rotation phù hợp.');
  await interaction.editReply({ embeds: [embed] });
}
