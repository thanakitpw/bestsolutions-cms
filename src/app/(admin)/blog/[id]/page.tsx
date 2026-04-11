import { notFound } from 'next/navigation'
import { assertRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'
import { createServerClient } from '@/lib/supabase/server'
import { ArticleEditor } from './_components/article-editor'

export default async function ArticleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await assertRole('editor')

  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch {
    notFound()
  }

  const { id } = await params
  const supabase = createServerClient()

  const [articleResult, categoriesResult] = await Promise.all([
    supabase
      .from('articles')
      .select('*, category:categories(id, name)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single(),

    supabase
      .from('categories')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('type', 'article')
      .order('sort_order', { ascending: true }),
  ])

  if (articleResult.error || !articleResult.data) notFound()

  return (
    <ArticleEditor
      article={articleResult.data as Parameters<typeof ArticleEditor>[0]['article']}
      categories={categoriesResult.data as { id: string; name: { th?: string; en?: string } }[] ?? []}
    />
  )
}
