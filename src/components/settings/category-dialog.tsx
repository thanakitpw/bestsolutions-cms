'use client'
import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { CategorySchema, type CategoryInput } from '@/lib/validations/category'
import { generateSlug } from '@/lib/slugify'
import {
  createCategoryAction,
  updateCategoryAction,
} from '@/app/(admin)/settings/categories/actions'
import type { CategoryType } from '@/types/tenant'

type Category = {
  id: string
  name: { th?: string; en?: string } | null
  slug: string
  type: CategoryType
  sort_order: number
}

type Props = {
  mode: 'create' | 'edit'
  category?: Category
  defaultType?: CategoryType
  onClose: () => void
}

export function CategoryDialog({ mode, category, defaultType, onClose }: Props) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<CategoryInput>({
    resolver: zodResolver(CategorySchema),
    defaultValues:
      mode === 'edit' && category
        ? {
            name: { th: category.name?.th ?? '', en: category.name?.en ?? '' },
            slug: category.slug,
            type: category.type,
            sort_order: category.sort_order,
          }
        : {
            name: { th: '', en: '' },
            slug: '',
            type: defaultType ?? 'project',
            sort_order: 0,
          },
  })

  // Auto-generate slug from name.th in create mode
  const nameTh = form.watch('name.th')
  useEffect(() => {
    if (mode === 'create' && nameTh) {
      form.setValue('slug', generateSlug(nameTh), { shouldValidate: false })
    }
  }, [nameTh, mode, form])

  function onSubmit(data: CategoryInput) {
    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createCategoryAction(data)
          : await updateCategoryAction(category!.id, data)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(mode === 'create' ? 'สร้าง category แล้ว' : 'แก้ไข category แล้ว')
        onClose()
      }
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'เพิ่ม Category ใหม่' : 'แก้ไข Category'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name-th">ชื่อ (ไทย)</Label>
              <Input
                id="name-th"
                {...form.register('name.th')}
                placeholder="เชิงพาณิชย์"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name-en">ชื่อ (English)</Label>
              <Input
                id="name-en"
                {...form.register('name.en')}
                placeholder="Commercial"
              />
            </div>
          </div>
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">
              {(form.formState.errors.name as any)?.message}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              {...form.register('slug')}
              placeholder="commercial"
            />
            {form.formState.errors.slug && (
              <p className="text-xs text-destructive">
                {form.formState.errors.slug.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>ประเภท</Label>
            <Select
              value={form.watch('type')}
              onValueChange={(v) => form.setValue('type', v as CategoryType)}
              disabled={mode === 'edit'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="article">Article</SelectItem>
              </SelectContent>
            </Select>
            {mode === 'edit' && (
              <p className="text-xs text-muted-foreground">
                ไม่สามารถเปลี่ยนประเภทได้หลังสร้างแล้ว
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
