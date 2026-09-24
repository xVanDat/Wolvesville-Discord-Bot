import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COLORS, discordTime, number, statusLabel, truncate } from '../utils/format.js';
import { defer, UserInputError } from '../utils/response.js';

export const data = new SlashCommandBuilder()
  .setName('wov-player')
  .setDescription('Tìm hồ sơ Wolvesville theo username chính xác')
  .addStringOption((o) => o.setName('username').setDescription('Username Wolvesville').setRequired(true).setMinLength(1).setMaxLength(32));

export async function execute(interaction, api) {
  await defer(interaction);
  const username = interaction.options.getString('username', true).trim();
  if (!username) throw new UserInputError('Username không được chỉ chứa khoảng trắng.');
  const player = await api.findPlayer(username);
  const stats = player.gameStats || {};
  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle(player.username)
    .setDescription(truncate(player.personalMessage || 'Không có lời nhắn.', 4096))
    .addFields(
      { name: 'Cấp', value: number(player.level), inline: true },
      { name: 'Trạng thái', value: statusLabel(player.status), inline: true },
      { name: 'Lần cuối online', value: discordTime(player.lastOnline), inline: true },
      { name: 'Thắng / Thua / Hòa', value: `${number(stats.totalWinCount)} / ${number(stats.totalLoseCount)} / ${number(stats.totalTieCount)}`, inline: true },
      { name: 'Ranked skill', value: number(player.rankedSeasonSkill), inline: true },
      { name: 'Hoa hồng gửi / nhận', value: `${number(player.sentRosesCount)} / ${number(player.receivedRosesCount)}`, inline: true },
      { name: 'Player ID', value: `\`${player.id}\`` },
    )
    .setFooter({ text: 'Dữ liệu từ Wolvesville Public API' });
  if (player.profileImageUrl) embed.setThumbnail(player.profileImageUrl);
  await interaction.editReply({ embeds: [embed] });
}
