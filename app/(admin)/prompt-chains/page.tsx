import { requireAdmin } from '@/lib/admin';
import MixInput from './mix-input';

type Flavor = {
  id: number;
  slug: string;
  description: string | null;
  humor_flavor_mix: { caption_count: number } | { caption_count: number }[] | null;
  humor_flavor_steps: {
    id: number;
    step_order: number;
    description: string | null;
    temperature: number;
    prompt_template: string;
    llm_models: { api_model_id: string; is_active: boolean } | null;
  }[];
};

export default async function PromptChainsPage() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from('humor_flavors')
    .select(
      'id, slug, description, humor_flavor_mix(caption_count), humor_flavor_steps(id, step_order, description, temperature, prompt_template, llm_models(api_model_id, is_active))'
    )
    .order('id');
  const flavors = (data ?? []) as unknown as Flavor[];

  const mixCount = (f: Flavor) => {
    const m = Array.isArray(f.humor_flavor_mix) ? f.humor_flavor_mix[0] : f.humor_flavor_mix;
    return m?.caption_count ?? 0;
  };
  const total = flavors.reduce((sum, f) => sum + mixCount(f), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prompt chains</h1>
        <p className="text-sm text-zinc-500">
          Each chain (humor flavor) runs its steps in order; each step’s output feeds the next as{' '}
          <code className="rounded bg-zinc-100 px-1">{'{{previous_output}}'}</code>. The mix sets how many captions each
          chain writes per request. Right now a request produces <strong>{total}</strong> caption{total === 1 ? '' : 's'}.
        </p>
      </div>
      {error && <p className="text-red-600">Couldn’t load: {error.message}</p>}

      {flavors.map((f) => (
        <section key={f.id} className="rounded-xl border bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-mono text-lg font-semibold">{f.slug}</h2>
              <p className="text-sm text-zinc-500">{f.description}</p>
            </div>
            <MixInput humorFlavorId={f.id} initial={mixCount(f)} />
          </div>

          <ol className="mt-4 space-y-3">
            {[...f.humor_flavor_steps].sort((a, b) => a.step_order - b.step_order).map((s) => (
              <li key={s.id} className="rounded-lg border border-zinc-200 p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs font-semibold text-white">Step {s.step_order}</span>
                  <span className="font-medium">{s.description}</span>
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-xs text-blue-800">
                    {s.llm_models?.api_model_id ?? 'no model'}
                    {s.llm_models && !s.llm_models.is_active && ' (inactive)'}
                  </span>
                  <span className="text-xs text-zinc-500">temperature {Number(s.temperature).toFixed(1)}</span>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-800">Prompt template</summary>
                  <pre className="mt-2 whitespace-pre-wrap rounded bg-zinc-50 p-3 text-xs">{s.prompt_template}</pre>
                </details>
              </li>
            ))}
            {f.humor_flavor_steps.length === 0 && <li className="text-sm text-zinc-500">No steps.</li>}
          </ol>
        </section>
      ))}
    </div>
  );
}
