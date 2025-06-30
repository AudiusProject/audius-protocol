import { useState, useEffect } from 'react'

import {
  Box,
  Button,
  Flex,
  Paper,
  Text,
  TextInput,
  makeResponsiveStyles
} from '@audius/harmony'
import { HashId } from '@audius/sdk'

export const useUserIdParserStyles = makeResponsiveStyles(({ theme }) => ({
  root: {
    mobile: {
      width: '100%',
      minWidth: '300px'
    },
    base: {
      width: `calc(50% - ${theme.spacing.xl / 2}px)`
    }
  }
}))

type UserIdParserProps = {
  onParsedIdChange?: (parsedId: number | null) => void
}

export const UserIdParser = ({ onParsedIdChange }: UserIdParserProps) => {
  const [inputValue, setInputValue] = useState('')
  const [parsedId, setParsedId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const styles = useUserIdParserStyles()

  useEffect(() => {
    onParsedIdChange?.(parsedId)
  }, [parsedId, onParsedIdChange])

  const handleSubmit = () => {
    if (!inputValue.trim()) {
      setError('Please enter a hash ID')
      setParsedId(null)
      return
    }

    try {
      const id = HashId.parse(inputValue.trim())
      setParsedId(id)
      setError(null)
    } catch (err) {
      setError('Invalid hash ID format')
      setParsedId(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <Paper
      direction='column'
      alignItems='flex-start'
      gap='l'
      p='l'
      css={styles.root}
    >
      <Flex alignItems='center' gap='m'>
        <Text variant='title' size='l'>
          User ID Parser
        </Text>
      </Flex>
      <Text variant='body'>
        Enter a hash ID to decode it into a numeric user ID.
      </Text>

      <Flex direction='column' gap='m' css={{ width: '100%' }}>
        <TextInput
          label='Hash ID'
          placeholder='Enter hash ID (e.g., 12345)'
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />

        <Button variant='primary' fullWidth onClick={handleSubmit}>
          Parse ID
        </Button>
      </Flex>

      {parsedId !== null && (
        <Box>
          <Text variant='body' strength='strong'>
            Parsed User ID:
          </Text>
          <Text variant='body'>{parsedId}</Text>
        </Box>
      )}

      {error && (
        <Box>
          <Text variant='body' color='danger'>
            {error}
          </Text>
        </Box>
      )}
    </Paper>
  )
}
