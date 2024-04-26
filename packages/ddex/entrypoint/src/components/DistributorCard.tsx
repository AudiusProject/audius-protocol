import {
  useQuery,
} from '@tanstack/react-query'
import { sdk } from '@audius/sdk'
import { Flex, IconEmbed, Text } from "@audius/harmony"
import { useSdk } from '../contexts/AudiusSdkProvider'
import { useCallback } from 'react'
import { Status } from '../contexts/types'

const env = import.meta.env.VITE_ENVIRONMENT as 'dev' | 'stage' | 'prod'

type DistributorCardProps = {
  appKey: string
  url: string
}

export const DistributorCard = ({
  appKey,
  url
}: DistributorCardProps) => {
  const {sdk: audiusSdk, status} = useSdk()

  const { data } = useQuery({
    queryKey: ['todos'],
    queryFn: () =>
      audiusSdk
        ?.developerApps.getDeveloperApp({ address: appKey })
        .then(res => res.data),
    enabled: status !== Status.IDLE && status !== Status.LOADING
  })

  const handleClick = useCallback(() => {
    // Initialize an sdk for the distributor and use that to auth the user.
    const distroSdk = sdk({
      apiKey: appKey
    })
    distroSdk.oauth!.init({
      successCallback: () => undefined,
      env: env === 'prod' ? 'production' : 'staging'
    })
    distroSdk.oauth!.login({
      scope: 'write',
      redirectUri: `${url}/auth/redirect?redirect_uri=${encodeURIComponent(window.location.origin)}`,
      display: 'fullScreen',
      responseMode: 'query'
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
      {
        data ?
          <>
            <Flex
              borderRadius='xs'
              css={{ overflow: 'hidden '}}
              h={'56px'}
              w={'56px'}
            >
              {data.imageUrl
                ? <img src={data?.imageUrl} />
                : <Flex
                    w='100%'
                    justifyContent='center'
                    alignItems='center'
                    borderRadius='l'
                    css={{ backgroundColor: 'var(--harmony-n-200)' }}
                  >
                    <IconEmbed
                      color='subdued'
                      css={{ width: '32px', height: '32px' }}
                    />
                  </Flex>
              }
            </Flex>
            <Text
              variant='body'
              size='s'
              color='default'
            >
              {data?.name ?? ''}
            </Text>
          </>
          : null
        }
    </Flex>
  )
}
