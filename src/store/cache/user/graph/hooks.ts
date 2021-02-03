import { useQuery } from '@apollo/client'
import { useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'
import { Status, User, Operator } from 'types'
import Audius from 'services/Audius'
import { AppState } from 'store/types'
import { setLoading, setUsers } from '../slice'
import { useEffect, useState } from 'react'
import { FullUser, UsersData, UsersVars, UserData, UserVars } from './types'
import { formatUser } from './formatter'
import { GET_USERS, GET_USER } from './queries'

// Async function to get
function populateUsers(
  users: FullUser[],
  setStatus?: (status: Status) => void
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    try {
      if (setStatus) setStatus(Status.Loading)
      else dispatch(setLoading())
      const formattedUsers = await Promise.all(
        users.map(user => formatUser(aud, user))
      )
      dispatch(
        setUsers({
          users: formattedUsers.reduce(
            (users: { [id: string]: User | Operator }, user) => {
              users[user.wallet] = user
              return users
            },
            {}
          ),
          ...(setStatus ? {} : { status: Status.Success })
        })
      )
      if (setStatus) setStatus(Status.Success)
    } catch (err) {
      console.log({ err })
    }
  }
}

// -------------------------------- Hooks  --------------------------------
export const useUsers = (status: Status | undefined) => {
  const { error: gqlError, data: gqlData } = useQuery<UsersData, UsersVars>(
    GET_USERS,
    {
      variables: {
        orderBy: 'totalClaimableAmount',
        where: { hasStakeOrDelegation: true }
      }
    }
  )
  const dispatch = useDispatch()
  useEffect(() => {
    if (status !== Status.Loading && status !== Status.Success && gqlData) {
      dispatch(populateUsers(gqlData.users))
    }
  }, [gqlData, dispatch, status])

  return {
    error: gqlError
  }
}

export const useUser = (
  wallet: string,
  setStatus: (status: Status) => void
) => {
  const [didFetch, setDidFetch] = useState(false)
  const { error: gqlError, data: gqlData } = useQuery<UserData, UserVars>(
    GET_USER,
    {
      variables: { id: wallet.toLowerCase() }
    }
  )

  useEffect(() => {
    setDidFetch(false)
  }, [wallet, setDidFetch])

  const dispatch = useDispatch()
  useEffect(() => {
    if (!didFetch && gqlData) {
      setDidFetch(true)
      dispatch(populateUsers([gqlData.user], setStatus))
    }
  }, [gqlData, dispatch, setStatus, didFetch, setDidFetch])

  return {
    error: gqlError
  }
}
