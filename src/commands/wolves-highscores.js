import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COLORS, number } from '../utils/format.js';
import { defer } from '../utils/response.js';

const PERIODS = { daily: 'Ngày', weekly: 'Tuần', monthly: 'Tháng', allTime: 'Mọi thời đại' };

export const data = new SlashCommandBuilder()
  .setName('wov-highscores')
  .setDescription('Xem bảng xếp hạng XP Wolvesville')
  .addStringOption((o) => o.setName('period').setDescription('Khoảng thời gian').setRequired(true)
    .addChoices(...Object.entries(PERIODS).map(([value, name]) => ({ name, value }))))
  .addIntegerOption((o) => o.setName('limit').setDescription('Số người hiển thị (mặc định 10)').setMinValue(1).setMaxValue(20));

export async function execute(interaction, api) {
  await defer(interaction);
  const period = interaction.options.getString('period', true);
  const limit = interaction.options.getInteger('limit') ?? 10;
  const scores = await api.highscores();
  const rows = (scores[period] || []).slice(0, limit);
  const description = rows.length
    ? rows.map((p, i) => `**${i + 1}.** ${p.username} — **${number(p.xp)} XP**`).join('\n')
    : 'Chưa có dữ liệu.';
  await interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.primary).setTitle(`Top XP · ${PERIODS[period]}`).setDescription(description)] });
}
