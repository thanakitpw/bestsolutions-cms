import Link from 'next/link'
import { assertRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'
import { createServerClient } from '@/lib/supabase/server'
import { getLocaleValue } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProjectsFilters } from './_components/projects-filters'
import { NewProjectDialog } from './_components/new-project-dialog'

type SearchParams = Promise<{
  search?: string
  category_id?: string
  status?: string
  page?: string
}>

export default async function ProjectsListPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await assertRole('editor')

  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <p className="text-sm">กรุณาเลือก tenant ก่อนเข้าถึงหน้า Projects</p>
        <Link href="/" className="text-sm text-primary underline underline-offset-2">
          กลับไปหน้า Dashboard
        </Link>
      </div>
    )
  }

  const params = await searchParams
  const search = params.search ?? ''
  const categoryId = params.category_id ?? 'all'
  const status = params.status ?? 'all'
  const page = Math.max(1, Number(params.page ?? 1))
  const limit = 12

  const supabase = createServerClient()

  // Fetch categories + projects in parallel
  let projectsQuery = supabase
    .from('projects')
    .select(
      'id, title, slug, status, cover_image_url, created_at, category:categories(id, name)',
      { count: 'exact' }
    )
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (search) {
    projectsQuery = projectsQuery.or(
      `slug.ilike.%${search}%,title->>th.ilike.%${search}%,title->>en.ilike.%${search}%`
    )
  }
  if (categoryId !== 'all') {
    projectsQuery = projectsQuery.eq('category_id', categoryId)
  }
  const validStatuses = ['draft', 'published', 'archived'] as const
  type ValidStatus = (typeof validStatuses)[number]
  if (status !== 'all' && validStatuses.includes(status as ValidStatus)) {
    projectsQuery = projectsQuery.eq('status', status as ValidStatus)
  }

  projectsQuery = projectsQuery.range((page - 1) * limit, page * limit - 1)

  const [categoriesResult, projectsResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('type', 'project')
      .order('sort_order', { ascending: true }),
    projectsQuery,
  ])

  const categories = categoriesResult.data ?? []
  const projects = projectsResult.data ?? []
  const total = projectsResult.count ?? 0
  const totalPages = Math.ceil(total / limit)

  const statusBadgeVariant = (s: string): 'default' | 'secondary' | 'outline' => {
    if (s === 'published') return 'default'
    if (s === 'archived') return 'secondary'
    return 'outline'
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            จัดการผลงานทั้งหมด {total > 0 && `(${total} รายการ)`}
          </p>
        </div>
        <NewProjectDialog categories={categories as { id: string; name: { th?: string; en?: string } }[]} />
      </div>

      {/* Filters */}
      <ProjectsFilters
        categories={categories as { id: string; name: { th?: string; en?: string } }[]}
        currentSearch={search}
        currentCategoryId={categoryId}
        currentStatus={status}
      />

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_160px_100px_120px_80px] gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
          {['ชื่อโปรเจกต์', 'หมวดหมู่', 'สถานะ', 'วันที่สร้าง', ''].map((h) => (
            <span key={h} className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {h}
            </span>
          ))}
        </div>

        {/* Table Body */}
        {projects.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {search || categoryId !== 'all' || status !== 'all'
              ? 'ไม่พบโปรเจกต์ที่ตรงกับการค้นหา'
              : 'ยังไม่มีโปรเจกต์ กด "New Project" เพื่อสร้างรายการแรก'}
          </div>
        ) : (
          projects.map((project) => {
            const titleJson = project.title as { th?: string; en?: string } | null
            const title =
              getLocaleValue(titleJson, 'th') ||
              getLocaleValue(titleJson, 'en') ||
              '(ไม่มีชื่อ)'
            const categoryName = project.category
              ? getLocaleValue((project.category as { name: { th?: string; en?: string } }).name, 'th') ||
                getLocaleValue((project.category as { name: { th?: string; en?: string } }).name, 'en')
              : null
            const createdAt = project.created_at
              ? new Date(project.created_at).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '—'

            return (
              <div
                key={project.id}
                className="grid grid-cols-[1fr_160px_100px_120px_80px] gap-3 items-center border-b border-border/50 px-4 py-3 transition-colors last:border-0 hover:bg-muted/30"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="truncate text-sm font-medium">{title}</span>
                  <span className="truncate text-xs text-muted-foreground">{project.slug}</span>
                </div>
                <span className="text-sm text-muted-foreground truncate">
                  {categoryName ?? <span className="text-muted-foreground/50">—</span>}
                </span>
                <Badge variant={statusBadgeVariant(project.status ?? 'draft')} className="w-fit text-[10px]">
                  {project.status ?? 'draft'}
                </Badge>
                <span className="text-xs text-muted-foreground">{createdAt}</span>
                <Link
                  href={`/projects/${project.id}`}
                  className="text-xs text-primary hover:underline underline-offset-2"
                >
                  Edit
                </Link>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            หน้า {page} จาก {totalPages} ({total} รายการ)
          </span>
          <div className="flex gap-1">
            {page > 1 && (
              <Link href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}>
                <Button variant="outline" size="sm">← ก่อนหน้า</Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}>
                <Button variant="outline" size="sm">ถัดไป →</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
