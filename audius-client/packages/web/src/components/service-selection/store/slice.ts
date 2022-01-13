import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import Status from 'common/models/Status'

export type Service = {
  data: {
    version: string
    service: string
    country: string
    latitude: string
    longitude: string
  }
  version: string
  service: string
  country: string
  latitude: string
  longitude: string
  signer: string
  timestamp: string
  signature: string
  isSyncing?: boolean
}

type State = {
  services: {
    [name: string]: Service
  }
  primary: string | null
  secondaries: (string | null)[]
  status: Status | null
  showModal: boolean
}

const initialState: State = {
  // Service name => {country, latitude, longitude, ping, isSyncing}
  services: {},
  primary: null,
  secondaries: [null, null],
  status: null,
  showModal: false
}

type ServicesSucceededPayload = {
  services: {
    [name: string]: Service
  }
  primary: string
  secondaries: string[]
}

type SetSelectedSucceededPayload = {
  primary: string
  secondaries: string[]
}

type SetSelectedPayload = {
  primary: string
  secondaries: string[]
}

type SetSelectedFailedPayload = {
  primary: string
  secondaries: string[]
}

type SetSyncingPayload = {
  service: string
  isSyncing: boolean
}

const slice = createSlice({
  name: 'service-selection',
  initialState,
  reducers: {
    fetchServices: state => {
      state.services = {}
      state.status = Status.LOADING
    },
    fetchServicesSucceeded: (
      state,
      action: PayloadAction<ServicesSucceededPayload>
    ) => {
      const { services, primary, secondaries } = action.payload
      state.services = services
      state.primary = primary
      state.secondaries = secondaries
      state.status = Status.SUCCESS
    },
    fetchServicesFailed: state => {
      state.status = Status.ERROR
    },
    setSelected: (state, action: PayloadAction<SetSelectedPayload>) => {},
    setSelectedSucceeded: (
      state,
      action: PayloadAction<SetSelectedSucceededPayload>
    ) => {
      const { primary, secondaries } = action.payload
      state.primary = primary
      state.secondaries = secondaries
    },
    setSelectedFailed: (
      state,
      action: PayloadAction<SetSelectedFailedPayload>
    ) => {
      const { primary, secondaries } = action.payload
      state.primary = primary
      state.secondaries = secondaries
    },
    setSyncing: (state, action: PayloadAction<SetSyncingPayload>) => {
      const { service, isSyncing } = action.payload
      state.services[service].isSyncing = isSyncing
    },
    openModal: state => {
      state.showModal = true
    },
    closeModal: state => {
      state.showModal = false
    }
  }
})

export const {
  fetchServices,
  fetchServicesFailed,
  fetchServicesSucceeded,
  setSelected,
  setSelectedSucceeded,
  setSelectedFailed,
  setSyncing,
  openModal,
  closeModal
} = slice.actions

export default slice.reducer
