import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { CreatorNode, Status } from 'types'

export type State = {
  nodes: { [spId: number]: CreatorNode }
  total?: number
  status?: Status
  error?: string
}

export const initialState: State = {
  nodes: {}
}

type SetNodesPayload =
  | {
      status?: Status.Success
      nodes: { [spId: number]: CreatorNode }
    }
  | {
      status: Status.Failure
      error: string
    }

type SetTotalPayload = {
  total: number
}

const slice = createSlice({
  name: 'creatorNode',
  initialState,
  reducers: {
    setLoading: state => {
      state.status = Status.Loading
    },
    setNodes: (state, action: PayloadAction<SetNodesPayload>) => {
      if ('status' in action.payload) state.status = action.payload.status
      if ('nodes' in action.payload) {
        state.nodes = {
          ...state.nodes,
          ...action.payload.nodes
        }
      } else if ('error' in action.payload) {
        state.error = action.payload.error
      }
    },
    setTotal: (state, action: PayloadAction<SetTotalPayload>) => {
      state.total = action.payload.total
    }
  }
})

export const { setLoading, setNodes, setTotal } = slice.actions

export default slice.reducer
