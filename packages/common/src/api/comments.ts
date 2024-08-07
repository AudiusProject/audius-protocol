import { createApi } from '~/audius-query'

const commentsApi = createApi({
  reducerPath: 'comments',
  endpoints: {
    getCommentsByTrackId: () => {},
    getCommentById: () => {}
  }
})

export const { useGetCommentsByTrackId, useGetCommentById } = commentsApi.hooks

export const commentsApiFetch = commentsApi.fetch

export const commentsApiReducer = commentsApi.reducer
