import { Flex, Paper, Text, Artwork } from '@audius/harmony'

type FeatureCardProps = {
  title: string
  description: string
  imageSrc: string
}

export const FeatureCard = ({
  title,
  description,
  imageSrc
}: FeatureCardProps) => {
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

type FeatureCardData = {
  title: string
  description: string
  imageSrc: string
}

type WhyCreateCardProps = {
  title: string
  description: string
  features: FeatureCardData[]
}

export const WhyCreateCard = ({
  title,
  description,
  features
}: WhyCreateCardProps) => {
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
          <FeatureCard
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
