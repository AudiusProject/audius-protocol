import { Flex, Text } from "@audius/harmony"

type DistributorCardProps = {
  name: string
  imageUrl: string
  onClick: () => void
}

export const DistributorCard = ({
  name,
  imageUrl,
  onClick
}: DistributorCardProps) => {
  return (
    <Flex
      onClick={onClick}
      borderRadius='m'
      border='default'
      backgroundColor='white'
      direction='column'
      alignItems='center'
      justifyContent='center'
      gap='s'
      p='s'
      w='136px'
      h='136px'
      css={{
        cursor: 'pointer'
      }}
    >
      <Flex
        borderRadius='m'
        css={{ overflow: 'hidden '}}
      >
        <img height={56} width={56} src={imageUrl} />
      </Flex>
      <Text variant='body' size='s' color='default'>{name}</Text>
    </Flex>
  )
}
