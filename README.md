# Wall

Next.js App Router starter with TypeScript, Tailwind CSS, shadcn/ui, and Supabase.

## Run locally

Dependencies are installed. For a fresh checkout, run `npm ci` first.

```powershell
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000. The starter page works without Supabase credentials.

## Connect Supabase

Create or select a project in the [Supabase dashboard](https://supabase.com/dashboard), then copy its project URL and publishable key from the Connect dialog into `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Restart the development server after changing environment variables. Use only the publishable key here; secret and service-role keys must stay server-side. A hosted Supabase project, database tables, and authentication screens are not created by this starter.

Client Components:

```tsx
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
```

Server Components, Server Actions, and Route Handlers:

```tsx
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
```

`src/proxy.ts` refreshes Supabase sessions when credentials are configured. Routes remain public; add verified identity checks with `supabase.auth.getClaims()` when implementing protected pages. Enable Row Level Security and appropriate policies for any tables exposed through the API.

## UI components

shadcn/ui is configured in `components.json`. Add components with:

```bash
npx shadcn@latest add input dialog dropdown-menu
```

Components live in `src/components/ui`, and theme tokens live in `src/app/globals.css`.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

After building, run `npm start` to serve the production app.

## Documentation

- [Next.js](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/docs/installation/next)
- [Supabase server-side clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs)
