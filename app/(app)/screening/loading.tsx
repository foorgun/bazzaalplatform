import { PageHeader } from "@/components/page-header";

export default function Loading() {
  return (
    <>
      <PageHeader title="Screening" description="Review applications campaign by campaign." />
      <div className="flex h-[calc(100vh-57px)]">
        <div className="w-[280px] shrink-0 space-y-2 border-r border-hairline p-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-11 rounded-md" />
          ))}
        </div>
        <div className="flex-1 space-y-6 p-6">
          <div className="skeleton h-16 rounded-lg" />
          <div className="grid grid-cols-3 gap-3">
            <div className="skeleton h-[88px] rounded-lg" />
            <div className="skeleton h-[88px] rounded-lg" />
            <div className="skeleton h-[88px] rounded-lg" />
          </div>
          <div className="skeleton h-56 rounded-lg" />
          <div className="skeleton h-48 rounded-lg" />
        </div>
      </div>
    </>
  );
}
