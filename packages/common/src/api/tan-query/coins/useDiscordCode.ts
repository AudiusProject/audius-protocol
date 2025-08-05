import { useMutation } from '@tanstack/react-query'

import { useQueryContext } from '../utils'

const getSignableData = () => {
  const vals = 'abcdefghijklmnopqrstuvwxyz123456789'
  return vals.charAt(Math.floor(Math.random() * vals.length))
}

export type DiscordCodeParams = {
  assetType?: 'AUDIO' | string
  mint?: string
}

export const useDiscordCode = () => {
  const { audiusBackend, audiusSdk } = useQueryContext()

  return useMutation({
    mutationFn: async (params: DiscordCodeParams = {}) => {
      const sdk = await audiusSdk()
      const data = getSignableData()
      const { signature } = await audiusBackend.getSignature({
        data,
        sdk
      })

      // Format: signature:data:assetType:mint (for compatibility with Discord bot)
      let code = `${signature}:${data}`

      if (params.assetType) {
        code += `:${params.assetType}`
      }

      if (params.mint) {
        code += `:${params.mint}`
      }

      return code
    }
  })
}
