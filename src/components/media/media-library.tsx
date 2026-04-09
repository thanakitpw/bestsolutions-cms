'use client'
import { useState } from 'react'
import { Search, ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MediaUploadZone } from './media-upload-zone'
import { MediaCard } from './media-card'
import { MediaDetailPanel } from './media-detail-panel'
import { DeleteMediaDialog } from './delete-media-dialog'

export type MediaItem = {
  id: string
  filename: string
  public_url: string
  mime_type: string
  size: number
  width?: number | null
  height?: number | null
  alt_text?: { th?: string; en?: string } | null
  created_at: string
}

type Props = {
  initialItems: MediaItem[]
  tenantId: string
}

export function MediaLibrary({ initialItems, tenantId }: Props) {
  const [items, setItems] = useState<MediaItem[]>(initialItems)
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(initialItems.length)
  const [hasMore, setHasMore] = useState(initialItems.length === 50)

  const filtered = search
    ? items.filter(i => i.filename.toLowerCase().includes(search.toLowerCase()))
    : items

  function handleUploaded(newItem: MediaItem) {
    setItems(prev => [newItem, ...prev])
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/media/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== id))
      setDeleteTarget(null)
      if (selectedItem?.id === id) setSelectedItem(null)
      toast.success('ลบไฟล์แล้ว')
    } else {
      const json = await res.json()
      toast.error(json.error ?? 'ลบไม่สำเร็จ')
    }
  }

  async function handleLoadMore() {
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/media?limit=50&offset=${offset}`)
      const json = await res.json()
      if (res.ok) {
        const newItems: MediaItem[] = json.data ?? []
        setItems(prev => [...prev, ...newItems])
        setOffset(prev => prev + newItems.length)
        setHasMore(newItems.length === 50)
      } else {
        toast.error(json.error ?? 'โหลดเพิ่มเติมล้มเหลว')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Upload Zone */}
      <MediaUploadZone onUploaded={handleUploaded} tenantId={tenantId} />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ค้นหาจากชื่อไฟล์..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-lg border border-dashed">
          <ImageIcon className="h-10 w-10 text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">
            {search ? 'ไม่พบไฟล์ที่ค้นหา' : 'ยังไม่มีรูปภาพ — อัปโหลดไฟล์ด้านบน'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onClick={() => setSelectedItem(item)}
              onDelete={() => setDeleteTarget(item)}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {!search && hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
          </Button>
        </div>
      )}

      {/* Detail Panel */}
      {selectedItem && (
        <MediaDetailPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdated={(updated) => setItems(prev => prev.map(i => i.id === updated.id ? updated : i))}
          onDelete={() => { setDeleteTarget(selectedItem); setSelectedItem(null) }}
        />
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteMediaDialog
          item={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
