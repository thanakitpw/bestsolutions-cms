import { useRef, useState, useCallback } from 'react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type UseAutoSaveOptions = {
  onSave: () => Promise<void>
  delay?: number  // milliseconds, default 2000
}

type UseAutoSaveReturn = {
  saveStatus: SaveStatus
  triggerSave: () => void
  saveNow: () => Promise<void>  // manual immediate save
}

export function useAutoSave({ onSave, delay = 2000 }: UseAutoSaveOptions): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const executeSave = useCallback(async () => {
    setSaveStatus('saving')
    try {
      await onSave()
      setSaveStatus('saved')
      // Reset to idle หลัง 3 วินาที
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000)
    } catch {
      setSaveStatus('error')
    }
  }, [onSave])

  const triggerSave = useCallback(() => {
    // Cancel pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)

    // Schedule save
    debounceRef.current = setTimeout(executeSave, delay)
  }, [executeSave, delay])

  const saveNow = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    await executeSave()
  }, [executeSave])

  return { saveStatus, triggerSave, saveNow }
}
