import { useDispatch, useSelector } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'
import { Status, User, Operator } from 'types'
import Audius from 'services/Audius'
import { AppState } from 'store/types'
import { setLoading, setUsers } from '../slice'
import { useEffect, useState } from 'react'
import { FullUser, UsersData, UsersVars, UserData, UserVars } from './types'
import { getGraphAPI, useGraphQuery as useQuery } from 'store/api/hooks'
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
  const { hasBackupClient, didError } = useSelector(getGraphAPI)

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

  // If there is a fallback, do not return error until the fallback also errors
  if (hasBackupClient && gqlError && !didError) {
    return { error: null }
  }

  return {
    error: gqlError
  }
}

export const useUser = (
  wallet: string,
  setStatus: (status: Status) => void,
  hasUser: boolean
) => {
  const [didFetch, setDidFetch] = useState(false)
  const { hasBackupClient, didError } = useSelector(getGraphAPI)

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
    if (!didFetch && !hasUser && gqlData) {
      setDidFetch(true)
      dispatch(populateUsers([gqlData.user], setStatus))
    }
  }, [hasUser, gqlData, dispatch, setStatus, didFetch, setDidFetch])

  // If there is a fallback, do not return error until the fallback also errors
  if (hasBackupClient && gqlError && !didError) {
    return { error: null }
  }

  return {
    error: gqlError
  }
}
