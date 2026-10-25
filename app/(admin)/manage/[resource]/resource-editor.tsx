'use client';

import { useState, useTransition } from 'react';
import type { Field } from '@/lib/resources';
import { createResourceRow, deleteResourceRow, updateResourceRow } from '../../../actions';

export type Option = { value: string; label: string };
type Values = Record<string, string | boolean>;

function toValues(fields: Field[], row?: Record<string, unknown>): Values {
  const v: Values = {};
  for (const f of fields) {
    const raw = row?.[f.name];
    v[f.name] = f.type === 'boolean' ? (row ? Boolean(raw) : true) : raw == null ? '' : String(raw);
  }
  return v;
}

function display(field: Field, value: unknown, options: Option[] | undefined) {
  if (field.type === 'boolean') return value ? 'Yes' : 'No';
  if (field.type === 'select') {
    if (value == null) return field.options?.allowNone ?? '—';
    return options?.find((o) => o.value === String(value))?.label ?? String(value);
  }
  return value == null || value === '' ? '—' : String(value);
}

function Input({ field, value, onChange, options }: {
  field: Field;
  value: string | boolean;
  onChange: (v: string | boolean) => void;
  options?: Option[];
}) {
  const cls = 'w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm';
  if (field.type === 'boolean') {
    return <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />;
  }
  if (field.type === 'textarea') {
    return <textarea value={String(value)} onChange={(e) => onChange(e.target.value)} rows={2} className={cls} placeholder={field.placeholder} />;
  }
  if (field.type === 'select') {
    return (
      <select value={String(value)} onChange={(e) => onChange(e.target.value)} className={cls}>
        <option value="">{field.options?.allowNone ?? 'Choose…'}</option>
        {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  return (
    <input
      type={field.type === 'number' ? 'number' : 'text'}
      value={String(value)}
      onChange={(e) => onChange(e.target.value)}
      className={cls}
      placeholder={field.placeholder}
    />
  );
}

export default function ResourceEditor({ resourceKey, fields, rows, options }: {
  resourceKey: string;
  fields: Field[];
  rows: Record<string, unknown>[];
  options: Record<string, Option[]>;
}) {
  const [draft, setDraft] = useState<Values>(() => toValues(fields));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Values>({});
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string; ok?: string }>, onOk?: () => void) {
    startTransition(async () => {
      const res = await action();
      if (res.error) setMessage({ kind: 'error', text: res.error });
      else {
        setMessage({ kind: 'ok', text: res.ok ?? 'Done.' });
        onOk?.();
      }
    });
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => createResourceRow(resourceKey, draft), () => setDraft(toValues(fields)));
        }}
        className="rounded-xl border bg-white p-4"
      >
        <p className="mb-3 font-semibold">Add new</p>
        <div className="grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          {fields.map((f) => (
            <label key={f.name} className="flex flex-col gap-1 text-sm">
              <span className="text-zinc-600">{f.label}{f.required && ' *'}</span>
              <Input field={f} value={draft[f.name]} onChange={(v) => setDraft({ ...draft, [f.name]: v })} options={options[f.name]} />
            </label>
          ))}
        </div>
        <button disabled={pending} className="mt-3 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
          {pending ? 'Saving…' : 'Add'}
        </button>
      </form>

      {message && (
        <p className={`text-sm ${message.kind === 'error' ? 'text-red-600' : 'text-green-700'}`}>{message.text}</p>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-zinc-50 text-left text-zinc-500">
            <tr>
              {fields.map((f) => <th key={f.name} className="px-4 py-2 font-medium">{f.label}</th>)}
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr><td colSpan={fields.length + 1} className="px-4 py-8 text-center text-zinc-500">Nothing here yet.</td></tr>
            ) : rows.map((row) => {
              const id = Number(row.id);
              const editing = editingId === id;
              return (
                <tr key={id} className={pending && editing ? 'opacity-50' : ''}>
                  {fields.map((f) => (
                    <td key={f.name} className="px-4 py-3 align-top">
                      {editing ? (
                        <Input field={f} value={editValues[f.name]} onChange={(v) => setEditValues({ ...editValues, [f.name]: v })} options={options[f.name]} />
                      ) : (
                        <span className={f.type === 'textarea' ? 'block max-w-md' : ''}>{display(f, row[f.name], options[f.name])}</span>
                      )}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right align-top">
                    {editing ? (
                      <>
                        <button
                          onClick={() => run(() => updateResourceRow(resourceKey, id, editValues), () => setEditingId(null))}
                          disabled={pending}
                          className="mr-3 font-medium text-blue-700 hover:underline"
                        >
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-zinc-500 hover:underline">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(id); setEditValues(toValues(fields, row)); setMessage(null); }}
                          className="mr-3 text-blue-700 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete this row?')) run(() => deleteResourceRow(resourceKey, id)); }}
                          disabled={pending}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
