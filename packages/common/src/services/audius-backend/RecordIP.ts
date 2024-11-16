import { getErrorMessage } from '~/utils'

import { AudiusBackend, AuthHeaders } from './AudiusBackend'

export const recordIP = async (
  audiusBackendInstance: AudiusBackend
): Promise<{ userIP: string } | { error: boolean }> => {
  await audiusBackendInstance.getAudiusLibs()
  try {
    const { data, signature } = await audiusBackendInstance.signData()
    const response = await fetch(
      `${audiusBackendInstance.identityServiceUrl}/record_ip`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AuthHeaders.Message]: data,
          [AuthHeaders.Signature]: signature
        }
      }
    )

    // if (response.status >= 400 && response.status < 600) {
    //   throw new Error(
    //     `Request to record user IP failed: ${response.statusText}`
    //   )
    // }
    // return response.json()
  } catch (err) {
    console.error(getErrorMessage(err))
    return { error: true }
  }
}
