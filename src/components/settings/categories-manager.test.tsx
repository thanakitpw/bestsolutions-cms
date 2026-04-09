import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── mocks ──────────────────────────────────────────────────────────────────
vi.mock('@/app/(admin)/settings/categories/actions', () => ({
  reorderCategoryAction: vi.fn().mockResolvedValue({ data: undefined }),
  createCategoryAction: vi.fn().mockResolvedValue({ data: { id: 'new-1' } }),
  updateCategoryAction: vi.fn().mockResolvedValue({ data: undefined }),
  deleteCategoryAction: vi.fn().mockResolvedValue({ data: { linkedCount: 0 } }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock CategoryDialog and DeleteCategoryDialog to isolate CategoriesManager tests
vi.mock('./category-dialog', () => ({
  CategoryDialog: ({ onClose, mode }: { onClose: () => void; mode: string }) => (
    <div data-testid="category-dialog" data-mode={mode}>
      <button onClick={onClose}>close-dialog</button>
    </div>
  ),
}))

vi.mock('./delete-category-dialog', () => ({
  DeleteCategoryDialog: ({ onClose, category }: { onClose: () => void; category: { id: string } }) => (
    <div data-testid="delete-dialog" data-category-id={category.id}>
      <button onClick={onClose}>close-delete</button>
    </div>
  ),
}))

// ── imports after mocks ────────────────────────────────────────────────────
import { CategoriesManager } from './categories-manager'

const SAMPLE_CATEGORIES = [
  { id: '1', name: { th: 'เชิงพาณิชย์', en: 'Commercial' }, slug: 'commercial', type: 'project' as const, sort_order: 0 },
  { id: '2', name: { th: 'ที่พักอาศัย' }, slug: 'residential', type: 'project' as const, sort_order: 1 },
  { id: '3', name: { en: 'News' }, slug: 'news', type: 'article' as const, sort_order: 0 },
]

describe('CategoriesManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tab rendering', () => {
    it('renders two tabs: Project and Article', () => {
      render(<CategoriesManager initialCategories={SAMPLE_CATEGORIES} />)
      expect(screen.getByRole('tab', { name: /project/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /article/i })).toBeInTheDocument()
    })

    it('shows project count in Project tab', () => {
      render(<CategoriesManager initialCategories={SAMPLE_CATEGORIES} />)
      expect(screen.getByText(/project \(2\)/i)).toBeInTheDocument()
    })

    it('shows article count in Article tab', () => {
      render(<CategoriesManager initialCategories={SAMPLE_CATEGORIES} />)
      expect(screen.getByText(/article \(1\)/i)).toBeInTheDocument()
    })

    it('displays project categories in Project tab by default', () => {
      render(<CategoriesManager initialCategories={SAMPLE_CATEGORIES} />)
      expect(screen.getByText('เชิงพาณิชย์')).toBeInTheDocument()
      expect(screen.getByText('ที่พักอาศัย')).toBeInTheDocument()
    })

    it('shows empty state when no categories of that type', () => {
      render(<CategoriesManager initialCategories={[]} />)
      expect(screen.getByText(/ยังไม่มี project categories/i)).toBeInTheDocument()
    })
  })

  describe('row data', () => {
    it('displays category name (th)', () => {
      render(<CategoriesManager initialCategories={SAMPLE_CATEGORIES} />)
      expect(screen.getByText('เชิงพาณิชย์')).toBeInTheDocument()
    })

    it('displays secondary locale name when both th and en exist', () => {
      render(<CategoriesManager initialCategories={SAMPLE_CATEGORIES} />)
      expect(screen.getByText('/ Commercial')).toBeInTheDocument()
    })

    it('displays slug', () => {
      render(<CategoriesManager initialCategories={SAMPLE_CATEGORIES} />)
      expect(screen.getByText('commercial')).toBeInTheDocument()
    })

    it('shows up arrow button disabled for first item', () => {
      render(<CategoriesManager initialCategories={SAMPLE_CATEGORIES} />)
      const upButtons = screen.getAllByLabelText('เลื่อนขึ้น')
      expect(upButtons[0]).toBeDisabled()
    })

    it('shows down arrow button disabled for last item', () => {
      render(<CategoriesManager initialCategories={SAMPLE_CATEGORIES} />)
      const downButtons = screen.getAllByLabelText('เลื่อนลง')
      expect(downButtons[downButtons.length - 1]).toBeDisabled()
    })
  })

  describe('dialog interactions', () => {
    it('opens create dialog when "+ เพิ่ม Category" button clicked', async () => {
      const user = userEvent.setup()
      render(<CategoriesManager initialCategories={SAMPLE_CATEGORIES} />)

      await user.click(screen.getByText('เพิ่ม Category'))
      expect(screen.getByTestId('category-dialog')).toBeInTheDocument()
      expect(screen.getByTestId('category-dialog')).toHaveAttribute('data-mode', 'create')
    })

    it('opens edit dialog when Edit button clicked', async () => {
      const user = userEvent.setup()
      render(<CategoriesManager initialCategories={SAMPLE_CATEGORIES} />)

      const editButtons = screen.getAllByLabelText('แก้ไข')
      await user.click(editButtons[0])
      expect(screen.getByTestId('category-dialog')).toBeInTheDocument()
      expect(screen.getByTestId('category-dialog')).toHaveAttribute('data-mode', 'edit')
    })

    it('opens delete dialog when Delete button clicked', async () => {
      const user = userEvent.setup()
      render(<CategoriesManager initialCategories={SAMPLE_CATEGORIES} />)

      const deleteButtons = screen.getAllByLabelText('ลบ')
      await user.click(deleteButtons[0])
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument()
    })

    it('closes create dialog when onClose is called', async () => {
      const user = userEvent.setup()
      render(<CategoriesManager initialCategories={SAMPLE_CATEGORIES} />)

      await user.click(screen.getByText('เพิ่ม Category'))
      expect(screen.getByTestId('category-dialog')).toBeInTheDocument()

      await user.click(screen.getByText('close-dialog'))
      expect(screen.queryByTestId('category-dialog')).not.toBeInTheDocument()
    })

    it('closes delete dialog when onClose is called', async () => {
      const user = userEvent.setup()
      render(<CategoriesManager initialCategories={SAMPLE_CATEGORIES} />)

      const deleteButtons = screen.getAllByLabelText('ลบ')
      await user.click(deleteButtons[0])
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument()

      await user.click(screen.getByText('close-delete'))
      expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument()
    })
  })
})
