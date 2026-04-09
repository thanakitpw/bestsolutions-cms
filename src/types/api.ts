export type ApiError = {
  error: string
  code: string
  status: number
}

export type ActionResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: string }

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  limit: number
}
