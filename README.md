# Lion Laughs Admin

Admin area for the Lion Laughs caption rating app (Week 6). It shares the rating app's Supabase database.

- **Dashboard**: totals, upvote rate, votes per day, funniest and most divisive captions, best topics, most active voters
- **Captions**: create, read, edit, and delete AI-generated captions
- **Votes**: read every upvote/downvote, filterable
- **Users**: read all profiles with caption and vote counts

## Access control

Every route requires a Google login (`proxy.ts`), and every page and server action also checks
`profiles.is_superadmin` (`lib/admin.ts`). Row Level Security enforces the same rule in the database,
so non-admins can't read other profiles or change captions even if they call the API directly.

**Avoiding the lockout:** users can't edit `is_superadmin` (column-level `UPDATE` grants only allow
name and photo). The first admin is set in the Supabase SQL Editor, which runs as the database owner
and bypasses RLS. See the bottom of `supabase/admin.sql`.

## Setup

1. Run the rating app's `supabase/schema.sql`, then this repo's `supabase/admin.sql`, in the Supabase SQL Editor.
2. Copy `.env.example` to `.env.local` and fill in the same Supabase URL and publishable key as the rating app.
3. `npm install && npm run dev`
