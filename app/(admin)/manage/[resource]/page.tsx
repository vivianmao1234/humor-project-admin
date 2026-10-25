import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { RESOURCES } from '@/lib/resources';
import ResourceEditor, { type Option } from './resource-editor';

export default async function ManagePage({ params }: PageProps<'/manage/[resource]'>) {
  const { resource: key } = await params;
  const resource = RESOURCES[key];
  if (!resource) notFound();

  const { supabase } = await requireAdmin();

  const { data: rows, error } = await supabase
    .from(resource.table)
    .select('*')
    .order(resource.orderBy.column, { ascending: resource.orderBy.ascending })
    .limit(500);

  // Load options for every select field.
  const options: Record<string, Option[]> = {};
  for (const field of resource.fields) {
    if (field.type !== 'select' || !field.options) continue;
    const { data } = await supabase.from(field.options.table).select(`id, ${field.options.labelColumn}`).order('id');
    options[field.name] = ((data ?? []) as unknown as Record<string, string | number>[]).map((r) => ({
      value: String(r.id),
      label: String(r[field.options!.labelColumn]),
    }));
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{resource.title}</h1>
        <p className="text-sm text-zinc-500">{resource.description}</p>
      </div>
      {error && <p className="text-red-600">Couldn’t load: {error.message}</p>}
      <ResourceEditor
        resourceKey={key}
        fields={resource.fields}
        rows={(rows ?? []) as Record<string, unknown>[]}
        options={options}
      />
    </div>
  );
}
