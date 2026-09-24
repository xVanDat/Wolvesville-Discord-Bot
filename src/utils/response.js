import { EmbedBuilder, MessageFlags } from 'discord.js';
import { WolvesvilleApiError } from '../api/wolvesville.js';
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
  let message = 'Đã xảy ra lỗi ngoài dự kiến.';
  if (error instanceof UserInputError) message = error.message;
  else if (error instanceof WolvesvilleApiError) {
    if (error.status === 401 || error.status === 403) message = 'API key không hợp lệ hoặc bot Wolvesville chưa có quyền cần thiết.';
    else if (error.status === 404) message = 'Không tìm thấy dữ liệu phù hợp.';
    else if (error.status === 429) message = 'Wolvesville đang giới hạn tần suất yêu cầu. Vui lòng thử lại sau.';
    else if (error.code === 'TIMEOUT' || error.code === 'NETWORK') message = error.message;
    else message = error.message;
  }

  const payload = {
    embeds: [new EmbedBuilder().setColor(COLORS.error).setTitle('Không thể hoàn tất').setDescription(truncate(message, 4096))],
    flags: MessageFlags.Ephemeral,
  };
  if (interaction.deferred || interaction.replied) return interaction.editReply({ embeds: payload.embeds });
  return interaction.reply(payload);
}
