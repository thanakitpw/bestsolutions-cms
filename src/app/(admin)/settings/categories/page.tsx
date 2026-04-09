import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'
import { PageHeader } from '@/components/layout/page-header'
import { CategoriesManager } from '@/components/settings/categories-manager'

export default async function CategoriesSettingsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch {
    redirect('/login')
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, type, sort_order')
    .eq('tenant_id', tenantId)
    .order('type')
    .order('sort_order', { ascending: true })

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Categories"
        breadcrumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'Categories' },
        ]}
      />
      <CategoriesManager initialCategories={categories ?? []} />
    </div>
  )
}
