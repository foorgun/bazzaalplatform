import { PageHeader } from "@/components/page-header";
import { CardSkeleton } from "@/components/states";

export default function Loading() {
  return (
    <>
      <PageHeader title="Dashboard" description="Live overview of campaign operations." />
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="skeleton h-[320px] rounded-lg" />
          <div className="skeleton h-[320px] rounded-lg" />
        </div>
      </div>
    </>
  );
}
