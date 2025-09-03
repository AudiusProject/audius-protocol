import { Flex, Paper, Text } from '@audius/harmony'

import { ArtistCoinsFeatureCard } from './ArtistCoinsFeatureCard'

type FeatureCardData = {
  title: string
  description: string
  imageSrc: string
}

type ArtistCoinsWhyCreateCardProps = {
  title: string
  description: string
  features: FeatureCardData[]
}

export const ArtistCoinsWhyCreateCard = ({
  title,
  description,
  features
}: ArtistCoinsWhyCreateCardProps) => {
  return (
    <Paper p='2xl' gap='2xl' direction='column' w='100%'>
      <Flex direction='column' gap='s'>
        <Text variant='heading' size='m' color='default'>
          {title}
        </Text>
        <Text variant='body' size='m' color='subdued'>
          {description}
        </Text>
      </Flex>

      <Flex gap='s' wrap='wrap'>
        {features.map((feature, index) => (
          <ArtistCoinsFeatureCard
            key={index}
            title={feature.title}
            description={feature.description}
            imageSrc={feature.imageSrc}
          />
        ))}
      </Flex>
    </Paper>
  )
}
