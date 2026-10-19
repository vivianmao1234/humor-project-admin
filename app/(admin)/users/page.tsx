import { requireAdmin, displayName } from '@/lib/admin';

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_superadmin: boolean;
  created_at: string;
};

export default async function UsersPage() {
  const { supabase } = await requireAdmin();

  const [{ data: profiles, error }, { data: captions }, { data: votes }] = await Promise.all([
    supabase.from('profiles').select('id, first_name, last_name, email, avatar_url, is_superadmin, created_at').order('created_at', { ascending: false }),
    supabase.from('captions').select('created_by'),
    supabase.from('caption_votes').select('user_id'),
  ]);

  const captionCount = new Map<string, number>();
  for (const c of captions ?? []) captionCount.set(c.created_by, (captionCount.get(c.created_by) ?? 0) + 1);
  const voteCount = new Map<string, number>();
  for (const v of votes ?? []) voteCount.set(v.user_id, (voteCount.get(v.user_id) ?? 0) + 1);

  const rows = (profiles ?? []) as Profile[];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-zinc-500">{rows.length} profile{rows.length === 1 ? '' : 's'} · read-only</p>
      </div>

      {error && <p className="text-red-600">Couldn’t load users: {error.message}</p>}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Captions</th>
              <th className="px-4 py-2 font-medium">Votes</th>
              <th className="px-4 py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No users yet.</td></tr>
            ) : rows.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
                        {displayName(p).slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span>{displayName(p)}</span>
                    {p.is_superadmin && <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs text-white">admin</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-600">{p.email ?? '—'}</td>
                <td className="px-4 py-3 tabular-nums">{captionCount.get(p.id) ?? 0}</td>
                <td className="px-4 py-3 tabular-nums">{voteCount.get(p.id) ?? 0}</td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-500">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
