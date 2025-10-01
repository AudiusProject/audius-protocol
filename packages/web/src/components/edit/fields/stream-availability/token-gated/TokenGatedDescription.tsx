import { Flex, IconQuestionCircle, Hint, Text } from '@audius/harmony'

const messages = {
  tokenGatedSubtitle: (tokenName: string) =>
    `Anyone holding ${tokenName} can stream.`,
  noTokens: 'No Tokens found. To enable this option, launch a token.',
  learnMore: 'Learn More'
}

type TokenGatedDescriptionProps = {
  tokenName: string
  hasTokens: boolean
  isUpload: boolean
}

export const TokenGatedDescription = (props: TokenGatedDescriptionProps) => {
  const { hasTokens, isUpload, tokenName } = props

  const helpContent = !hasTokens ? messages.noTokens : null

  return (
    <Flex gap='m' direction='column'>
      <Text variant='body'>{messages.tokenGatedSubtitle(tokenName)}</Text>
      {!hasTokens && isUpload ? (
        <Hint icon={IconQuestionCircle}>{helpContent}</Hint>
      ) : null}
    </Flex>
  )
}
