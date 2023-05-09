import { createApi } from './createApi'

const trackApi = createApi({
  reducerPath: 'trackApi',
  endpoints: {
    getTrackById: {
      fetch: async ({ id }, { apiClient }) => {
        return {
          track: await apiClient.getTrack({ id })
        }
      }
    }
  }
})

export const { useGetTrackById } = trackApi.hooks
export default trackApi.reducer
