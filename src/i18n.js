import 'dotenv/config';

const configuredLanguage = (
  process.env.BOT_LANG
  ?? process.env.lang
  ?? 'en'
).trim().toLowerCase();

export const language = configuredLanguage === 'vi' ? 'vi' : 'en';

export function tr(english, vietnamese) {
  return language === 'vi' ? vietnamese : english;
}
