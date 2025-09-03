import { Artwork, Flex, Text } from '@audius/harmony'

type ArtistCoinsFeatureCardProps = {
  title: string
  description: string
  imageSrc: string
}

export const ArtistCoinsFeatureCard = ({
  title,
  description,
  imageSrc
}: ArtistCoinsFeatureCardProps) => {
  return (
    <Flex
      p='l'
      gap='s'
      direction='column'
      flex={1}
      border='default'
      borderRadius='m'
    >
      <Flex alignItems='center' gap='s'>
        <Artwork src={imageSrc} w='xl' h='xl' borderWidth={0} />
        <Text variant='title' color='default' size='m'>
          {title}
        </Text>
      </Flex>
      <Text variant='body' color='subdued' size='m'>
        {description}
      </Text>
    </Flex>
  )
}
