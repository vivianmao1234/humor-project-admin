import { requireAdmin, displayName } from '@/lib/admin';

type Caption = { id: number; topic: string; content: string; model: string; created_at: string };
type Vote = { vote: number; created_at: string; caption_id: number; user_id: string };
type Profile = { id: string; first_name: string | null; last_name: string | null; email: string | null };

const DAYS = 14;

export default async function Dashboard() {
  const { supabase } = await requireAdmin();

  const [{ data: captions }, { data: votes }, { data: profiles }] = await Promise.all([
    supabase.from('captions').select('id, topic, content, model, created_at'),
    supabase.from('caption_votes').select('vote, created_at, caption_id, user_id'),
    supabase.from('profiles').select('id, first_name, last_name, email'),
  ]);

  const c = (captions ?? []) as Caption[];
  const v = (votes ?? []) as Vote[];
  const p = (profiles ?? []) as Profile[];

  const ups = v.filter((x) => x.vote === 1).length;
  const upRate = v.length ? Math.round((ups / v.length) * 100) : null;

  // Per-caption tallies
  const tally = new Map<number, { up: number; down: number }>();
  for (const x of v) {
    const t = tally.get(x.caption_id) ?? { up: 0, down: 0 };
    if (x.vote === 1) t.up++;
    else t.down++;
    tally.set(x.caption_id, t);
  }
  const scored = c.map((cap) => {
    const t = tally.get(cap.id) ?? { up: 0, down: 0 };
    return { ...cap, ...t, score: t.up - t.down, total: t.up + t.down };
  });
  const top = [...scored].filter((s) => s.total > 0).sort((a, b) => b.score - a.score).slice(0, 5);
  const divisive = [...scored]
    .filter((s) => s.up > 0 && s.down > 0)
    .sort((a, b) => Math.min(b.up, b.down) - Math.min(a.up, a.down) || b.total - a.total)
    .slice(0, 3);

  // Topics: which prompts produce the funniest captions on average
  const topics = new Map<string, { captions: number; score: number }>();
  for (const s of scored) {
    const t = topics.get(s.topic) ?? { captions: 0, score: 0 };
    t.captions++;
    t.score += s.score;
    topics.set(s.topic, t);
  }
  const topTopics = [...topics.entries()]
    .map(([topic, t]) => ({ topic, ...t, avg: t.score / t.captions }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  // Most active voters
  const byUser = new Map<string, number>();
  for (const x of v) byUser.set(x.user_id, (byUser.get(x.user_id) ?? 0) + 1);
  const profileById = new Map(p.map((x) => [x.id, x]));
  const topVoters = [...byUser.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Votes per day, last 14 days
  const days: { key: string; label: string; count: number }[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: 0,
    });
  }
  const dayIndex = new Map(days.map((d, i) => [d.key, i]));
  for (const x of v) {
    const i = dayIndex.get(x.created_at.slice(0, 10));
    if (i !== undefined) days[i].count++;
  }
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Users" value={p.length} />
        <Stat label="Captions" value={c.length} />
        <Stat label="Votes" value={v.length} />
        <Stat label="Upvote rate" value={upRate === null ? '—' : `${upRate}%`} hint="share of votes that are ▲" />
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Votes per day</h2>
        <p className="text-sm text-zinc-500">Last {DAYS} days · hover a bar for the count</p>
        <div className="mt-4 flex h-40 items-end gap-[2px]" role="img" aria-label="Votes per day bar chart">
          {days.map((d) => (
            <div key={d.key} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-blue-600 group-hover:bg-blue-800"
                style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count ? 4 : 0 }}
              />
              <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-0.5 text-xs text-white group-hover:block">
                {d.label}: {d.count}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-zinc-500">
          <span>{days[0].label}</span>
          <span>{days[days.length - 1].label}</span>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Funniest captions" subtitle="Highest score (▲ minus ▼)">
          {top.length === 0 ? <Empty /> : top.map((s) => (
            <Row key={s.id} left={s.content} right={`${s.score > 0 ? '+' : ''}${s.score}`} sub={`${s.up}▲ ${s.down}▼ · ${s.topic}`} />
          ))}
        </Panel>

        <Panel title="Most divisive" subtitle="Captions people disagree on">
          {divisive.length === 0 ? <Empty text="No caption has both ▲ and ▼ votes yet." /> : divisive.map((s) => (
            <Row key={s.id} left={s.content} right={`${s.up}▲ ${s.down}▼`} sub={s.topic} />
          ))}
        </Panel>

        <Panel title="Best topics" subtitle="Average score per caption">
          {topTopics.length === 0 ? <Empty /> : topTopics.map((t) => (
            <Row key={t.topic} left={t.topic} right={t.avg.toFixed(1)} sub={`${t.captions} caption${t.captions === 1 ? '' : 's'}`} />
          ))}
        </Panel>

        <Panel title="Most active voters" subtitle="Votes cast">
          {topVoters.length === 0 ? <Empty /> : topVoters.map(([id, n]) => {
            const prof = profileById.get(id);
            return <Row key={id} left={prof ? displayName(prof) : id.slice(0, 8)} right={String(n)} />;
          })}
        </Panel>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-white p-4" title={hint}>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mb-3 text-sm text-zinc-500">{subtitle}</p>
      <ul className="divide-y">{children}</ul>
    </section>
  );
}

function Row({ left, right, sub }: { left: string; right: string; sub?: string }) {
  return (
    <li className="flex items-start justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-sm">{left}</p>
        {sub && <p className="text-xs text-zinc-500">{sub}</p>}
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums">{right}</span>
    </li>
  );
}

function Empty({ text = 'No data yet.' }: { text?: string }) {
  return <li className="py-2 text-sm text-zinc-500">{text}</li>;
}
