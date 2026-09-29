import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-2xs uppercase tracking-[0.2em] text-accent">404</p>
      <p className="text-sm font-medium text-ink">Page not found</p>
      <Button asChild variant="outline" size="sm" className="mt-1">
        <Link href="/">Back to workspace</Link>
      </Button>
    </div>
  );
}
