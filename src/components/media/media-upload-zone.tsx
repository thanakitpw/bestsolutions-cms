'use client'
import { useRef, useState, useCallback } from 'react'
import { Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/validations/media'
import type { MediaItem } from './media-library'

type UploadItem = {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

type Props = {
  onUploaded: (item: MediaItem) => void
  tenantId: string
}

export function MediaUploadZone({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [queue, setQueue] = useState<UploadItem[]>([])

  function validateFile(file: File): string | null {
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      return `${file.name}: ไม่รองรับไฟล์ประเภทนี้`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: ขนาดไฟล์เกิน 10 MB`
    }
    return null
  }

  async function uploadFile(file: File, index: number) {
    setQueue(q => q.map((item, i) => i === index ? { ...item, status: 'uploading' } : item))

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/media', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) {
        setQueue(q => q.map((item, i) => i === index ? { ...item, status: 'error', error: json.error } : item))
        toast.error(json.error ?? 'Upload ล้มเหลว')
        return
      }

      setQueue(q => q.map((item, i) => i === index ? { ...item, status: 'done' } : item))
      onUploaded(json as MediaItem)
      toast.success(`${file.name} อัปโหลดสำเร็จ`)
    } catch {
      setQueue(q => q.map((item, i) => i === index ? { ...item, status: 'error', error: 'Network error' } : item))
      toast.error('เชื่อมต่อไม่ได้')
    }
  }

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const validFiles: File[] = []

    Array.from(files).forEach(file => {
      const error = validateFile(file)
      if (error) {
        toast.error(error)
      } else {
        validFiles.push(file)
      }
    })

    if (validFiles.length === 0) return

    setQueue(prev => {
      const startIndex = prev.length
      const newItems: UploadItem[] = validFiles.map(f => ({ file: f, status: 'pending' }))
      validFiles.forEach((file, i) => {
        uploadFile(file, startIndex + i)
      })
      return [...prev, ...newItems]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onUploaded])

  const pendingQueue = queue.filter(q => q.status !== 'done')

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        role="button"
        aria-label="อัปโหลดรูปภาพ"
        tabIndex={0}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/40'
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
      >
        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือก</p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, GIF สูงสุด 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Upload Queue */}
      {pendingQueue.length > 0 && (
        <div className="space-y-2">
          {queue.map((item, i) => item.status !== 'done' && (
            <div key={i} className="flex items-center gap-3 rounded-md border border-border p-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.file.name}</p>
                {item.status === 'uploading' && (
                  <div className="mt-1 h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary animate-pulse w-full" />
                  </div>
                )}
                {item.status === 'error' && (
                  <p className="text-xs text-destructive mt-0.5">{item.error}</p>
                )}
              </div>
              {item.status === 'error' && (
                <button
                  onClick={() => setQueue(q => q.filter((_, idx) => idx !== i))}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="ลบออกจากคิว"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
