import { describe, it, expect } from 'vitest'
import type { ApiError, ActionResult, PaginatedResponse } from '@/types/api'

describe('api types', () => {
  describe('ApiError', () => {
    it('accepts a valid ApiError object', () => {
      const err: ApiError = { error: 'Not found', code: 'NOT_FOUND', status: 404 }
      expect(err.error).toBe('Not found')
      expect(err.code).toBe('NOT_FOUND')
      expect(err.status).toBe(404)
    })
  })

  describe('ActionResult', () => {
    it('accepts a success result with data', () => {
      const result: ActionResult<string> = { data: 'hello' }
      expect(result.data).toBe('hello')
    })

    it('accepts an error result', () => {
      const result: ActionResult<string> = { error: 'Something went wrong' }
      expect(result.error).toBe('Something went wrong')
    })
  })

  describe('PaginatedResponse', () => {
    it('accepts a valid paginated response', () => {
      const response: PaginatedResponse<string> = {
        data: ['a', 'b'],
        total: 100,
        page: 1,
        limit: 20,
      }
      expect(response.data).toHaveLength(2)
      expect(response.total).toBe(100)
      expect(response.page).toBe(1)
      expect(response.limit).toBe(20)
    })
  })
})
