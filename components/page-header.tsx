import { ActivityFeed } from "@/components/activity-feed";

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline px-8 py-5">
      <div>
        <h1 className="text-[17px] font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        <ActivityFeed />
      </div>
    </div>
  );
}
