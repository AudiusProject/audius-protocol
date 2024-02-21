import { Flex, Text, IconAudiusLogoHorizontalColor } from '@audius/harmony'

const ArtistHome = () => {
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
          You&apos;re all set for allowing your music to be uploaded to Audius
          through DDEX! 🎉
        </Text>
      </div>
      <div>
        Please contact support if you&apos;re supposed to be admin with access
        to manage deliveries.
      </div>
      <br /> <br />
      <IconAudiusLogoHorizontalColor />
    </Flex>
  )
}

export default ArtistHome
