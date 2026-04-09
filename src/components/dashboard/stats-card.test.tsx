import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatsCard } from './stats-card'
import { LayoutGrid } from 'lucide-react'

describe('StatsCard', () => {
  it('แสดงค่า number เมื่อ value ไม่ใช่ null', () => {
    render(
      <StatsCard label="Projects" value={42} icon={LayoutGrid} href="/projects" />
    )
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
  })

  it('แสดง "—" เมื่อ value เป็น null', () => {
    render(
      <StatsCard label="Projects" value={null} icon={LayoutGrid} href="/projects" />
    )
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('render เป็น link ที่ชี้ไปยัง href', () => {
    render(
      <StatsCard label="Projects" value={0} icon={LayoutGrid} href="/projects" />
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/projects')
  })

  it('แสดงค่า 0 เป็นตัวเลข ไม่ใช่ "—"', () => {
    render(
      <StatsCard label="Media" value={0} icon={LayoutGrid} href="/media" />
    )
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
