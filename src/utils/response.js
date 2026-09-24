import { EmbedBuilder, MessageFlags } from 'discord.js';
import { WolvesvilleApiError } from '../api/wolvesville.js';
import { tr } from '../i18n.js';
import { COLORS, truncate } from './format.js';

export class UserInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserInputError';
  }
}

export async function defer(interaction, { ephemeral = false } = {}) {
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply(ephemeral ? { flags: MessageFlags.Ephemeral } : undefined);
  }
}

export async function sendError(interaction, error) {
  let message = tr('An unexpected error occurred.', 'Đã xảy ra lỗi ngoài dự kiến.');
  if (error instanceof UserInputError) message = error.message;
  else if (error instanceof WolvesvilleApiError) {
    if (error.status === 401 || error.status === 403) message = tr('The API key is invalid or the Wolvesville bot lacks the required permission.', 'API key không hợp lệ hoặc bot Wolvesville chưa có quyền cần thiết.');
    else if (error.status === 404) message = tr('No matching data was found.', 'Không tìm thấy dữ liệu phù hợp.');
    else if (error.status === 429) message = tr('Wolvesville is rate-limiting requests. Please try again later.', 'Wolvesville đang giới hạn tần suất yêu cầu. Vui lòng thử lại sau.');
    else if (error.code === 'TIMEOUT') message = tr('The Wolvesville API request timed out.', 'Yêu cầu đến Wolvesville API đã hết thời gian chờ.');
    else if (error.code === 'NETWORK') message = tr('Could not connect to the Wolvesville API.', 'Không thể kết nối đến Wolvesville API.');
    else message = error.message;
  }

  const payload = {
    embeds: [new EmbedBuilder().setColor(COLORS.error).setTitle(tr('Unable to complete', 'Không thể hoàn tất')).setDescription(truncate(message, 4096))],
    flags: MessageFlags.Ephemeral,
  };
  if (interaction.deferred || interaction.replied) return interaction.editReply({ embeds: payload.embeds });
  return interaction.reply(payload);
}
