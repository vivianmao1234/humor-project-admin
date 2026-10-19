'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin';

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

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
