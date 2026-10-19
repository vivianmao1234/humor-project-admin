'use client';

import { useState, useTransition } from 'react';
import { deleteCaptionAction, updateCaptionAction } from '../../actions';

interface Caption {
  id: number;
  topic: string;
  content: string;
  model: string;
  prompt: string;
  created_at: string;
  up: number;
  down: number;
}

export default function CaptionRow({ caption }: { caption: Caption }) {
  const [editing, setEditing] = useState(false);
  const [topic, setTopic] = useState(caption.topic);
  const [content, setContent] = useState(caption.content);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const res = await updateCaptionAction(caption.id, topic, content);
      if (res.error) setError(res.error);
      else {
        setError('');
        setEditing(false);
      }
    });
  }

  function remove() {
    const votes = caption.up + caption.down;
    const warning = votes ? ` Its ${votes} vote${votes === 1 ? '' : 's'} will be deleted too.` : '';
    if (!confirm(`Delete this caption?${warning}`)) return;
    startTransition(async () => {
      const res = await deleteCaptionAction(caption.id);
      if (res.error) setError(res.error);
    });
  }

  return (
    <tr className={pending ? 'opacity-50' : ''}>
      <td className="px-4 py-3 align-top">
        {editing ? (
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={2} className="w-full min-w-64 rounded-md border px-2 py-1" />
        ) : (
          <p className="max-w-md">{caption.content}</p>
        )}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
      <td className="px-4 py-3 align-top">
        {editing ? (
          <input value={topic} onChange={(e) => setTopic(e.target.value)} className="w-40 rounded-md border px-2 py-1" />
        ) : (
          <span className="text-zinc-600">{caption.topic}</span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-top tabular-nums">
        {caption.up}▲ {caption.down}▼
      </td>
      <td className="px-4 py-3 align-top">
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs" title={caption.prompt}>
          {caption.model}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-top text-zinc-500">
        {new Date(caption.created_at).toLocaleDateString()}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right align-top">
        {editing ? (
          <>
            <button onClick={save} disabled={pending} className="mr-3 font-medium text-blue-700 hover:underline">Save</button>
            <button
              onClick={() => { setEditing(false); setTopic(caption.topic); setContent(caption.content); setError(''); }}
              className="text-zinc-500 hover:underline"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="mr-3 text-blue-700 hover:underline">Edit</button>
            <button onClick={remove} disabled={pending} className="text-red-600 hover:underline">Delete</button>
          </>
        )}
      </td>
    </tr>
  );
}
