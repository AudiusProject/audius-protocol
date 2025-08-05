import { Flex } from '@audius/harmony'

import { AssetInfoSection } from './components/AssetInfoSection'
import { AssetInsights } from './components/AssetInsights'
import { BalanceSection } from './components/BalanceSection'
import { AssetDetailProps } from './types'

const LEFT_SECTION_WIDTH = '704px'
const RIGHT_SECTION_WIDTH = '360px'

export const AssetDetailContent = ({ assetName }: AssetDetailProps) => {
  return (
    <Flex gap='l'>
      <Flex w={LEFT_SECTION_WIDTH} direction='column' gap='m'>
        <BalanceSection assetName={assetName} />
        <AssetInfoSection assetName={assetName} />
      </Flex>

      <Flex w={RIGHT_SECTION_WIDTH} direction='column' gap='m'>
        <AssetInsights assetName={assetName} />
      </Flex>
    </Flex>
  )
}
