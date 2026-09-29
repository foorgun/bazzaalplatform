import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm font-medium text-ink">Campaign not found</p>
      <p className="max-w-sm text-[13px] text-ink-muted">
        It may have been deleted, or your role does not have access to it.
      </p>
      <Button asChild variant="outline" size="sm" className="mt-1">
        <Link href="/campaigns">Back to campaigns</Link>
      </Button>
    </div>
  );
}
