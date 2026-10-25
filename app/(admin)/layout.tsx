import Link from 'next/link';
import { requireAdmin, displayName } from '@/lib/admin';
import { signOutAction } from '../actions';

const NAV = [
  {
    heading: 'Content',
    links: [
      { href: '/', label: 'Dashboard' },
      { href: '/captions', label: 'Captions' },
      { href: '/votes', label: 'Votes' },
      { href: '/users', label: 'Users' },
    ],
  },
  {
    heading: 'Pipeline',
    links: [
      { href: '/prompt-chains', label: 'Prompt chains' },
      { href: '/manage/terms', label: 'Terms' },
      { href: '/manage/examples', label: 'Examples' },
      { href: '/manage/models', label: 'LLM models' },
      { href: '/manage/providers', label: 'LLM providers' },
    ],
  },
  {
    heading: 'Observability',
    links: [
      { href: '/requests', label: 'Generation requests' },
      { href: '/llm-responses', label: 'LLM responses' },
    ],
  },
  {
    heading: 'Access',
    links: [
      { href: '/manage/signup-domains', label: 'Signup domains' },
      { href: '/manage/whitelisted-emails', label: 'Whitelisted emails' },
    ],
  },
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
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:gap-4">
          {NAV.map((section) => (
            <div key={section.heading} className="flex gap-1 md:flex-col">
              <p className="hidden px-3 text-xs font-medium uppercase tracking-wide text-zinc-400 md:block">
                {section.heading}
              </p>
              {section.links.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
                >
                  {n.label}
                </Link>
              ))}
            </div>
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
