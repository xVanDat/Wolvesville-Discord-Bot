import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { tr } from '../i18n.js';
import { COLORS, discordTime, number, truncate, uuid } from '../utils/format.js';
import { defer, UserInputError } from '../utils/response.js';

function clanIdOption(option) {
  return option.setName('clan-id').setDescription(tr('Clan UUID', 'UUID của clan')).setRequired(true).setMinLength(36).setMaxLength(36);
}

export const data = new SlashCommandBuilder()
  .setName('clan')
  .setDescription(tr('Look up Wolvesville clans (read-only)', 'Tra cứu clan Wolvesville (chỉ đọc)'))
  .addSubcommand((s) => s.setName('search').setDescription(tr('Search for a clan by name', 'Tìm clan theo tên'))
    .addStringOption((o) => o.setName('name').setDescription(tr('Clan name', 'Tên clan')).setRequired(true).setMinLength(1).setMaxLength(50))
    .addBooleanOption((o) => o.setName('exact').setDescription(tr('Match the exact name only', 'Chỉ khớp chính xác'))))
  .addSubcommand((s) => s.setName('authorized').setDescription(tr('List clans that added this Wolvesville bot', 'Liệt kê clan đã thêm bot Wolvesville')))
  .addSubcommand((s) => s.setName('info').setDescription(tr('View clan information', 'Xem thông tin clan')).addStringOption(clanIdOption))
  .addSubcommand((s) => s.setName('members').setDescription(tr('View clan members', 'Xem thành viên clan')).addStringOption(clanIdOption))
  .addSubcommand((s) => s.setName('quest').setDescription(tr('View the active clan quest', 'Xem quest đang hoạt động')).addStringOption(clanIdOption));

function clanEmbed(clan) {
  const embed = new EmbedBuilder().setColor(COLORS.clan).setTitle(clan.name)
    .setDescription(truncate(clan.description || tr('No description.', 'Không có mô tả.'), 4096))
    .addFields(
      { name: tr('Members', 'Thành viên'), value: number(clan.memberCount), inline: true },
      { name: 'XP', value: number(clan.xp), inline: true },
      { name: tr('Language', 'Ngôn ngữ'), value: clan.language || '—', inline: true },
      { name: tr('Join type', 'Kiểu tham gia'), value: clan.joinType || '—', inline: true },
      { name: tr('Minimum level', 'Cấp tối thiểu'), value: number(clan.minLevel), inline: true },
      { name: tr('Completed quests', 'Quest đã hoàn thành'), value: number(clan.questHistoryCount), inline: true },
      { name: 'Clan ID', value: `\`${clan.id}\`` },
    );
  if (typeof clan.gold === 'number') embed.addFields({ name: tr('Clan storage', 'Kho clan'), value: `${number(clan.gold)} gold · ${number(clan.gems)} gems` });
  return embed;
}

export async function execute(interaction, api) {
  const sub = interaction.options.getSubcommand();
  await defer(interaction, { ephemeral: sub !== 'search' });
  if (sub === 'search') {
    const clans = await api.searchClans(interaction.options.getString('name', true).trim(), interaction.options.getBoolean('exact') ?? false);
    const shown = clans.slice(0, 10);
    const description = shown.length ? shown.map((c) => `**${c.name}**${c.tag ? ` [${c.tag}]` : ''} · ${number(c.memberCount)} ${tr('members', 'thành viên')} · ${number(c.xp)} XP\n\`${c.id}\``).join('\n\n') : tr('No clans found.', 'Không tìm thấy clan.');
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.clan).setTitle(`${tr('Clan results', 'Kết quả clan')} (${clans.length})`).setDescription(truncate(description, 4096))] });
  }
  if (sub === 'authorized') {
    const clans = await api.authorizedClans();
    const description = clans.length ? clans.slice(0, 15).map((c) => {
      const permissions = c.botPermissions ? Object.entries(c.botPermissions).filter(([, enabled]) => enabled).map(([name]) => name).join(', ') || tr('none', 'không có') : tr('not enabled', 'chưa bật');
      return `**${c.name}** · ${tr('permissions', 'quyền')}: ${permissions}\n\`${c.id}\``;
    }).join('\n\n') : tr('This Wolvesville bot has not been added to any clan.', 'Bot Wolvesville chưa được thêm vào clan nào.');
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.clan).setTitle(tr('Authorized clans', 'Clan đã cấp quyền')).setDescription(truncate(description, 4096))] });
  }

  const clanId = interaction.options.getString('clan-id', true).trim();
  if (!uuid(clanId)) throw new UserInputError(tr('Clan ID must be a valid UUID.', 'Clan ID phải là UUID hợp lệ.'));
  if (sub === 'info') return interaction.editReply({ embeds: [clanEmbed(await api.clanInfo(clanId))] });
  if (sub === 'members') {
    const members = await api.clanMembers(clanId);
    const sorted = [...members].sort((a, b) => b.xp - a.xp).slice(0, 20);
    const description = sorted.length ? sorted.map((m, i) => `**${i + 1}. ${m.username}** · Lv ${number(m.level)} · ${number(m.xp)} XP${m.isCoLeader ? ' · Co-leader' : ''}`).join('\n') : tr('The clan has no members to display.', 'Clan chưa có thành viên hiển thị.');
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.clan).setTitle(`${tr('Clan members', 'Thành viên clan')} (${members.length})`).setDescription(truncate(description, 4096)).setFooter({ text: members.length > 20 ? tr('Showing the 20 members with the most XP.', 'Hiển thị 20 thành viên có XP cao nhất.') : tr('Data from the Wolvesville Public API', 'Dữ liệu từ Wolvesville Public API') })] });
  }
  const active = await api.activeClanQuest(clanId);
  const quest = active.quest || {};
  const embed = new EmbedBuilder().setColor(COLORS.clan).setTitle(tr('Active clan quest', 'Clan quest đang hoạt động'))
    .addFields(
      { name: 'Tier', value: number(active.tier), inline: true },
      { name: tr('XP progress', 'Tiến độ XP'), value: `${number(active.xp)} XP`, inline: true },
      { name: tr('XP per reward', 'XP mỗi phần thưởng'), value: number(active.xpPerReward), inline: true },
      { name: tr('Tier ends', 'Kết thúc tier'), value: discordTime(active.tierEndTime, 'F') },
      { name: tr('Participants', 'Người tham gia'), value: number(active.participants?.length ?? 0), inline: true },
      { name: 'Quest ID', value: `\`${quest.id || '—'}\`` },
    );
  if (quest.promoImageUrl) embed.setImage(quest.promoImageUrl);
  return interaction.editReply({ embeds: [embed] });
}
