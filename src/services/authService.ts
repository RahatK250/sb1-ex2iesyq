import { supabase } from '../lib/supabase';
import { AuthUser } from '../context/AuthContext';

// Returns current time as ISO string with ICT (UTC+7) offset
const nowICT = (): string => {
  const now = new Date();
  const offset = 7 * 60 * 60 * 1000; // UTC+7 in ms
  const local = new Date(now.getTime() + offset);
  const iso = local.toISOString().replace('Z', '+07:00');
  return iso;
};

export const upsertUserLog = async (user: AuthUser): Promise<void> => {
  const now = nowICT();

  // Check if user already exists
  const { data: existing } = await supabase
    .from('user_logs')
    .select('id')
    .eq('email', user.email)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('user_logs')
      .update({
        display_name: user.displayName,
        last_login_at: now,
      })
      .eq('email', user.email);

    if (error) console.error('Failed to update user log:', error);
  } else {
    const { error } = await supabase
      .from('user_logs')
      .insert({
        email: user.email,
        display_name: user.displayName,
        first_login_at: now,
        last_login_at: now,
      });

    if (error) console.error('Failed to insert user log:', error);
  }
};
