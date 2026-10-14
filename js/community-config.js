// Настройки фото сообщества. Пока mode: 'local' — фото, лайки и баллы хранятся только на устройстве.
// Чтобы включить общий сервер: создать бесплатный проект Supabase, выполнить backend/supabase.sql,
// вписать сюда url проекта и публичный anon-ключ (он и так виден в любом веб-приложении) и поставить mode: 'supabase'.
export const COMMUNITY = {
  mode: 'local',
  url: '',      // https://<project>.supabase.co
  anonKey: '',  // публичный anon key
};
