import { useQuery } from '@tanstack/react-query'

export type XmlFileRow = {
  id: number
  from_zip_file?: string // UUID string
  uploaded_by?: string
  uploaded_at: Date
  xml_contents: string
  status: string
}

type UploadsResponse = {
  uploads: XmlFileRow[]
  hasMoreNext: boolean
  hasMorePrev: boolean
}

const useUploads = (statusFilter = '', nextId?: number, prevId?: number) => {
  return useQuery<UploadsResponse>({
    queryKey: ['uploads', statusFilter, nextId, prevId],
    queryFn: async () => {
      const params = new URLSearchParams({ status: statusFilter })
      if (nextId) {
        params.append('nextId', String(nextId))
      } else if (prevId) {
        params.append('prevId', String(prevId))
      }
      const response = await fetch(`/api/uploads?${params.toString()}`)
      if (!response.ok) {
        throw new Error(
          `Failed fetching uploads: ${response.status} ${response.statusText}`
        )
      }
      const data = (await response.json()) as UploadsResponse

      return {
        ...data,
        uploads: data.uploads.map((upload) => ({
          ...upload,
          uploaded_at: new Date(upload.uploaded_at),
        })),
      }
    },
  })
}

export default useUploads
