import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function getStats() {
  const [projects, articles, messages] = await Promise.all([
    supabaseAdmin.from('projects').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('articles').select('id', { count: 'exact', head: true }),
    supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false),
  ]);

  return {
    projectCount: projects.count ?? 0,
    articleCount: articles.count ?? 0,
    unreadMessages: messages.count ?? 0,
  };
}

async function getRecentProjects() {
  const { data } = await supabaseAdmin
    .from('projects')
    .select('id, title_en, slug, category, location_en, year, status')
    .order('created_at', { ascending: false })
    .limit(4);
  return data ?? [];
}

async function getRecentMessages() {
  const { data } = await supabaseAdmin
    .from('messages')
    .select('id, name, message, project_type, is_read, created_at')
    .order('created_at', { ascending: false })
    .limit(4);
  return data ?? [];
}

const categoryColors: Record<string, string> = {
  commercial: 'text-[#C0392B] bg-[#C0392B]/8',
  cafe: 'text-[#2471A3] bg-[#2471A3]/8',
  residential: 'text-[#1ABC9C] bg-[#1ABC9C]/8',
  others: 'text-[#F1C40F] bg-[#F1C40F]/8',
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [stats, recentProjects, recentMessages] = await Promise.all([
    getStats(),
    getRecentProjects(),
    getRecentMessages(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard</h1>
          <p className="text-[13px] text-[#999]">Overview of your studio</p>
        </div>
        <div className="flex gap-2">
          <Link href="/projects/new">
            <Button>+ New Project</Button>
          </Link>
          <Link href="/blog/new">
            <Button variant="outline">+ New Article</Button>
          </Link>
        </div>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.1em] text-[#999]">
                Projects
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0EFED]">
                <span className="text-sm text-[#6B6B6B]">&#9634;</span>
              </div>
            </div>
            <span className="text-[32px] font-bold leading-none text-[#1A1A1A]">
              {stats.projectCount}
            </span>
            <span className="text-[11px] text-[#1ABC9C]">+2 this month</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.1em] text-[#999]">
                Articles
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0EFED]">
                <span className="text-sm text-[#6B6B6B]">&#9634;</span>
              </div>
            </div>
            <span className="text-[32px] font-bold leading-none text-[#1A1A1A]">
              {stats.articleCount}
            </span>
            <span className="text-[11px] text-[#1ABC9C]">+1 this month</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.1em] text-[#999]">
                Messages
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0EFED]">
                <span className="text-sm text-[#6B6B6B]">&#9646;</span>
              </div>
            </div>
            <span className="text-[32px] font-bold leading-none text-[#1A1A1A]">
              {stats.unreadMessages}
            </span>
            {stats.unreadMessages > 0 ? (
              <span className="text-[11px] text-[#C0392B]">
                &#9679; {stats.unreadMessages} unread
              </span>
            ) : (
              <span className="text-[11px] text-[#999]">No unread</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.1em] text-[#999]">
                Page Views
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0EFED]">
                <span className="text-sm text-[#6B6B6B]">&#9637;</span>
              </div>
            </div>
            <span className="text-[32px] font-bold leading-none text-[#1A1A1A]">
              2.4k
            </span>
            <span className="text-[11px] text-[#1ABC9C]">+18% vs last month</span>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Chart (left 60%) + Messages (right 40%) */}
      <div className="grid grid-cols-5 gap-4">
        {/* Page Views Chart */}
        <Card className="col-span-3">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#1A1A1A]">
                Page Views
              </span>
              <div className="flex gap-1.5">
                <span className="rounded bg-[#1A1A1A] px-2.5 py-1 text-[11px] text-white">
                  Monthly
                </span>
                <span className="rounded bg-[#F0EFED] px-2.5 py-1 text-[11px] text-[#999]">
                  Weekly
                </span>
              </div>
            </div>
            {/* Bar chart */}
            <div className="flex items-end gap-3 pt-2" style={{ height: 220 }}>
              {[
                { label: 'Oct', h: 35 },
                { label: 'Nov', h: 50 },
                { label: 'Dec', h: 42 },
                { label: 'Jan', h: 70, accent: true },
                { label: 'Feb', h: 60 },
                { label: 'Mar', h: 95, active: true },
              ].map((bar) => (
                <div
                  key={bar.label}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div
                    className={`w-full rounded ${
                      bar.active
                        ? 'bg-[#1A1A1A]'
                        : bar.accent
                          ? 'bg-[#999]'
                          : 'bg-[#E5E4E2]'
                    }`}
                    style={{ height: `${bar.h}%` }}
                  />
                  <span
                    className={`text-[10px] ${
                      bar.active
                        ? 'font-bold text-[#1A1A1A]'
                        : 'text-[#999]'
                    }`}
                  >
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card className="col-span-2">
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#1A1A1A]">
                Recent Messages
              </span>
              <Link
                href="/messages"
                className="text-[11px] text-[#999] hover:text-[#1A1A1A]"
              >
                View All &rarr;
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {recentMessages.length === 0 && (
                <p className="py-12 text-center text-[13px] text-[#999]">
                  No messages yet
                </p>
              )}
              {recentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 rounded-lg p-3 ${
                    msg.is_read
                      ? 'bg-[#FAFAF8]'
                      : 'border-l-[3px] border-[#C0392B] bg-[#FAFAF8]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[13px] ${
                        msg.is_read
                          ? 'text-[#6B6B6B]'
                          : 'font-bold text-[#1A1A1A]'
                      }`}
                    >
                      {msg.name}
                    </span>
                    <span className="text-[10px] text-[#999]">
                      {timeAgo(msg.created_at)}
                    </span>
                  </div>
                  <span className="line-clamp-1 text-[11px] text-[#6B6B6B]">
                    {msg.message}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Recent Projects (full width) */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[15px] font-bold text-[#1A1A1A]">
              Recent Projects
            </span>
            <Link
              href="/projects"
              className="text-[11px] text-[#999] hover:text-[#1A1A1A]"
            >
              View All &rarr;
            </Link>
          </div>
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex border-b border-[#E5E4E2] pb-2">
              <span className="w-[240px] text-[10px] uppercase tracking-[0.1em] text-[#999]">
                Project
              </span>
              <span className="w-[140px] text-[10px] uppercase tracking-[0.1em] text-[#999]">
                Category
              </span>
              <span className="w-[130px] text-[10px] uppercase tracking-[0.1em] text-[#999]">
                Location
              </span>
              <span className="w-[60px] text-[10px] uppercase tracking-[0.1em] text-[#999]">
                Year
              </span>
              <span className="w-[80px] text-[10px] uppercase tracking-[0.1em] text-[#999]">
                Status
              </span>
              <span className="flex-1 text-[10px] uppercase tracking-[0.1em] text-[#999]">
                Views
              </span>
            </div>
            {/* Rows */}
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center border-b border-[#F0EFED] py-3 transition-colors hover:bg-[#FAFAF8]"
              >
                <span className="w-[240px] text-[13px] font-bold text-[#1A1A1A]">
                  {project.title_en}
                </span>
                <span className="w-[140px]">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${categoryColors[project.category] ?? ''}`}
                  >
                    {project.category}
                  </Badge>
                </span>
                <span className="w-[130px] text-[12px] text-[#6B6B6B]">
                  {project.location_en ?? '—'}
                </span>
                <span className="w-[60px] text-[12px] text-[#6B6B6B]">
                  {project.year}
                </span>
                <span className="w-[80px]">
                  <Badge
                    variant="secondary"
                    className={
                      project.status === 'published'
                        ? 'text-[10px]'
                        : 'bg-[#F1C40F]/8 text-[10px] text-[#F1C40F]'
                    }
                  >
                    {project.status}
                  </Badge>
                </span>
                <span className="flex-1 text-[12px] text-[#6B6B6B]">—</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
