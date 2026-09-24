import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COLORS, discordTime, number } from '../utils/format.js';
import { defer } from '../utils/response.js';

export const data = new SlashCommandBuilder()
  .setName('wov-ranked')
  .setDescription('Xem mùa hoặc bảng xếp hạng Ranked')
  .addStringOption((o) => o.setName('view').setDescription('Nội dung').setRequired(true).addChoices(
    { name: 'Mùa hiện tại', value: 'season' }, { name: 'Bảng xếp hạng', value: 'leaderboard' },
  ))
  .addStringOption((o) => o.setName('language').setDescription('Lọc leaderboard theo ngôn ngữ').addChoices(
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
        { name: 'Bắt đầu', value: discordTime(s.startTime, 'F'), inline: true },
        { name: 'Kết thúc', value: discordTime(s.endTime, 'F'), inline: true },
        { name: 'Trạng thái', value: s.finished ? 'Đã kết thúc' : 'Đang diễn ra', inline: true },
        { name: 'Phí mỗi trận', value: `${number(result.goldPricePerGame)} gold`, inline: true },
        { name: 'Skill khởi điểm', value: number(result.startSkillDefault), inline: true },
      );
    return interaction.editReply({ embeds: [embed] });
  }

  const language = interaction.options.getString('language') || undefined;
  const result = await api.rankedLeaderboard(language);
  const rows = (result.ranksTop || []).slice(0, 15);
  const description = rows.length ? rows.map((p, i) => `**${i + 1}.** ${p.username} — **${number(p.skill)} skill**`).join('\n') : 'Chưa có dữ liệu.';
  return interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.primary).setTitle(`Ranked leaderboard${language ? ` · ${language}` : ''}`).setDescription(description)] });
}
