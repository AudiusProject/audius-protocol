import { Flex, Text, TextLink } from "@audius/harmony"

const messages = {
  distributor: "Don't see your distributor?",
  send: 'Send a request!'
}

export const RequestCard = () => {
  return (
    <Flex
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
    >
      <Text
        variant='body'
        size='s'
        color='default'
        textAlign='center'
      >
        {messages.distributor}
      </Text>
      <TextLink
        textVariant='body'
        size='s'
        href="mailto:ddex-support@audius.co"
        variant='visible'
      >
        {messages.send}
      </TextLink>
    </Flex>
  )
}
