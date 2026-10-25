export type LlmResponse = {
  id: number;
  caption_request_id?: number;
  llm_prompt_chain_id: number | null;
  model_name: string;
  prompt: string;
  response: string | null;
  status_code: number | null;
  error: string | null;
  duration_ms: number | null;
  created_at: string;
  humor_flavor_steps: { step_order: number } | null;
};

export default function ResponseCard({ response: r, showRequest }: { response: LlmResponse; showRequest?: boolean }) {
  const ok = !r.error;
  return (
    <div className={`rounded-lg border p-3 ${ok ? 'border-zinc-200' : 'border-red-200 bg-red-50/40'}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {r.humor_flavor_steps && (
          <span className="rounded-full bg-zinc-900 px-2 py-0.5 font-semibold text-white">Step {r.humor_flavor_steps.step_order}</span>
        )}
        <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-blue-800">{r.model_name}</span>
        <span className={`rounded px-1.5 py-0.5 font-medium ${ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {ok ? `OK ${r.status_code ?? ''}` : r.status_code ? `Error ${r.status_code}` : 'Error'}
        </span>
        {r.duration_ms != null && <span className="text-zinc-500">{(r.duration_ms / 1000).toFixed(1)}s</span>}
        {showRequest && r.caption_request_id && (
          <a href={`/requests/${r.caption_request_id}`} className="text-blue-700 hover:underline">request #{r.caption_request_id}</a>
        )}
        <span className="text-zinc-400">{new Date(r.created_at).toLocaleString()}</span>
      </div>
      {r.error && <p className="mt-2 break-words font-mono text-xs text-red-700">{r.error}</p>}
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-800">Prompt</summary>
        <pre className="mt-1 whitespace-pre-wrap rounded bg-zinc-50 p-2 text-xs">{r.prompt}</pre>
      </details>
      {r.response && (
        <details className="mt-1" open={!showRequest}>
          <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-800">Response</summary>
          <pre className="mt-1 whitespace-pre-wrap rounded bg-zinc-50 p-2 text-xs">{r.response}</pre>
        </details>
      )}
    </div>
  );
}
