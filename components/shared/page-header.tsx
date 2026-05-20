interface PageHeaderProps {
  title: string;
  description?: string;
  agent?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, agent, children }: PageHeaderProps) {
  return (
    <div className="mb-7 flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {agent && (
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-medium text-orange-700">
              {agent}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
