import { AppState } from 'store/types'

export const getServices = (state: AppState) => state.serviceSelection.services
export const getPrimary = (state: AppState) => state.serviceSelection.primary
export const getSecondaries = (state: AppState) =>
  state.serviceSelection.secondaries
export const getStatus = (state: AppState) => state.serviceSelection.status

export const getSelectedServices = (state: AppState) => {
  const { services, primary, secondaries } = state.serviceSelection
  const selected = []
  if (primary && services[primary]) {
    selected.push(primary)
  }
  if (secondaries[0] && services[secondaries[0]]) {
    selected.push(secondaries[0])
  }
  if (secondaries[1] && services[secondaries[1]]) {
    selected.push(secondaries[1])
  }
  return selected
}

export const getShowModal = (state: AppState) =>
  state.serviceSelection.showModal
