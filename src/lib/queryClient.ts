import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Components sharing a query key reuse one request and keep briefly fresh
      // while users move between admin pages.
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status
        if (status !== undefined && status < 500) return false
        return failureCount < 2
      },
    },
  },
})
