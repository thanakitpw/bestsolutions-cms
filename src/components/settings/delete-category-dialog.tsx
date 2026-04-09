'use client'
import { useTransition } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { deleteCategoryAction } from '@/app/(admin)/settings/categories/actions'
import type { CategoryType } from '@/types/tenant'

type Category = { id: string; name: { th?: string; en?: string } | null; type: CategoryType }

type Props = { category: Category; onClose: () => void }

export function DeleteCategoryDialog({ category, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const catName = category.name?.th || category.name?.en || 'category นี้'

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        const linked = result.data?.linkedCount ?? 0
        toast.success('ลบ category แล้ว', {
          description: linked > 0
            ? `${linked} รายการถูก unlink (category_id → null) อัตโนมัติ`
            : undefined,
        })
        onClose()
      }
    })
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบ &quot;{catName}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            การลบ category จะ unlink เนื้อหาทั้งหมดที่ใช้ category นี้ออกโดยอัตโนมัติ
            (category_id จะเป็น null) ไม่สามารถย้อนกลับได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'กำลังลบ...' : 'ลบ'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
