import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import ResponseCard, { type LlmResponse } from './response-card';

export default async function LlmResponsesPage({ searchParams }: PageProps<'/llm-responses'>) {
  const { supabase } = await requireAdmin();
  const { filter } = await searchParams;
  const onlyErrors = filter === 'errors';

  let query = supabase
    .from('llm_model_responses')
    .select('id, caption_request_id, llm_prompt_chain_id, model_name, prompt, response, status_code, error, duration_ms, created_at, humor_flavor_steps(step_order)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (onlyErrors) query = query.not('error', 'is', null);

  const { data, error } = await query;
  const rows = (data ?? []) as unknown as LlmResponse[];

  const ok = rows.filter((r) => !r.error);
  const avg = ok.length ? ok.reduce((s, r) => s + (r.duration_ms ?? 0), 0) / ok.length / 1000 : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">LLM responses</h1>
        <p className="text-sm text-zinc-500">
          Every call the pipeline made, newest first (last 100).
          {!onlyErrors && rows.length > 0 && ` ${ok.length} of ${rows.length} succeeded${avg !== null ? `, averaging ${avg.toFixed(1)}s` : ''}.`}
        </p>
      </div>

      <div className="flex gap-2 text-sm">
        <Link href="/llm-responses" className={`rounded-full px-3 py-1 ${!onlyErrors ? 'bg-zinc-900 text-white' : 'border bg-white hover:bg-zinc-50'}`}>All</Link>
        <Link href="/llm-responses?filter=errors" className={`rounded-full px-3 py-1 ${onlyErrors ? 'bg-zinc-900 text-white' : 'border bg-white hover:bg-zinc-50'}`}>Errors only</Link>
      </div>

      {error && <p className="text-red-600">Couldn’t load: {error.message}</p>}
      {rows.length === 0 && !error && <p className="text-sm text-zinc-500">No LLM calls yet.</p>}
      <div className="space-y-3">
        {rows.map((r) => <ResponseCard key={r.id} response={r} showRequest />)}
      </div>
    </div>
  );
}
