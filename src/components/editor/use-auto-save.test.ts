import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoSave } from './use-auto-save'

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('initial status is idle', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutoSave({ onSave }))
    expect(result.current.saveStatus).toBe('idle')
  })

  it('triggerSave is a function', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutoSave({ onSave }))
    expect(typeof result.current.triggerSave).toBe('function')
  })

  it('saveNow is a function', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutoSave({ onSave }))
    expect(typeof result.current.saveNow).toBe('function')
  })

  it('does not call onSave immediately after triggerSave', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutoSave({ onSave, delay: 2000 }))

    act(() => { result.current.triggerSave() })
    expect(onSave).not.toHaveBeenCalled()
  })

  it('calls onSave after delay', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutoSave({ onSave, delay: 2000 }))

    act(() => { result.current.triggerSave() })
    await act(async () => { vi.advanceTimersByTime(2000) })
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('debounces — multiple triggerSave calls result in one onSave call', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutoSave({ onSave, delay: 2000 }))

    act(() => { result.current.triggerSave() })
    act(() => { vi.advanceTimersByTime(500) })
    act(() => { result.current.triggerSave() })
    act(() => { vi.advanceTimersByTime(500) })
    act(() => { result.current.triggerSave() })
    await act(async () => { vi.advanceTimersByTime(2000) })

    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('transitions: idle → saving → saved after successful save', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutoSave({ onSave, delay: 2000 }))

    act(() => { result.current.triggerSave() })
    expect(result.current.saveStatus).toBe('idle')

    await act(async () => { vi.advanceTimersByTime(2000) })
    expect(result.current.saveStatus).toBe('saved')
  })

  it('resets to idle after saved + 3 seconds', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutoSave({ onSave, delay: 2000 }))

    act(() => { result.current.triggerSave() })
    await act(async () => { vi.advanceTimersByTime(2000) })
    expect(result.current.saveStatus).toBe('saved')

    await act(async () => { vi.advanceTimersByTime(3000) })
    expect(result.current.saveStatus).toBe('idle')
  })

  it('transitions to error when onSave throws', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('network error'))
    const { result } = renderHook(() => useAutoSave({ onSave, delay: 2000 }))

    act(() => { result.current.triggerSave() })
    await act(async () => { vi.advanceTimersByTime(2000) })
    expect(result.current.saveStatus).toBe('error')
  })

  it('error status does not auto-reset', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => useAutoSave({ onSave, delay: 2000 }))

    act(() => { result.current.triggerSave() })
    await act(async () => { vi.advanceTimersByTime(2000) })
    await act(async () => { vi.advanceTimersByTime(10000) })
    expect(result.current.saveStatus).toBe('error')
  })

  it('saveNow saves immediately without waiting for debounce', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutoSave({ onSave, delay: 2000 }))

    act(() => { result.current.triggerSave() }) // schedule debounce
    await act(async () => { await result.current.saveNow() }) // immediate save
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(result.current.saveStatus).toBe('saved')
  })

  it('uses custom delay when provided', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutoSave({ onSave, delay: 500 }))

    act(() => { result.current.triggerSave() })
    act(() => { vi.advanceTimersByTime(499) })
    expect(onSave).not.toHaveBeenCalled()

    await act(async () => { vi.advanceTimersByTime(1) })
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
