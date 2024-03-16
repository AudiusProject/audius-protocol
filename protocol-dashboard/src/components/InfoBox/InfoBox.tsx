import { Box, Flex, IconQuestionCircle, Text } from '@audius/harmony'
import { Card } from 'components/Card/Card'
import { PlainLink } from 'components/PlainLink/PlainLink'

type InfoBoxProps = {
  description: string
  ctaText: string
  ctaHref: string
  fullWidth?: boolean
}

export const InfoBox = ({
  description,
  ctaText,
  ctaHref,
  fullWidth
}: InfoBoxProps) => {
  return (
    <Card
      backgroundColor="surface2"
      pv="m"
      ph="l"
      gap="l"
      w={fullWidth ? '100%' : undefined}
    >
      <Box>
        <IconQuestionCircle size="2xl" color="default" />
      </Box>
      <Flex direction="column" gap="m">
        <Text variant="body" size="m" strength="default">
          {description}
        </Text>
        <PlainLink href={ctaHref}>{ctaText}</PlainLink>
      </Flex>
    </Card>
  )
}
