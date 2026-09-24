import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { language, tr } from '../i18n.js';
import { COLORS, roleChoice, truncate } from '../utils/format.js';
import { defer } from '../utils/response.js';

const MODES = ['quick', 'advanced', 'sandbox', 'ranked', 'crazy-fun'];

export const data = new SlashCommandBuilder()
  .setName('wov-rotation')
  .setDescription(tr('View the active role rotations', 'Xem role rotation đang hoạt động'))
  .addStringOption((o) => o.setName('mode').setDescription(tr('Game mode', 'Chế độ chơi')).addChoices(...MODES.map((x) => ({ name: x, value: x }))))
  .addStringOption((o) => o.setName('locale').setDescription(tr('Content language', 'Ngôn ngữ')).addChoices({ name: 'English', value: 'en' }, { name: 'Tiếng Việt', value: 'vi' }));

export async function execute(interaction, api) {
  await defer(interaction);
  const mode = interaction.options.getString('mode');
  const locale = interaction.options.getString('locale') || language;
  let categories = await api.rotations(locale);
  if (mode) categories = categories.filter((c) => c.gameMode === mode);
  const embed = new EmbedBuilder().setColor(COLORS.primary).setTitle(tr('Current role rotations', 'Role rotation hiện tại'));
  for (const category of categories.slice(0, 8)) {
    const rotations = (category.roleRotations || []).slice(0, 4).map((item, index) => {
      const slots = (item.roleRotation?.roles || []).map((slot) => slot.map(roleChoice).join(' | ')).join(', ');
      return `**#${index + 1}** (${Math.round((item.probability ?? 0) * 100)}%): ${slots || '—'}`;
    });
    embed.addFields({ name: category.gameModeName || category.gameMode, value: truncate(rotations.join('\n') || tr('No rotation available.', 'Chưa có rotation.'), 1024) });
  }
  if (!categories.length) embed.setDescription(tr('No matching rotations found.', 'Không có rotation phù hợp.'));
  await interaction.editReply({ embeds: [embed] });
}
