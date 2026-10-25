import Link from 'next/link';
import { requireAdmin, displayName } from '@/lib/admin';
import { STATUS_STYLE } from '@/lib/status';

type Row = {
  id: number;
  topic: string;
  status: 'pending' | 'completed' | 'failed';
  error: string | null;
  created_at: string;
  completed_at: string | null;
  profile_id: string;
  captions: { id: number }[];
  llm_model_responses: { id: number; error: string | null }[];
};
type Profile = { id: string; first_name: string | null; last_name: string | null; email: string | null };

export default async function RequestsPage() {
  const { supabase } = await requireAdmin();

  const [{ data, error }, { data: profiles }] = await Promise.all([
    supabase
      .from('caption_requests')
      .select('id, topic, status, error, created_at, completed_at, profile_id, captions(id), llm_model_responses(id, error)')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('profiles').select('id, first_name, last_name, email'),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const byId = new Map(((profiles ?? []) as Profile[]).map((p) => [p.id, p]));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generation requests</h1>
        <p className="text-sm text-zinc-500">One row per “Generate” click. Open one to see every LLM call it made.</p>
      </div>
      {error && <p className="text-red-600">Couldn’t load: {error.message}</p>}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Topic</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Captions</th>
              <th className="px-4 py-2 font-medium">LLM calls</th>
              <th className="px-4 py-2 font-medium">Took</th>
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">When</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-500">No requests yet. Generate captions in the rating app.</td></tr>
            ) : rows.map((r) => {
              const failedCalls = r.llm_model_responses.filter((x) => x.error).length;
              const took = r.completed_at ? Math.round((+new Date(r.completed_at) - +new Date(r.created_at)) / 1000) : null;
              const user = byId.get(r.profile_id);
              return (
                <tr key={r.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3"><Link href={`/requests/${r.id}`} className="font-medium text-blue-700 hover:underline">{r.id}</Link></td>
                  <td className="px-4 py-3"><Link href={`/requests/${r.id}`} className="hover:underline">{r.topic}</Link></td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.captions.length}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.llm_model_responses.length}
                    {failedCalls > 0 && <span className="text-xs text-red-600"> ({failedCalls} failed)</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-600">{took === null ? '—' : `${took}s`}</td>
                  <td className="px-4 py-3 text-zinc-600">{user ? displayName(user) : '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-500">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
