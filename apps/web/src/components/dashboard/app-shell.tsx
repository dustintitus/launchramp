import { DashboardHeader } from './dashboard-header';
import { DashboardShell } from './dashboard-shell';
import { DashboardSidebar } from './dashboard-sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <div className="flex min-h-0 flex-1">
          <DashboardSidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
              <div className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-slate-300/40 bg-app-canvas shadow-sm">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
