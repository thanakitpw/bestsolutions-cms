import { createServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'
import { redirect } from 'next/navigation'
import { MediaLibrary } from '@/components/media/media-library'

export default async function MediaPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let tenantId: string
  try {
    tenantId = await getTenantId()
  } catch {
    redirect('/login')
  }

  const { data: initialItems } = await supabase
    .from('media_items')
    .select('id, filename, public_url, mime_type, size, width, height, alt_text, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Media Library</h1>
        <p className="text-[13px] text-[#999]">จัดการรูปภาพและไฟล์ทั้งหมด</p>
      </div>
      <MediaLibrary initialItems={(initialItems ?? []) as import('@/components/media/media-library').MediaItem[]} tenantId={tenantId} />
    </div>
  )
}
