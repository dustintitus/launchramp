export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-dashboard-frame">
      {children}
    </div>
  );
}
