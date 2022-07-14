import { ID } from '@audius/common'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { StemUploadWithFile } from 'common/models/Stems'

const initialState = {
  uploadsInProgress: {} as {
    [parentID: number]: {
      [batchUploadID: string]: StemUploadWithFile[]
    }
  }
}

type StartUploadsPayload = {
  parentId: ID
  uploads: StemUploadWithFile[]
  batchUID: string
}

// Keeps track of uploading stems from the
// edit track modal. Not currently used for
// the upload track flow.
const slice = createSlice({
  name: 'application/ui/stemsUpload',
  initialState,
  reducers: {
    startStemUploads: (state, action: PayloadAction<StartUploadsPayload>) => {
      const { parentId, uploads, batchUID } = action.payload
      if (!state.uploadsInProgress[parentId]) {
        state.uploadsInProgress[parentId] = {}
      }
      state.uploadsInProgress[parentId][batchUID] = uploads
    },
    stemUploadsSucceeded: (
      state,
      action: PayloadAction<{ parentId: ID; batchUID: string }>
    ) => {
      const { batchUID, parentId } = action.payload
      delete state.uploadsInProgress[parentId][batchUID]
    },
    stemUploadsFailed: (
      state,
      action: PayloadAction<{ parentId: ID; batchUID: string }>
    ) => {
      const { batchUID, parentId } = action.payload
      delete state.uploadsInProgress[parentId][batchUID]
    }
  }
})

export const { startStemUploads, stemUploadsSucceeded, stemUploadsFailed } =
  slice.actions

export default slice.reducer
