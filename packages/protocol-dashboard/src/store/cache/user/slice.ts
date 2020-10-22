import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Status, User, Operator } from 'types'

export type State = {
  accounts: { [wallet: string]: User | Operator }
  status?: Status
  error?: string
}

export const initialState: State = {
  accounts: {}
}

type SetUsers =
  | {
      status?: Status.Success
      users: { [wallet: string]: User | Operator }
    }
  | {
      status: Status.Failure
      error: string
    }

const slice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLoading: state => {
      state.status = Status.Loading
    },
    setUsers: (state, action: PayloadAction<SetUsers>) => {
      if ('status' in action.payload) state.status = action.payload.status
      if ('users' in action.payload) {
        state.accounts = {
          ...state.accounts,
          ...action.payload.users
        }
      } else if ('error' in action.payload) {
        state.error = action.payload.error
      }
    }
  }
})

export const { setLoading, setUsers } = slice.actions

export default slice.reducer
