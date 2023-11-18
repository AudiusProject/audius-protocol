import { Suspense, useState } from 'react'

import { createPortal } from 'react-dom'

import { MetaMaskOption } from 'pages/sign-on/components/desktop/MetaMaskOption'
import lazyWithPreload from 'utils/lazyWithPreload'

const ConnectedMetaMaskModal = lazyWithPreload(
  () => import('pages/sign-up-page/components/ConnectedMetaMaskModal'),
  0
)

type SignUpWithMetaMaskButtonProps = {
  onClick: () => Promise<boolean>
  onSuccess: () => void
}

export const SignUpWithMetaMaskButton = ({
  onClick,
  onSuccess
}: SignUpWithMetaMaskButtonProps) => {
  const [isMetaMaskModalOpen, setIsMetaMaskModalOpen] = useState(false)

  return (
    <>
      <MetaMaskOption
        fullWidth
        onClick={async () => {
          const canProceed = await onClick()
          if (canProceed) {
            setIsMetaMaskModalOpen(true)
          }
        }}
      />
      <Suspense fallback={null}>
        {createPortal(
          <ConnectedMetaMaskModal
            open={isMetaMaskModalOpen}
            onBack={() => setIsMetaMaskModalOpen(false)}
            onSuccess={onSuccess}
          />,
          document.body
        )}
      </Suspense>
    </>
  )
}
