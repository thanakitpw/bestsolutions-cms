import { notFound } from 'next/navigation'
import { assertRole } from '@/lib/auth'
import { getTenantId } from '@/lib/tenant'
import { createServerClient } from '@/lib/supabase/server'
import { ProjectEditor } from './_components/project-editor'

export default async function ProjectEditorPage({
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

  const [projectResult, categoriesResult] = await Promise.all([
    supabase
      .from('projects')
      .select('*, category:categories(id, name)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single(),

    supabase
      .from('categories')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('type', 'project')
      .order('sort_order', { ascending: true }),
  ])

  if (projectResult.error || !projectResult.data) {
    notFound()
  }

  return (
    <ProjectEditor
      project={projectResult.data as Parameters<typeof ProjectEditor>[0]['project']}
      categories={categoriesResult.data as { id: string; name: { th?: string; en?: string } }[] ?? []}
    />
  )
}
