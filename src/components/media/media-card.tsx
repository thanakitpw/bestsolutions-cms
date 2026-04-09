'use client'
import { Trash2 } from 'lucide-react'
import type { MediaItem } from './media-library'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

type Props = {
  item: MediaItem
  onClick: () => void
  onDelete: () => void
}

export function MediaCard({ item, onClick, onDelete }: Props) {
  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-border bg-card cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-square overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.public_url}
          alt={item.alt_text?.th ?? item.alt_text?.en ?? item.filename}
          className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Delete button overlay */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="absolute right-2 top-2 flex size-7 cursor-pointer items-center justify-center rounded-md bg-background/90 text-muted-foreground opacity-0 shadow-sm transition-all duration-150 hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
        title="ลบ"
        aria-label={`ลบ ${item.filename}`}
      >
        <Trash2 className="size-3.5" />
      </button>

      {/* Info */}
      <div className="border-t border-border px-2 py-2">
        <p className="truncate text-[11px] font-medium">{item.filename}</p>
        <p className="text-[10px] text-muted-foreground">
          {formatFileSize(item.size)} · {formatDate(item.created_at)}
        </p>
      </div>
    </div>
  )
}
