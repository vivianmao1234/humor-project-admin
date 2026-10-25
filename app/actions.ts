'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin';
import { RESOURCES } from '@/lib/resources';

export type FormState = { error?: string; ok?: string };

export async function createCaptionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireAdmin();

  const topic = String(formData.get('topic') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  if (!topic || !content) return { error: 'Topic and caption are both required.' };

  const { error } = await supabase.from('captions').insert({
    created_by: user.id,
    topic,
    content,
    prompt: '(written by an admin)',
    model: 'manual',
  });
  if (error) return { error: error.message };

  revalidatePath('/captions');
  revalidatePath('/');
  return { ok: 'Caption added.' };
}

export async function updateCaptionAction(id: number, topic: string, content: string): Promise<FormState> {
  const { supabase } = await requireAdmin();

  topic = topic.trim();
  content = content.trim();
  if (!topic || !content) return { error: 'Topic and caption can’t be empty.' };

  const { error } = await supabase.from('captions').update({ topic, content }).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/captions');
  revalidatePath('/');
  return { ok: 'Saved.' };
}

export async function deleteCaptionAction(id: number): Promise<FormState> {
  const { supabase } = await requireAdmin();

  // Votes on this caption are removed too (on delete cascade).
  const { error } = await supabase.from('captions').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/captions');
  revalidatePath('/votes');
  revalidatePath('/');
  return { ok: 'Deleted.' };
}

// ─── Generic editor (/manage/[resource]) ────────────────────────────────────

function parseFields(resourceKey: string, values: Record<string, string | boolean>) {
  const resource = RESOURCES[resourceKey];
  if (!resource) throw new Error('Unknown resource');

  const row: Record<string, string | number | boolean | null> = {};
  for (const field of resource.fields) {
    const raw = values[field.name];
    if (field.type === 'boolean') {
      row[field.name] = raw === true || raw === 'true' || raw === 'on';
      continue;
    }
    let value = typeof raw === 'string' ? raw.trim() : '';
    if (field.lowercase) value = value.toLowerCase();
    if (!value) {
      if (field.required) return { error: `${field.label} is required.` };
      row[field.name] = null;
    } else if (field.type === 'number' || field.type === 'select') {
      const n = Number(value);
      if (!Number.isFinite(n)) return { error: `${field.label} must be a number.` };
      row[field.name] = n;
    } else {
      row[field.name] = value;
    }
  }
  return { resource, row };
}

export async function createResourceRow(resourceKey: string, values: Record<string, string | boolean>): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = parseFields(resourceKey, values);
  if ('error' in parsed) return { error: parsed.error };

  const { error } = await supabase.from(parsed.resource.table).insert(parsed.row);
  if (error) return { error: error.message };
  revalidatePath(`/manage/${resourceKey}`);
  return { ok: 'Added.' };
}

export async function updateResourceRow(resourceKey: string, id: number, values: Record<string, string | boolean>): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = parseFields(resourceKey, values);
  if ('error' in parsed) return { error: parsed.error };

  const { error } = await supabase.from(parsed.resource.table).update(parsed.row).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/manage/${resourceKey}`);
  return { ok: 'Saved.' };
}

export async function deleteResourceRow(resourceKey: string, id: number): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const resource = RESOURCES[resourceKey];
  if (!resource) return { error: 'Unknown resource' };

  const { error } = await supabase.from(resource.table).delete().eq('id', id);
  if (error) {
    // e.g. deleting a provider that still has models
    if (error.code === '23503') return { error: 'Can’t delete: other rows still use this one.' };
    return { error: error.message };
  }
  revalidatePath(`/manage/${resourceKey}`);
  return { ok: 'Deleted.' };
}

// ─── Prompt chain mix ────────────────────────────────────────────────────────

export async function updateMixAction(humorFlavorId: number, captionCount: number): Promise<FormState> {
  const { supabase } = await requireAdmin();
  if (!Number.isInteger(captionCount) || captionCount < 0 || captionCount > 10) {
    return { error: 'Caption count must be a whole number from 0 to 10.' };
  }
  const { error } = await supabase
    .from('humor_flavor_mix')
    .upsert(
      { humor_flavor_id: humorFlavorId, caption_count: captionCount, updated_at: new Date().toISOString() },
      { onConflict: 'humor_flavor_id' }
    );
  if (error) return { error: error.message };
  revalidatePath('/prompt-chains');
  return { ok: 'Saved.' };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
