'use client';

import { useState, useTransition } from 'react';
import { updateMixAction } from '../../actions';

export default function MixInput({ humorFlavorId, initial }: { humorFlavorId: number; initial: number }) {
  const [value, setValue] = useState(String(initial));
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const dirty = value !== String(initial);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await updateMixAction(humorFlavorId, Number(value));
          setMessage(res.error ?? res.ok ?? '');
        });
      }}
      className="flex items-end gap-2"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600">Captions per request (mix)</span>
        <input
          type="number"
          min={0}
          max={10}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-24 rounded-md border border-zinc-300 px-2 py-1.5"
        />
      </label>
      <button
        disabled={pending || !dirty}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
      {message && <span className="pb-1.5 text-xs text-zinc-500">{message}</span>}
    </form>
  );
}
