'use client'
import { useState } from 'react'
import { X, Copy, Check, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { MediaItem } from './media-library'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

type Props = {
  item: MediaItem
  onClose: () => void
  onUpdated: (updated: MediaItem) => void
  onDelete: () => void
}

export function MediaDetailPanel({ item, onClose, onUpdated, onDelete }: Props) {
  const [altTh, setAltTh] = useState(item.alt_text?.th ?? '')
  const [altEn, setAltEn] = useState(item.alt_text?.en ?? '')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(item.public_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('คัดลอก URL แล้ว')
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/media/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt_text: { th: altTh, en: altEn } }),
      })
      const json = await res.json()
      if (res.ok) {
        onUpdated(json as MediaItem)
        toast.success('บันทึก alt text แล้ว')
      } else {
        toast.error(json.error ?? 'บันทึกไม่สำเร็จ')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end" onClick={onClose}>
      <div
        className="relative h-full w-full max-w-sm bg-background border-l border-border shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold truncate pr-4">{item.filename}</h2>
          <button
            onClick={onClose}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="ปิด"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-4">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.public_url}
              alt={item.alt_text?.th ?? item.filename}
              className="size-full object-contain"
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="px-4 space-y-1 text-xs text-muted-foreground">
          <p><span className="font-medium text-foreground">ขนาด:</span> {formatFileSize(item.size)}</p>
          {item.width && item.height && (
            <p><span className="font-medium text-foreground">ขนาดรูป:</span> {item.width} × {item.height} px</p>
          )}
          <p><span className="font-medium text-foreground">ประเภท:</span> {item.mime_type}</p>
          <p><span className="font-medium text-foreground">วันที่:</span> {formatDate(item.created_at)}</p>
        </div>

        {/* URL Copy */}
        <div className="px-4 mt-3">
          <Label className="text-xs text-muted-foreground mb-1 block">Public URL</Label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={item.public_url}
              className="text-xs h-8"
            />
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 h-8 px-2"
              onClick={handleCopy}
              aria-label="คัดลอก URL"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Alt Text Edit */}
        <div className="px-4 mt-4 space-y-3">
          <div>
            <Label htmlFor="alt-th" className="text-xs mb-1 block">Alt Text (ไทย)</Label>
            <Input
              id="alt-th"
              value={altTh}
              onChange={(e) => setAltTh(e.target.value)}
              placeholder="คำอธิบายรูป (ภาษาไทย)"
              className="text-sm h-9"
            />
          </div>
          <div>
            <Label htmlFor="alt-en" className="text-xs mb-1 block">Alt Text (English)</Label>
            <Input
              id="alt-en"
              value={altEn}
              onChange={(e) => setAltEn(e.target.value)}
              placeholder="Image description (English)"
              className="text-sm h-9"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-9 text-sm"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก Alt Text'}
          </Button>
        </div>

        {/* Delete */}
        <div className="px-4 mt-4 pb-6">
          <Button
            variant="outline"
            onClick={onDelete}
            className="w-full h-9 text-sm text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            ลบรูปภาพนี้
          </Button>
        </div>
      </div>
    </div>
  )
}
