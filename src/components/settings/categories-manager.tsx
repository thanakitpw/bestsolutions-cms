'use client'
import { useState, useTransition } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus, ArrowUp, ArrowDown, Pencil, Trash2 } from 'lucide-react'
import { CategoryDialog } from './category-dialog'
import { DeleteCategoryDialog } from './delete-category-dialog'
import { reorderCategoryAction } from '@/app/(admin)/settings/categories/actions'
import { toast } from 'sonner'
import type { CategoryType } from '@/types/tenant'

type Category = {
  id: string
  name: { th?: string; en?: string } | null
  slug: string
  type: CategoryType
  sort_order: number
}

type Props = {
  initialCategories: Category[]
}

export function CategoriesManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories)
  const [dialogState, setDialogState] = useState<
    | { open: false }
    | { open: true; mode: 'create'; type: CategoryType }
    | { open: true; mode: 'edit'; category: Category }
  >({ open: false })
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [isPending, startTransition] = useTransition()

  const projectCats = categories
    .filter((c) => c.type === 'project')
    .sort((a, b) => a.sort_order - b.sort_order)
  const articleCats = categories
    .filter((c) => c.type === 'article')
    .sort((a, b) => a.sort_order - b.sort_order)

  function handleReorder(id: string, direction: 'up' | 'down') {
    startTransition(async () => {
      const result = await reorderCategoryAction(id, direction)
      if (result.error) {
        toast.error(result.error)
      }
      // revalidatePath handles server-side refresh
    })
  }

  function handleDialogClose() {
    setDialogState({ open: false })
  }

  function handleDeleteClose() {
    setDeleteTarget(null)
  }

  return (
    <Tabs defaultValue="project">
      <TabsList>
        <TabsTrigger value="project">Project ({projectCats.length})</TabsTrigger>
        <TabsTrigger value="article">Article ({articleCats.length})</TabsTrigger>
      </TabsList>

      {(['project', 'article'] as CategoryType[]).map((type) => {
        const list = type === 'project' ? projectCats : articleCats
        return (
          <TabsContent key={type} value={type} className="space-y-3 mt-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => setDialogState({ open: true, mode: 'create', type })}
              >
                <Plus className="h-4 w-4 mr-1" />
                เพิ่ม Category
              </Button>
            </div>

            {list.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                ยังไม่มี {type} categories
              </p>
            ) : (
              <div className="rounded-lg border border-border divide-y divide-border">
                {list.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {cat.name?.th || cat.name?.en || '(Untitled)'}
                        {cat.name?.th && cat.name?.en && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            / {cat.name.en}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{cat.slug}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={idx === 0 || isPending}
                        onClick={() => handleReorder(cat.id, 'up')}
                        aria-label="เลื่อนขึ้น"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={idx === list.length - 1 || isPending}
                        onClick={() => handleReorder(cat.id, 'down')}
                        aria-label="เลื่อนลง"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setDialogState({ open: true, mode: 'edit', category: cat })
                        }
                        aria-label="แก้ไข"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(cat)}
                        aria-label="ลบ"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )
      })}

      {/* Create/Edit Dialog */}
      {dialogState.open && (
        <CategoryDialog
          mode={dialogState.mode}
          category={dialogState.mode === 'edit' ? dialogState.category : undefined}
          defaultType={dialogState.mode === 'create' ? dialogState.type : undefined}
          onClose={handleDialogClose}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteCategoryDialog
          category={deleteTarget}
          onClose={handleDeleteClose}
        />
      )}
    </Tabs>
  )
}
