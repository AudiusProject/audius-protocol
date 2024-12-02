import { AudiusSdk } from '@audius/sdk'

import { getErrorMessage } from '~/utils'

import { AudiusBackend } from './AudiusBackend'

const AuthHeaders: { [key: string]: string } = Object.freeze({
  Message: 'Encoded-Data-Message',
  Signature: 'Encoded-Data-Signature'
})

export const recordIP = async ({
  audiusBackendInstance,
  sdk
}: {
  audiusBackendInstance: AudiusBackend
  sdk: AudiusSdk
}): Promise<{ userIP: string } | { error: boolean }> => {
  await audiusBackendInstance.getAudiusLibs()
  try {
    const { data, signature } =
      await audiusBackendInstance.signIdentityServiceRequest({
        sdk
      })
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

    if (response.status >= 400 && response.status < 600) {
      throw new Error(
        `Request to record user IP failed: ${response.statusText}`
      )
    }
    return response.json()
  } catch (err) {
    console.error(getErrorMessage(err))
    return { error: true }
  }
}
