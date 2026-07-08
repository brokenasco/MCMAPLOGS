import { createClient } from '@supabase/supabase-js';

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const supabaseConfigStatus = {
  hasUrl: Boolean(supabaseUrl),
  hasKey: Boolean(supabaseAnonKey),
  urlHost: supabaseUrl ? new URL(supabaseUrl).host : ''
};

const legacySupabaseProjectRefs = ['cxxyoswcgyivljbqysne'];

export const isLegacySupabaseProject =
  import.meta.env.VITE_LEGACY_SUPABASE_NOTICE === 'true' ||
  legacySupabaseProjectRefs.some((projectRef) => supabaseConfigStatus.urlHost.startsWith(`${projectRef}.`));

function normalizeSupabaseUrl(rawUrl) {
  if (!rawUrl) return '';

  const trimmedUrl = rawUrl.trim().replace(/^["']|["']$/g, '');
  const withProtocol = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;

  try {
    const parsedUrl = new URL(withProtocol);
    return parsedUrl.origin;
  } catch {
    return '';
  }
}
