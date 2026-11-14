import { ArrowUpRight, Layers } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

const stack = ["Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "Supabase"];

export default function Home() {
  return (
    <main className="flex min-h-svh flex-1 items-center justify-center px-6 py-20">
      <div className="w-full max-w-xl space-y-10">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Layers className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Your next idea starts here.</p>
          <h1 className="text-6xl font-semibold tracking-tight">Wall</h1>
          <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
            A fresh foundation. Ready for you to make it your own.
          </p>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Technology stack">
          {stack.map((name) => (
            <li key={name} className="rounded-full border px-3 py-1 text-xs font-medium">
              {name}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          <a className={buttonVariants()} href="https://nextjs.org/docs">
            Next.js docs <ArrowUpRight aria-hidden="true" />
          </a>
          <a className={buttonVariants({ variant: "outline" })} href="https://supabase.com/dashboard">
            Open Supabase <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </div>
    </main>
  );
}
