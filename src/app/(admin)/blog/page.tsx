import Link from 'next/link'
import { assertRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'
import { createServerClient } from '@/lib/supabase/server'
import { getLocaleValue } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArticlesFilters } from './_components/articles-filters'
import { NewArticleDialog } from './_components/new-article-dialog'

type SearchParams = Promise<{
  search?: string
  category_id?: string
  status?: string
  page?: string
}>

export default async function BlogListPage({ searchParams }: { searchParams: SearchParams }) {
  await assertRole('editor')

  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <p className="text-sm">กรุณาเลือก tenant ก่อนเข้าถึงหน้า Blog</p>
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

  const [categoriesResult, articlesResult] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('type', 'article')
      .order('sort_order', { ascending: true }),

    (() => {
      let q = supabase
        .from('articles')
        .select(
          'id, title, slug, status, cover_image_url, created_at, published_at, category:categories(id, name)',
          { count: 'exact' }
        )
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (search) {
        q = q.or(
          `slug.ilike.%${search}%,title->>th.ilike.%${search}%,title->>en.ilike.%${search}%`
        )
      }
      if (categoryId !== 'all') q = q.eq('category_id', categoryId)
      if (status !== 'all') q = q.eq('status', status as 'draft' | 'published' | 'archived')

      return q.range((page - 1) * limit, page * limit - 1)
    })(),
  ])

  const categories = categoriesResult.data ?? []
  const articles = articlesResult.data ?? []
  const total = articlesResult.count ?? 0
  const totalPages = Math.ceil(total / limit)

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const statusBadgeVariant = (s: string) => {
    if (s === 'published') return 'default' as const
    if (s === 'archived') return 'secondary' as const
    return 'outline' as const
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Articles</h1>
          <p className="text-sm text-muted-foreground">
            จัดการบทความทั้งหมด {total > 0 && `(${total} รายการ)`}
          </p>
        </div>
        <NewArticleDialog categories={categories as { id: string; name: { th?: string; en?: string } }[]} />
      </div>

      {/* Filters */}
      <ArticlesFilters
        categories={categories as { id: string; name: { th?: string; en?: string } }[]}
        currentSearch={search}
        currentCategoryId={categoryId}
        currentStatus={status}
      />

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="grid grid-cols-[1fr_160px_110px_100px_80px] gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
          {['ชื่อบทความ', 'หมวดหมู่', 'วันที่เผยแพร่', 'สถานะ', ''].map((h) => (
            <span
              key={h}
              className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              {h}
            </span>
          ))}
        </div>

        {articles.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {search || categoryId !== 'all' || status !== 'all'
              ? 'ไม่พบบทความที่ตรงกับการค้นหา'
              : 'ยังไม่มีบทความ กด "New Article" เพื่อสร้างบทความแรก'}
          </div>
        ) : (
          articles.map((article) => {
            const title =
              getLocaleValue(article.title as Record<string, string>, 'th') ||
              getLocaleValue(article.title as Record<string, string>, 'en') ||
              '(ไม่มีชื่อ)'
            const categoryName = article.category
              ? getLocaleValue(
                  (article.category as { name: Record<string, string> }).name,
                  'th'
                ) ||
                getLocaleValue(
                  (article.category as { name: Record<string, string> }).name,
                  'en'
                )
              : null

            return (
              <div
                key={article.id}
                className="grid grid-cols-[1fr_160px_110px_100px_80px] gap-3 items-center border-b border-border/50 px-4 py-3 transition-colors last:border-0 hover:bg-muted/30"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="truncate text-sm font-medium">{title}</span>
                  <span className="truncate text-xs text-muted-foreground">{article.slug}</span>
                </div>
                <span className="text-sm text-muted-foreground truncate">
                  {categoryName ?? <span className="text-muted-foreground/50">—</span>}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(article.published_at)}
                </span>
                <Badge
                  variant={statusBadgeVariant(article.status ?? 'draft')}
                  className="w-fit text-[10px]"
                >
                  {article.status}
                </Badge>
                <Link
                  href={`/blog/${article.id}`}
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
              <Link
                href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
              >
                <Button variant="outline" size="sm">← ก่อนหน้า</Button>
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
              >
                <Button variant="outline" size="sm">ถัดไป →</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
