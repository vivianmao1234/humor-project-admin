import Link from 'next/link';
import { requireAdmin, displayName } from '@/lib/admin';

type Row = {
  id: number;
  vote: number;
  created_at: string;
  user_id: string;
  captions: { content: string; topic: string } | null;
};
type Profile = { id: string; first_name: string | null; last_name: string | null; email: string | null };

export default async function VotesPage({ searchParams }: PageProps<'/votes'>) {
  const { supabase } = await requireAdmin();
  const { type } = await searchParams;
  const filter = type === 'up' ? 1 : type === 'down' ? -1 : null;

  let request = supabase
    .from('caption_votes')
    .select('id, vote, created_at, user_id, captions(content, topic)')
    .order('created_at', { ascending: false })
    .limit(300);
  if (filter) request = request.eq('vote', filter);

  const [{ data, error }, { data: profiles }] = await Promise.all([
    request,
    supabase.from('profiles').select('id, first_name, last_name, email'),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const byId = new Map(((profiles ?? []) as Profile[]).map((p) => [p.id, p]));

  const tabs = [
    { key: undefined, label: 'All' },
    { key: 'up', label: '▲ Upvotes' },
    { key: 'down', label: '▼ Downvotes' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Votes</h1>
        <p className="text-sm text-zinc-500">Every upvote and downvote, newest first.</p>
      </div>

      <div className="flex gap-2 text-sm">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={t.key ? `/votes?type=${t.key}` : '/votes'}
            className={`rounded-full px-3 py-1 ${type === t.key ? 'bg-zinc-900 text-white' : 'border bg-white hover:bg-zinc-50'}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {error && <p className="text-red-600">Couldn’t load votes: {error.message}</p>}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Vote</th>
              <th className="px-4 py-2 font-medium">Caption</th>
              <th className="px-4 py-2 font-medium">Voter</th>
              <th className="px-4 py-2 font-medium">When</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">No votes yet.</td></tr>
            ) : rows.map((r) => {
              const voter = byId.get(r.user_id);
              return (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    {r.vote === 1
                      ? <span className="font-medium text-orange-700">▲ Up</span>
                      : <span className="font-medium text-blue-700">▼ Down</span>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="max-w-md">{r.captions?.content ?? '(deleted caption)'}</p>
                    {r.captions && <p className="text-xs text-zinc-500">{r.captions.topic}</p>}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{voter ? displayName(voter) : r.user_id.slice(0, 8)}</td>
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
