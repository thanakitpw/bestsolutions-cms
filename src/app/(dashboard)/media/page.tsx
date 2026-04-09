'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Trash2, Image, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface MediaItem {
  id: string;
  url: string;
  alt_text: string;
  filename: string;
  file_size: number | null;
  mime_type: string;
  created_at: string;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [altInput, setAltInput] = useState('');
  const [uploading, setUploading] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/admin/media?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setMedia(json.media ?? []);
      } else {
        toast.error(json.error ?? 'Failed to load media');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  async function handleUpload() {
    if (!urlInput.trim()) return;
    setUploading(true);
    try {
      const filename = urlInput.trim().split('/').pop() || 'untitled';
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput.trim(),
          alt_text: altInput.trim(),
          filename,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success('Image added successfully');
        setUploadOpen(false);
        setUrlInput('');
        setAltInput('');
        fetchMedia();
      } else {
        toast.error(json.error ?? 'Failed to add image');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/media/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Image deleted');
        setDeleteTarget(null);
        fetchMedia();
      } else {
        const json = await res.json();
        toast.error(json.error ?? 'Failed to delete');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Media Library</h1>
          <p className="text-[13px] text-[#999]">Manage images and files</p>
        </div>
        <Button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 bg-[#1A1A1A] text-white hover:bg-black"
        >
          <Plus className="size-4" />
          Add Image
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#999]" />
        <Input
          placeholder="Search by filename or alt text..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 border-[#E5E4E2] bg-white text-[#1A1A1A] placeholder:text-[#999]"
        />
      </div>

      {/* Grid / Empty / Loading */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-lg bg-[#F0EFED]"
            />
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#E5E4E2] bg-white py-24">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#F0EFED]">
            <Image className="size-6 text-[#999]" />
          </div>
          <p className="text-sm text-[#999]">
            {debouncedSearch ? 'No results found' : 'No images yet'}
          </p>
          {!debouncedSearch && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadOpen(true)}
              className="border-[#E5E4E2] text-[#1A1A1A]"
            >
              Add your first image
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {media.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-lg border border-[#E5E4E2] bg-white"
            >
              {/* Thumbnail */}
              <div className="aspect-square overflow-hidden bg-[#F0EFED]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.alt_text || item.filename}
                  className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Delete button overlay */}
              <button
                onClick={() => setDeleteTarget(item)}
                className="absolute right-2 top-2 flex size-7 cursor-pointer items-center justify-center rounded-md bg-white/90 text-[#999] opacity-0 shadow-sm transition-all duration-150 hover:bg-[#C0392B] hover:text-white group-hover:opacity-100"
                title="Delete"
              >
                <Trash2 className="size-3.5" />
              </button>

              {/* Info */}
              <div className="border-t border-[#E5E4E2] px-2 py-2">
                <p className="truncate text-[11px] font-medium text-[#1A1A1A]">
                  {item.filename}
                </p>
                <p className="text-[10px] text-[#999]">
                  {formatFileSize(item.file_size)} &middot; {formatDate(item.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md border-[#E5E4E2] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">Add Image</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="media-url" className="text-[13px] text-[#1A1A1A]">
                Image URL <span className="text-[#C0392B]">*</span>
              </Label>
              <Input
                id="media-url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="border-[#E5E4E2] text-[#1A1A1A] placeholder:text-[#999]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="media-alt" className="text-[13px] text-[#1A1A1A]">
                Alt Text
              </Label>
              <Input
                id="media-alt"
                placeholder="Describe the image..."
                value={altInput}
                onChange={(e) => setAltInput(e.target.value)}
                className="border-[#E5E4E2] text-[#1A1A1A] placeholder:text-[#999]"
              />
            </div>
            {/* Preview */}
            {urlInput.trim() && (
              <div className="overflow-hidden rounded-lg border border-[#E5E4E2] bg-[#F0EFED]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={urlInput.trim()}
                  alt="preview"
                  className="max-h-40 w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setUploadOpen(false)}
              className="border-[#E5E4E2] text-[#1A1A1A]"
            >
              <X className="size-4" />
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!urlInput.trim() || uploading}
              className="bg-[#1A1A1A] text-white hover:bg-black"
            >
              <Check className="size-4" />
              {uploading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="border-[#E5E4E2] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1A1A1A]">Delete Image</AlertDialogTitle>
            <AlertDialogDescription className="text-[#6B6B6B]">
              Are you sure you want to delete{' '}
              <span className="font-medium text-[#1A1A1A]">
                {deleteTarget?.filename}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#E5E4E2] text-[#1A1A1A]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-[#C0392B] text-white hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
