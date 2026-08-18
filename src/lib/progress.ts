import { supabase } from './supabase';

const guestProgressKey = 'motel-horror-unlocked-night';
const maxNight = 5;

function clampNight(night: number) {
  return Math.min(maxNight, Math.max(1, Math.floor(night)));
}

export function loadGuestUnlockedNight() {
  const savedNight = Number(window.localStorage.getItem(guestProgressKey));
  return Number.isFinite(savedNight) ? clampNight(savedNight) : 1;
}

export function saveGuestUnlockedNight(night: number) {
  window.localStorage.setItem(guestProgressKey, String(clampNight(night)));
}

export async function loadAccountUnlockedNight() {
  const { data, error } = await supabase
    .from('game_progress')
    .select('unlocked_night')
    .maybeSingle();

  if (error) throw error;
  return data?.unlocked_night ? clampNight(data.unlocked_night) : 1;
}

export async function saveAccountUnlockedNight(night: number) {
  const { error } = await supabase
    .from('game_progress')
    .upsert({ unlocked_night: clampNight(night) }, { onConflict: 'user_id' });

  if (error) throw error;
}
