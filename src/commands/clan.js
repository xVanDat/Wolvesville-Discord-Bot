import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COLORS, discordTime, number, truncate, uuid } from '../utils/format.js';
import { defer, UserInputError } from '../utils/response.js';

function clanIdOption(option) {
  return option.setName('clan-id').setDescription('UUID của clan').setRequired(true).setMinLength(36).setMaxLength(36);
}

export const data = new SlashCommandBuilder()
  .setName('clan')
  .setDescription('Tra cứu clan Wolvesville (chỉ đọc)')
  .addSubcommand((s) => s.setName('search').setDescription('Tìm clan theo tên')
    .addStringOption((o) => o.setName('name').setDescription('Tên clan').setRequired(true).setMinLength(1).setMaxLength(50))
    .addBooleanOption((o) => o.setName('exact').setDescription('Chỉ khớp chính xác')))
  .addSubcommand((s) => s.setName('authorized').setDescription('Liệt kê clan đã thêm bot Wolvesville'))
  .addSubcommand((s) => s.setName('info').setDescription('Xem thông tin clan').addStringOption(clanIdOption))
  .addSubcommand((s) => s.setName('members').setDescription('Xem thành viên clan').addStringOption(clanIdOption))
  .addSubcommand((s) => s.setName('quest').setDescription('Xem quest đang hoạt động').addStringOption(clanIdOption));

function clanEmbed(clan) {
  const embed = new EmbedBuilder().setColor(COLORS.clan).setTitle(clan.name)
    .setDescription(truncate(clan.description || 'Không có mô tả.', 4096))
    .addFields(
      { name: 'Thành viên', value: number(clan.memberCount), inline: true },
      { name: 'XP', value: number(clan.xp), inline: true },
      { name: 'Ngôn ngữ', value: clan.language || '—', inline: true },
      { name: 'Kiểu tham gia', value: clan.joinType || '—', inline: true },
      { name: 'Cấp tối thiểu', value: number(clan.minLevel), inline: true },
      { name: 'Quest đã hoàn thành', value: number(clan.questHistoryCount), inline: true },
      { name: 'Clan ID', value: `\`${clan.id}\`` },
    );
  if (typeof clan.gold === 'number') embed.addFields({ name: 'Kho clan', value: `${number(clan.gold)} gold · ${number(clan.gems)} gems` });
  return embed;
}

export async function execute(interaction, api) {
  const sub = interaction.options.getSubcommand();
  await defer(interaction, { ephemeral: sub !== 'search' });
  if (sub === 'search') {
    const clans = await api.searchClans(interaction.options.getString('name', true).trim(), interaction.options.getBoolean('exact') ?? false);
    const shown = clans.slice(0, 10);
    const description = shown.length ? shown.map((c) => `**${c.name}**${c.tag ? ` [${c.tag}]` : ''} · ${number(c.memberCount)} thành viên · ${number(c.xp)} XP\n\`${c.id}\``).join('\n\n') : 'Không tìm thấy clan.';
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.clan).setTitle(`Kết quả clan (${clans.length})`).setDescription(truncate(description, 4096))] });
  }
  if (sub === 'authorized') {
    const clans = await api.authorizedClans();
    const description = clans.length ? clans.slice(0, 15).map((c) => {
      const permissions = c.botPermissions ? Object.entries(c.botPermissions).filter(([, enabled]) => enabled).map(([name]) => name).join(', ') || 'không có' : 'chưa bật';
      return `**${c.name}** · quyền: ${permissions}\n\`${c.id}\``;
    }).join('\n\n') : 'Bot Wolvesville chưa được thêm vào clan nào.';
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.clan).setTitle('Clan đã cấp quyền').setDescription(truncate(description, 4096))] });
  }

  const clanId = interaction.options.getString('clan-id', true).trim();
  if (!uuid(clanId)) throw new UserInputError('Clan ID phải là UUID hợp lệ.');
  if (sub === 'info') return interaction.editReply({ embeds: [clanEmbed(await api.clanInfo(clanId))] });
  if (sub === 'members') {
    const members = await api.clanMembers(clanId);
    const sorted = [...members].sort((a, b) => b.xp - a.xp).slice(0, 20);
    const description = sorted.length ? sorted.map((m, i) => `**${i + 1}. ${m.username}** · Lv ${number(m.level)} · ${number(m.xp)} XP${m.isCoLeader ? ' · Co-leader' : ''}`).join('\n') : 'Clan chưa có thành viên hiển thị.';
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.clan).setTitle(`Thành viên clan (${members.length})`).setDescription(truncate(description, 4096)).setFooter({ text: members.length > 20 ? 'Hiển thị 20 thành viên có XP cao nhất.' : 'Dữ liệu từ Wolvesville Public API' })] });
  }
  const active = await api.activeClanQuest(clanId);
  const quest = active.quest || {};
  const embed = new EmbedBuilder().setColor(COLORS.clan).setTitle('Clan quest đang hoạt động')
    .addFields(
      { name: 'Tier', value: number(active.tier), inline: true },
      { name: 'Tiến độ XP', value: `${number(active.xp)} XP`, inline: true },
      { name: 'XP mỗi phần thưởng', value: number(active.xpPerReward), inline: true },
      { name: 'Kết thúc tier', value: discordTime(active.tierEndTime, 'F') },
      { name: 'Người tham gia', value: number(active.participants?.length ?? 0), inline: true },
      { name: 'Quest ID', value: `\`${quest.id || '—'}\`` },
    );
  if (quest.promoImageUrl) embed.setImage(quest.promoImageUrl);
  return interaction.editReply({ embeds: [embed] });
}
