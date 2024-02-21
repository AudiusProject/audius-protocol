import { Flex, Text, IconAudiusLogoHorizontalColor } from '@audius/harmony'

const NotAllowlisted = () => {
  return (
    <Flex
      p='xl'
      gap='m'
      direction='column'
      justifyContent='center'
      alignItems='center'
    >
      <div>
        <Text variant='heading' color='heading'>
          You are not in the Audius DDEX system as an admin or artist. Please
          contact support to be added.
        </Text>
      </div>
      <br /> <br />
      <IconAudiusLogoHorizontalColor />
    </Flex>
  )
}

export default NotAllowlisted
