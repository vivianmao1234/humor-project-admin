import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import ResponseCard, { type LlmResponse } from '../../llm-responses/response-card';
import { STATUS_STYLE } from '@/lib/status';

type Request = {
  id: number;
  topic: string;
  status: 'pending' | 'completed' | 'failed';
  error: string | null;
  created_at: string;
  completed_at: string | null;
};
type Chain = { id: number; humor_flavors: { slug: string } | null };
type Caption = { id: number; content: string; llm_prompt_chain_id: number | null; model: string };

export default async function RequestDetailPage({ params }: PageProps<'/requests/[id]'>) {
  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId)) notFound();

  const { supabase } = await requireAdmin();
  const [{ data: request }, { data: chains }, { data: responses }, { data: captions }] = await Promise.all([
    supabase.from('caption_requests').select('id, topic, status, error, created_at, completed_at').eq('id', requestId).maybeSingle(),
    supabase.from('llm_prompt_chains').select('id, humor_flavors(slug)').eq('caption_request_id', requestId).order('id'),
    supabase
      .from('llm_model_responses')
      .select('id, llm_prompt_chain_id, model_name, prompt, response, status_code, error, duration_ms, created_at, humor_flavor_steps(step_order)')
      .eq('caption_request_id', requestId)
      .order('id'),
    supabase.from('captions').select('id, content, llm_prompt_chain_id, model').eq('caption_request_id', requestId),
  ]);
  if (!request) notFound();
  const r = request as Request;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/requests" className="text-sm text-zinc-500 hover:underline">← All requests</Link>
        <h1 className="mt-1 text-2xl font-bold">Request #{r.id}: “{r.topic}”</h1>
        <p className="mt-1 text-sm text-zinc-500">
          <span className={`mr-2 rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}>{r.status}</span>
          {new Date(r.created_at).toLocaleString()}
          {r.completed_at && ` · took ${Math.round((+new Date(r.completed_at) - +new Date(r.created_at)) / 1000)}s`}
        </p>
        {r.error && <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">{r.error}</p>}
      </div>

      {((chains ?? []) as unknown as Chain[]).map((chain) => {
        const chainResponses = ((responses ?? []) as unknown as LlmResponse[]).filter((x) => x.llm_prompt_chain_id === chain.id);
        const chainCaptions = ((captions ?? []) as Caption[]).filter((c) => c.llm_prompt_chain_id === chain.id);
        return (
          <section key={chain.id} className="space-y-3 rounded-xl border bg-white p-5">
            <h2 className="font-semibold">
              Prompt chain <span className="font-mono">{chain.humor_flavors?.slug ?? '(deleted flavor)'}</span>
            </h2>
            {chainResponses.length === 0 && <p className="text-sm text-zinc-500">No LLM calls recorded.</p>}
            {chainResponses.map((resp) => <ResponseCard key={resp.id} response={resp} />)}
            <div>
              <p className="text-sm font-medium">Captions saved ({chainCaptions.length})</p>
              {chainCaptions.length === 0 ? (
                <p className="text-sm text-zinc-500">None. This chain failed or returned unusable output.</p>
              ) : (
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                  {chainCaptions.map((c) => <li key={c.id}>{c.content}</li>)}
                </ul>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
