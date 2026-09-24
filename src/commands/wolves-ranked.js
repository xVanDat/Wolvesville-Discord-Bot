import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { tr } from '../i18n.js';
import { COLORS, discordTime, number } from '../utils/format.js';
import { defer } from '../utils/response.js';

export const data = new SlashCommandBuilder()
  .setName('wov-ranked')
  .setDescription(tr('View the ranked season or leaderboard', 'Xem mùa hoặc bảng xếp hạng Ranked'))
  .addStringOption((o) => o.setName('view').setDescription(tr('Content to display', 'Nội dung')).setRequired(true).addChoices(
    { name: tr('Current season', 'Mùa hiện tại'), value: 'season' }, { name: tr('Leaderboard', 'Bảng xếp hạng'), value: 'leaderboard' },
  ))
  .addStringOption((o) => o.setName('language').setDescription(tr('Filter the leaderboard by language', 'Lọc leaderboard theo ngôn ngữ')).addChoices(
    { name: 'English', value: 'en' }, { name: 'Tiếng Việt', value: 'vi' }, { name: 'ไทย', value: 'th' },
    { name: 'Français', value: 'fr' }, { name: 'Türkçe', value: 'tr' }, { name: 'Português', value: 'pt' },
  ));

export async function execute(interaction, api) {
  await defer(interaction);
  const view = interaction.options.getString('view', true);
  if (view === 'season') {
    const result = await api.rankedSeason();
    const s = result.season;
    const embed = new EmbedBuilder().setColor(COLORS.primary).setTitle(`Ranked Season ${s.number}`)
      .addFields(
        { name: tr('Starts', 'Bắt đầu'), value: discordTime(s.startTime, 'F'), inline: true },
        { name: tr('Ends', 'Kết thúc'), value: discordTime(s.endTime, 'F'), inline: true },
        { name: tr('Status', 'Trạng thái'), value: s.finished ? tr('Finished', 'Đã kết thúc') : tr('In progress', 'Đang diễn ra'), inline: true },
        { name: tr('Cost per game', 'Phí mỗi trận'), value: `${number(result.goldPricePerGame)} gold`, inline: true },
        { name: tr('Starting skill', 'Skill khởi điểm'), value: number(result.startSkillDefault), inline: true },
      );
    return interaction.editReply({ embeds: [embed] });
  }

  const language = interaction.options.getString('language') || undefined;
  const result = await api.rankedLeaderboard(language);
  const rows = (result.ranksTop || []).slice(0, 15);
  const description = rows.length ? rows.map((p, i) => `**${i + 1}.** ${p.username} — **${number(p.skill)} skill**`).join('\n') : tr('No data available.', 'Chưa có dữ liệu.');
  return interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.primary).setTitle(`Ranked leaderboard${language ? ` · ${language}` : ''}`).setDescription(description)] });
}
