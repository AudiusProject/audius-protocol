import { all, fork, call, put, select, takeEvery } from 'typed-redux-saga/macro'

import Kind from 'common/models/Kind'
import { getAccountUser } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import AudiusBackend from 'services/AudiusBackend'
import { waitForBackendSetup } from 'store/backend/sagas'
import { waitForValue } from 'utils/sagaHelpers'

import { watchServiceSelectionErrors } from './errorSagas'
import { getSecondaries, getSelectedServices } from './selectors'
import {
  fetchServices,
  fetchServicesSucceeded,
  fetchServicesFailed,
  setSelected,
  setSelectedSucceeded,
  setSelectedFailed,
  setSyncing as setSyncingAction,
  Service
} from './slice'

export function* watchFetchServices() {
  yield* takeEvery(fetchServices.type, function* () {
    yield* call(waitForBackendSetup)
    const currentUser = yield* call(waitForValue, getAccountUser)

    try {
      let primary: string,
        secondaries: string[],
        services: { [name: string]: Service }

      if (currentUser.creator_node_endpoint) {
        services = yield* call(AudiusBackend.getSelectableCreatorNodes)
        const userEndpoints = currentUser.creator_node_endpoint.split(',')
        primary = userEndpoints[0]
        secondaries = userEndpoints.slice(1)
        // Filter out a secondary that is unhealthy.
        secondaries = secondaries.filter(Boolean).filter((s) => services[s])
      } else {
        const autoselect = yield* call(AudiusBackend.autoSelectCreatorNodes)
        primary = autoselect.primary
        secondaries = autoselect.secondaries
        services = autoselect.services

        yield* call(
          AudiusBackend.creatorNodeSelectionCallback,
          primary,
          secondaries,
          'autoselect'
        )
      }

      if (!primary || !secondaries || secondaries.length < 1) {
        throw new Error(
          `Too few services found. Primary: ${primary}, Secondaries: ${secondaries}`
        )
      }

      yield* put(fetchServicesSucceeded({ services, primary, secondaries }))
      // Check if secondaries are syncing
      yield* all(
        secondaries.map((s) => {
          return fork(updateSyncing, s)
        })
      )
    } catch (e) {
      console.error(e)
      yield* put(fetchServicesFailed())
    }
  })
}

const checkIsSyncing = async (service: string) => {
  return new Promise<void>((resolve) => {
    const interval = setInterval(async () => {
      const isSyncing = await AudiusBackend.isCreatorNodeSyncing(service)
      if (!isSyncing) {
        clearInterval(interval)
        resolve()
      }
    }, 1000)
  })
}

function* updateSyncing(service: string) {
  yield* put(setSyncingAction({ service, isSyncing: true }))
  yield* call(checkIsSyncing, service)
  yield* put(setSyncingAction({ service, isSyncing: false }))
}

function* setSyncing(service: string) {
  yield* put(setSyncingAction({ service, isSyncing: true }))
}

function* watchSetSelected() {
  yield* takeEvery(
    setSelected.type,
    function* (action: ReturnType<typeof setSelected>) {
      const user = yield* call(waitForValue, getAccountUser)

      const currentSecondaries = yield* select(getSecondaries)
      const { primary, secondaries } = action.payload
      yield* call(
        AudiusBackend.creatorNodeSelectionCallback,
        primary,
        secondaries,
        'manual'
      )
      const newEndpoint = `${primary},${secondaries.join(',')}`

      const [oldPrimary, ...oldSecondaries] = yield* select(getSelectedServices)

      // Update the endpoint for the user
      yield* put(
        setSelectedSucceeded({
          primary,
          secondaries
        })
      )
      yield* put(
        cacheActions.update(Kind.USERS, [
          { id: user.user_id, metadata: { creator_node_endpoint: newEndpoint } }
        ])
      )
      yield* all(
        secondaries.map((s) => {
          if (currentSecondaries.includes(s)) return null
          return fork(setSyncing, s)
        })
      )

      yield* call(AudiusBackend.setCreatorNodeEndpoint, primary)
      user.creator_node_endpoint = newEndpoint
      const success = yield* call(
        AudiusBackend.updateCreator,
        user,
        user.user_id
      )
      if (!success) {
        yield* put(
          setSelectedFailed({
            primary: oldPrimary,
            secondaries: oldSecondaries
          })
        )
      }

      // Any new secondaries need to check if they are syncing
      yield* all(
        secondaries.map((s) => {
          if (currentSecondaries.includes(s)) return null
          return fork(updateSyncing, s)
        })
      )
    }
  )
}

const sagas = () => {
  return [watchFetchServices, watchSetSelected, watchServiceSelectionErrors]
}

export default sagas
