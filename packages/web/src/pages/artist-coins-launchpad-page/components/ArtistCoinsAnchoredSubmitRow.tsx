import { useState } from 'react'

import {
  Box,
  Button,
  Flex,
  IconArrowLeft,
  IconError,
  Text,
  useTheme
} from '@audius/harmony'

const defaultMessages = {
  continue: 'Continue',
  cancel: 'Cancel',
  fixErrors: 'Please complete all required fields to continue.'
}

type ArtistCoinsAnchoredSubmitRowProps = {
  onContinue: () => void
  onBack: () => void
  isValid?: boolean
  isLoading?: boolean
  continueText?: string
  cancelText?: string
  backIcon?: boolean
}

export const ArtistCoinsAnchoredSubmitRow = ({
  onContinue,
  onBack,
  isValid = true,
  isLoading = false,
  continueText = defaultMessages.continue,
  cancelText = defaultMessages.cancel,
  backIcon = false
}: ArtistCoinsAnchoredSubmitRowProps) => {
  const { color, spacing } = useTheme()
  const [showError, setShowError] = useState(false)

  const handleCreate = () => {
    if (!isValid) {
      setShowError(true)
      return
    }
    setShowError(false)
    onContinue()
  }

  const handleBack = () => {
    setShowError(false)
    onBack()
  }

  return (
    <>
      <Flex
        css={{
          position: 'fixed',
          bottom: 'var(--play-bar-height)',
          left: 'var(--nav-width)',
          width: 'calc(100% - var(--nav-width))',
          padding: spacing.unit3,
          background: color.background.surface1,
          borderTop: `1px solid ${color.border.strong}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
        gap='m'
      >
        <Flex gap='s' alignItems='center'>
          <Button
            variant='secondary'
            size='default'
            onClick={handleBack}
            disabled={isLoading}
            iconLeft={backIcon ? IconArrowLeft : undefined}
          >
            {cancelText}
          </Button>
          <Button
            variant='primary'
            size='default'
            onClick={handleCreate}
            disabled={isLoading}
          >
            {continueText}
          </Button>
        </Flex>
        {showError && !isValid ? (
          <Flex alignItems='center' gap='xs'>
            <IconError color='danger' size='s' />
            <Text color='danger' size='s' variant='body'>
              {defaultMessages.fixErrors}
            </Text>
          </Flex>
        ) : null}
      </Flex>
      <Box
        css={{
          height: 'var(--play-bar-height)'
        }}
      />
    </>
  )
}
