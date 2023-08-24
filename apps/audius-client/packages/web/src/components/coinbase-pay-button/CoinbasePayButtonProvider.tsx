import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

import { initOnRamp } from '@coinbase/cbpay-js'

export const allowedCoinbasePayTokens = ['SOL']

type ResetParams = {
  destinationWalletAddress?: string
  presetCryptoAmount?: number
  presetFiatAmount?: number
  onSuccess?: () => void
  onExit?: () => void
}

export const CoinbasePayContext = createContext<{
  isReady: boolean
  isOpen: boolean
  open: () => void
  resetParams: (newProps: ResetParams) => void
}>({
  isReady: false,
  isOpen: false,
  open: () => {},
  resetParams: (_) => {}
})

export const CoinbasePayButtonProvider = ({
  children,
  ...resetProps
}: ResetParams & {
  children: ReactNode
}) => {
  const [isReady, setIsReady] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
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
          onSuccess: () => {
            onSuccess?.()
            setIsOpen(false)
          },
          onExit: () => {
            onExit?.()
            setIsOpen(false)
          },
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
    [cbInstance, setIsOpen]
  )

  const open = useCallback(() => {
    if (cbInstance.current) {
      cbInstance.current.open()
      setIsOpen(true)
    }
  }, [cbInstance, setIsOpen])

  useEffect(() => {
    resetParams(resetProps)
  }, [resetParams, resetProps])

  return (
    <CoinbasePayContext.Provider
      value={{
        isReady,
        isOpen,
        open,
        resetParams
      }}
    >
      {children}
    </CoinbasePayContext.Provider>
  )
}
