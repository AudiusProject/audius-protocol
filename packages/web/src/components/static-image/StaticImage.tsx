import { ComponentPropsWithoutRef } from 'react'

import { SquareSizes, WidthSizes } from '@audius/common/src/models/ImageSizes'
import { Box } from '@audius/harmony/src/components/layout/Box'
import { Flex } from '@audius/harmony/src/components/layout/Flex'
import { developmentConfig } from '@audius/sdk/src/sdk/config/development'
import { productionConfig } from '@audius/sdk/src/sdk/config/production'
import { stagingConfig } from '@audius/sdk/src/sdk/config/staging'
import {
  AppAuth,
  getDefaultStorageNodeSelectorConfig
} from '@audius/sdk/src/sdk/services'
import { DiscoveryNodeSelector } from '@audius/sdk/src/sdk/services/DiscoveryNodeSelector/DiscoveryNodeSelector'
import { StorageNodeSelector } from '@audius/sdk/src/sdk/services/StorageNodeSelector/StorageNodeSelector'

import { env } from 'services/env'

export type StaticImageProps = {
  // Image CID
  cid?: string | null
  // Size of image to select
  size?: SquareSizes | WidthSizes
  // Override image url. Used for updated profile picture and things
  imageUrl?: string
  // Fallback image url
  fallbackImageUrl?: string
  // Set height and width of wrapper container to 100%
  fullWidth?: boolean
  // Classes to apply to the wrapper
  wrapperClassName?: string
  // Whether or not to blur the background image
  useBlur?: boolean
} & ComponentPropsWithoutRef<'img'>

const sdkConfigs = {
  production: productionConfig,
  staging: stagingConfig,
  development: developmentConfig
} as const

const sdkConfig =
  sdkConfigs[env.ENVIRONMENT as keyof typeof sdkConfigs] ?? productionConfig

const discoveryNodeSelector = new DiscoveryNodeSelector({
  ...getDefaultStorageNodeSelectorConfig(sdkConfig)
})

const auth = new AppAuth('', '')

const storageNodeSelector = new StorageNodeSelector({
  ...getDefaultStorageNodeSelectorConfig(sdkConfig),
  auth,
  discoveryNodeSelector
})

export const StaticImage = (props: StaticImageProps) => {
  const {
    cid,
    size = SquareSizes.SIZE_1000_BY_1000,
    imageUrl,
    fallbackImageUrl,
    fullWidth = false,
    wrapperClassName,
    children,
    useBlur,
    ...other
  } = props

  let url = ''
  if (cid) {
    const cidFileName = `${cid}/${size}.jpg`
    const storageNodes = storageNodeSelector.getNodes(cidFileName)
    url = `${storageNodes[0]}/content/${cidFileName}`
  }

  return (
    <Box
      h={fullWidth ? '100%' : undefined}
      w={fullWidth ? '100%' : undefined}
      className={wrapperClassName}
      css={{ overflow: 'hidden' }}
    >
      <img
        css={{
          height: '100%',
          width: '100%',
          maxWidth: '100%',
          objectFit: 'cover'
        }}
        src={imageUrl || url || fallbackImageUrl}
        {...other}
      />

      {useBlur ? (
        <Box
          css={{
            position: 'absolute',
            height: '100%',
            width: '100%',
            backdropFilter: 'blur(25px)',
            zIndex: 3
          }}
        />
      ) : null}
      {children ? (
        <Flex
          h='100%'
          w='100%'
          alignItems='center'
          justifyContent='center'
          css={{ position: 'absolute', top: 0, left: 0, zIndex: 3 }}
        >
          {children}
        </Flex>
      ) : null}
    </Box>
  )
}
