import {
  useQuery,
} from '@tanstack/react-query'
import { sdk } from '@audius/sdk'
import { Flex, Text } from "@audius/harmony"
import { useSdk } from '../contexts/AudiusSdkProvider'
import { useCallback } from 'react'

type DistributorCardProps = {
  appKey: string
  url: string
}

export const DistributorCard = ({
  appKey,
  url
}: DistributorCardProps) => {
  const audiusSdk = useSdk()

  const { data } = useQuery({
    queryKey: ['todos'],
    queryFn: () => audiusSdk?.developerApps.getDeveloperApp({ address: appKey }).then(res => res.data)
  })

  const handleClick = useCallback(() => {
    // Initialize an sdk for the distributor and use that to auth the user.
    const distroSdk = sdk({
      apiKey: appKey
    })
    distroSdk.oauth!.init({
      successCallback: () => undefined,
    })
    distroSdk.oauth!.login({
      scope: 'write',
      redirectUri: url,
      display: 'fullScreen'
    })
  }, [appKey, url])

  return (
    <Flex
      onClick={handleClick}
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
        <img height={56} width={56} src={data?.imageUrl} />
      </Flex>
      <Text variant='body' size='s' color='default'>{data?.name}</Text>
    </Flex>
  )
}
