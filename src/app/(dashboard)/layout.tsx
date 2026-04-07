import AdminSidebar from '@/components/admin/AdminSidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#F0EFED]">
      <AdminSidebar />
      <main className="flex flex-1 flex-col overflow-auto">
        {/* Top bar */}
        <header className="flex shrink-0 items-center justify-end gap-4 border-b border-[#E5E4E2] bg-white px-8 py-4">
          <span className="text-xs text-[#999]">
            {new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <div className="h-5 w-px bg-[#E5E4E2]" />
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E5E4E2]">
            <span className="text-xs text-[#999]">●</span>
          </div>
        </header>
        {/* Page content */}
        <div className="flex-1 overflow-auto p-8">{children}</div>
      </main>
    </div>
  );
}
