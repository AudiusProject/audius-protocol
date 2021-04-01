import { track, make } from '../../utils/analytics'
import { EventNames } from '../../types/analytics'

const IDENTITY_SERVICE_ENDPOINT = 'https://identityservice.audius.co'

export const logListen = async (
  trackId: number,
  userId: number,
  onFailure: () => void
) => {
  const url = `${IDENTITY_SERVICE_ENDPOINT}/tracks/${trackId}/listen`
  const method = 'POST'
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
  const body = JSON.stringify({
    userId
  })

  fetch(url, { method, headers, body })
    .then(resp => {
      console.info(
        `Logged a listen for ${trackId} for user ${userId}: ${resp.status}`
      )
      track(make({ eventName: EventNames.LISTEN, trackId: `${trackId}` }))
    })
    .catch(e => {
      console.error(e)
      onFailure()
    })
}
