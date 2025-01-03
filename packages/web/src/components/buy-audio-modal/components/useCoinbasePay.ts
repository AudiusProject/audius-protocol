import { useCallback, useEffect, useRef, useState } from 'react'

import { initOnRamp } from '@coinbase/cbpay-js'

type ResetParams = {
  destinationWalletAddress?: string
  presetCryptoAmount?: number
  presetFiatAmount?: number
  onSuccess?: () => void
  onExit?: () => void
}

export const useCoinbasePay = () => {
  const [isReady, setIsReady] = useState(false)
  const cbInstance = useRef<ReturnType<typeof initOnRamp>>()

  const resetParams = useCallback(
    ({
      destinationWalletAddress,
      presetCryptoAmount,
      presetFiatAmount,
      onSuccess,
      onExit
    }: ResetParams) => {
      if (destinationWalletAddress) {
        setIsReady(false)
        cbInstance.current?.destroy()
        cbInstance.current = initOnRamp({
          appId: '2cbd65dc-1710-4ae3-ab28-8947b08c22fb',
          widgetParameters: {
            destinationWallets: [
              {
                address: destinationWalletAddress,
                assets: ['SOL']
              }
            ],
            presetCryptoAmount,
            presetFiatAmount
          },
          onReady: () => {
            // Update loading/ready states.
            setIsReady(true)
          },
          onSuccess,
          onExit,
          onEvent: (event: any) => {
            // event stream
            console.info(event)
          },
          experienceLoggedIn: 'embedded',
          experienceLoggedOut: 'popup',
          closeOnExit: true,
          closeOnSuccess: true
        })
      }
      return () => cbInstance.current?.destroy()
    },
    [cbInstance]
  )

  const open = useCallback(() => {
    if (cbInstance.current) {
      cbInstance.current.open()
    }
  }, [cbInstance])

  useEffect(() => {
    return () => {
      cbInstance.current?.destroy()
    }
  }, [cbInstance])

  return { isReady, open, resetParams }
}
