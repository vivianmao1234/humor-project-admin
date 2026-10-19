import { requireAdmin } from '@/lib/admin';
import NewCaptionForm from './new-caption-form';
import CaptionRow from './caption-row';

type Row = {
  id: number;
  topic: string;
  content: string;
  model: string;
  prompt: string;
  created_at: string;
  caption_votes: { vote: number }[];
};

export default async function CaptionsPage({ searchParams }: PageProps<'/captions'>) {
  const { supabase } = await requireAdmin();
  const { q } = await searchParams;
  // Strip characters that have meaning inside a PostgREST or() filter.
  const query = typeof q === 'string' ? q.replace(/[,()%*\\]/g, ' ').trim() : '';

  let request = supabase
    .from('captions')
    .select('id, topic, content, model, prompt, created_at, caption_votes(vote)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (query) request = request.or(`content.ilike.%${query}%,topic.ilike.%${query}%`);

  const { data, error } = await request;
  const rows = ((data ?? []) as Row[]).map((r) => ({
    ...r,
    up: r.caption_votes.filter((x) => x.vote === 1).length,
    down: r.caption_votes.filter((x) => x.vote === -1).length,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Captions</h1>
          <p className="text-sm text-zinc-500">AI-generated media. Create, edit, or delete captions.</p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search captions or topics"
            className="w-56 rounded-md border bg-white px-3 py-2 text-sm"
          />
          <button className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-zinc-50">Search</button>
        </form>
      </div>

      <NewCaptionForm />

      {error && <p className="text-red-600">Couldn’t load captions: {error.message}</p>}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">Caption</th>
              <th className="px-4 py-2 font-medium">Topic</th>
              <th className="px-4 py-2 font-medium">Votes</th>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium">Created</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  {query ? 'No captions match that search.' : 'No captions yet.'}
                </td>
              </tr>
            ) : (
              rows.map((r) => <CaptionRow key={r.id} caption={r} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
