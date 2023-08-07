import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000,
    },
  },
})

export async function fetchUrl({ queryKey }: { queryKey: string[] }) {
  const url = queryKey[0]
  const resp = await fetch(url)
  if (resp.status != 200) {
    throw new Error(`${resp.status}: ${url}`)
  }
  const data = await resp.json()
  return data
}

export const fetcher = (url: string) => fetch(url).then((res) => res.json())
