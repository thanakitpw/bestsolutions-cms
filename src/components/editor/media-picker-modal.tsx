'use client'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MediaItem = {
  id: string
  filename: string
  storage_path: string
  public_url: string
  mime_type: string
  size: number
  width: number | null
  height: number | null
  alt_text: { th?: string; en?: string } | null
  created_at: string
}

type MediaPickerModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (item: MediaItem) => void
}

export function MediaPickerModal({ open, onClose, onSelect }: MediaPickerModalProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setSelectedId(null)
      return
    }

    setLoading(true)
    setError(null)

    fetch('/api/media?limit=100')
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed')
        return res.json() as Promise<{ data: MediaItem[] }>
      })
      .then(({ data }) => {
        setItems(data.filter((item) => item.mime_type.startsWith('image/')))
      })
      .catch(() => setError('ไม่สามารถโหลดรูปภาพได้'))
      .finally(() => setLoading(false))
  }, [open])

  function handleSelect() {
    const item = items.find((i) => i.id === selectedId)
    if (!item) return
    onSelect(item)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>เลือกรูปภาพ</DialogTitle>
        </DialogHeader>

        <div className="min-h-[200px] overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center justify-center py-16 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground text-center px-8">
              ยังไม่มีรูปภาพ กรุณาอัปโหลดที่ Media Library ก่อน
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="grid grid-cols-3 gap-3 p-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    'group relative flex flex-col gap-1.5 rounded-lg border border-border p-1.5 text-left transition-colors',
                    'hover:border-primary/50 hover:bg-muted/50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selectedId === item.id && 'border-primary ring-2 ring-primary ring-offset-1 bg-primary/5'
                  )}
                >
                  <div className="aspect-square w-full overflow-hidden rounded-md bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.public_url}
                      alt={item.alt_text?.th ?? item.alt_text?.en ?? item.filename}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="truncate text-xs text-muted-foreground px-0.5">
                    {item.filename}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={handleSelect} disabled={!selectedId}>
            เลือกรูปนี้
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
