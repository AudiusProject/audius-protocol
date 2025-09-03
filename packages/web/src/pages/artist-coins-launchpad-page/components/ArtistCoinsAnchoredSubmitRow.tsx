import { useState } from 'react'

import { Box, Button, Flex, IconError, Text, useTheme } from '@audius/harmony'

const messages = {
  continue: 'Continue',
  cancel: 'Cancel',
  fixErrors: 'Please complete all required fields to continue.'
}

type ArtistCoinsAnchoredSubmitRowProps = {
  onCreate: () => void
  onBack: () => void
  isValid?: boolean
  isLoading?: boolean
}

export const ArtistCoinsAnchoredSubmitRow = ({
  onCreate,
  onBack,
  isValid = true,
  isLoading = false
}: ArtistCoinsAnchoredSubmitRowProps) => {
  const { color, spacing } = useTheme()
  const [showError, setShowError] = useState(false)

  const handleCreate = () => {
    if (!isValid) {
      setShowError(true)
      return
    }
    setShowError(false)
    onCreate()
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
          >
            {messages.cancel}
          </Button>
          <Button
            variant='primary'
            size='default'
            onClick={handleCreate}
            disabled={isLoading}
          >
            {messages.continue}
          </Button>
        </Flex>
        {showError && !isValid ? (
          <Flex alignItems='center' gap='xs'>
            <IconError color='danger' size='s' />
            <Text color='danger' size='s' variant='body'>
              {messages.fixErrors}
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
