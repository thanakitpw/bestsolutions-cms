import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'
import { PageHeader } from '@/components/layout/page-header'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RecentContentList } from '@/components/dashboard/recent-content-list'
import { SelectTenantPrompt } from '@/components/dashboard/select-tenant-prompt'
import { LayoutGrid, FileText, MessageSquare, ImageIcon } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // handle super_admin ที่ยังไม่เลือก tenant
  let tenantId: string | null = null
  try {
    tenantId = await getTenantId()
  } catch (e) {
    if (e instanceof Error && e.message === 'SUPER_ADMIN_NO_TENANT_SELECTED') {
      return (
        <div className="p-8">
          <PageHeader title="Dashboard" />
          <SelectTenantPrompt />
        </div>
      )
    }
    redirect('/login')
  }

  // Fetch stats — Promise.allSettled เพื่อไม่ crash ถ้า table ยังไม่มี (ก่อน Story 2.1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [projectsRes, articlesRes, messagesRes, mediaRes] = await Promise.allSettled([
    db
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId!)
      .eq('status', 'published')
      .is('deleted_at', null),
    db
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId!)
      .eq('status', 'published')
      .is('deleted_at', null),
    db
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId!)
      .eq('is_read', false),
    db
      .from('media_items')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId!),
  ])

  const stats = {
    projects: projectsRes.status === 'fulfilled' ? (projectsRes.value.count ?? 0) : null,
    articles: articlesRes.status === 'fulfilled' ? (articlesRes.value.count ?? 0) : null,
    messages: messagesRes.status === 'fulfilled' ? (messagesRes.value.count ?? 0) : null,
    media: mediaRes.status === 'fulfilled' ? (mediaRes.value.count ?? 0) : null,
  }

  // Fetch recent content
  const [recentProjectsRes, recentArticlesRes] = await Promise.allSettled([
    db
      .from('projects')
      .select('id, title_th, title_en, status, created_at')
      .eq('tenant_id', tenantId!)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
    db
      .from('articles')
      .select('id, title_th, title_en, status, created_at')
      .eq('tenant_id', tenantId!)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  type ContentItem = { id: string; title_th?: string | null; title_en?: string | null; status: string; created_at: string }
  const recentProjects: ContentItem[] =
    recentProjectsRes.status === 'fulfilled' ? (recentProjectsRes.value.data ?? []) : []
  const recentArticles: ContentItem[] =
    recentArticlesRes.status === 'fulfilled' ? (recentArticlesRes.value.data ?? []) : []

  return (
    <div className="p-8 space-y-8">
      <PageHeader title="Dashboard" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Projects" value={stats.projects} icon={LayoutGrid} href="/projects" />
        <StatsCard label="Articles" value={stats.articles} icon={FileText} href="/blog" />
        <StatsCard label="ข้อความใหม่" value={stats.messages} icon={MessageSquare} href="/messages" />
        <StatsCard label="Media" value={stats.media} icon={ImageIcon} href="/media" />
      </div>

      {/* Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentContentList
          title="Projects ล่าสุด"
          items={recentProjects}
          createHref="/projects"
          createLabel="สร้าง Project"
        />
        <RecentContentList
          title="Articles ล่าสุด"
          items={recentArticles}
          createHref="/blog"
          createLabel="สร้าง Article"
        />
      </div>
    </div>
  )
}
