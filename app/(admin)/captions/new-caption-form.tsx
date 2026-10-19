'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createCaptionAction, type FormState } from '../../actions';

export default function NewCaptionForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createCaptionAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="rounded-xl border bg-white p-4">
      <p className="mb-3 font-semibold">Add a caption</p>
      <div className="flex flex-col gap-2 md:flex-row">
        <input name="topic" required placeholder="Topic (e.g. Butler at 3am)" className="rounded-md border px-3 py-2 text-sm md:w-56" />
        <input name="content" required placeholder="Caption text" className="flex-1 rounded-md border px-3 py-2 text-sm" />
        <button
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {pending ? 'Adding…' : 'Add'}
        </button>
      </div>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      {state.ok && <p className="mt-2 text-sm text-green-700">{state.ok}</p>}
    </form>
  );
}
