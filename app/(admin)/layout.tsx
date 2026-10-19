import Link from 'next/link';
import { requireAdmin, displayName } from '@/lib/admin';
import { signOutAction } from '../actions';

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/captions', label: 'Captions' },
  { href: '/votes', label: 'Votes' },
  { href: '/users', label: 'Users' },
];

export default async function AdminLayout({ children }: LayoutProps<'/'>) {
  const { supabase, user } = await requireAdmin();
  const { data: me } = await supabase
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b bg-white md:w-56 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-4 md:block">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Lion Laughs</p>
            <p className="text-lg font-bold">Admin</p>
          </div>
          <form action={signOutAction} className="md:hidden">
            <button className="text-sm text-zinc-500 underline">Sign out</button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden border-t px-5 py-4 text-sm md:block">
          <p className="truncate text-zinc-600">{me ? displayName(me) : user.email}</p>
          <form action={signOutAction}>
            <button className="mt-1 text-zinc-500 underline hover:text-zinc-900">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
