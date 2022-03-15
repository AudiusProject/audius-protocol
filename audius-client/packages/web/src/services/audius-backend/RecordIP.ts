import AudiusBackend, {
  AuthHeaders,
  IDENTITY_SERVICE
} from 'services/AudiusBackend'
import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'

// @ts-ignore
const libs = () => window.audiusLibs

export const recordIP = async (): Promise<
  { userIP: string } | { error: boolean }
> => {
  await waitForLibsInit()
  const account = libs().Account.getCurrentUser()
  if (!account) return { error: true }

  try {
    const { data, signature } = await AudiusBackend.signData()
    const response = await fetch(`${IDENTITY_SERVICE}/record_ip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AuthHeaders.Message]: data,
        [AuthHeaders.Signature]: signature
      }
    })

    if (response.status >= 400 && response.status < 600) {
      throw new Error(
        `Request to record user IP failed: ${response.statusText}`
      )
    }
    return response.json()
  } catch (err) {
    console.error((err as any).message)
    return { error: true }
  }
}
