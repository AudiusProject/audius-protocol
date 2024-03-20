import { ComponentPropsWithoutRef } from 'react'

import { SquareSizes } from '@audius/common/models'
import { Box, Flex } from '@audius/harmony'
import {
  DiscoveryNodeSelector,
  productionConfig,
  stagingConfig,
  developmentConfig,
  StorageNodeSelector,
  AppAuth
} from '@audius/sdk'

import { env } from 'services/env'

export type StaticImageProps = {
  // Image CID
  cid?: string | null
  // Size of image to select
  size?: SquareSizes
  // Set height and width of wrapper container to 100%
  fullWidth?: boolean
  // Classes to apply to the wrapper
  wrapperClassName?: string
} & ComponentPropsWithoutRef<'img'>

const sdkConfigs = {
  production: productionConfig,
  staging: stagingConfig,
  development: developmentConfig
}

const discoveryNodeSelector = new DiscoveryNodeSelector({
  bootstrapServices: (
    sdkConfigs[env.ENVIRONMENT as keyof typeof sdkConfigs] ?? productionConfig
  ).discoveryNodes
})

const auth = new AppAuth('', '')

const storageNodeSelector = new StorageNodeSelector({
  auth,
  discoveryNodeSelector,
  bootstrapNodes: (
    sdkConfigs[env.ENVIRONMENT as keyof typeof sdkConfigs] ?? productionConfig
  ).storageNodes
})

export const StaticImage = (props: StaticImageProps) => {
  const {
    cid,
    size = SquareSizes.SIZE_1000_BY_1000,
    fullWidth = false,
    wrapperClassName,
    children,
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
      <img height='100%' width='100%' src={url} {...other} />
      {children ? (
        <Flex
          h='100%'
          w='100%'
          alignItems='center'
          justifyContent='center'
          css={{ zIndex: 3 }}
        >
          {children}
        </Flex>
      ) : null}
    </Box>
  )
}
