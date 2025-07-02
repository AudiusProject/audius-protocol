import { Flex } from '@audius/harmony'

import { AssetInfoSection } from './components/AssetInfoSection'
import { AssetInsights } from './components/AssetInsights'
import { BalanceSection } from './components/BalanceSection'
import { AssetDetailProps } from './types'

const LEFT_SECTION_WIDTH = '704px'
const RIGHT_SECTION_WIDTH = '360px'

export const AssetDetailContent = ({ slug }: AssetDetailProps) => {
  return (
    <Flex direction='row' gap='l'>
      <Flex
        css={{
          width: LEFT_SECTION_WIDTH
        }}
        direction='column'
        gap='m'
      >
        <BalanceSection slug={slug} />
        <AssetInfoSection slug={slug} />
      </Flex>

      <Flex
        css={{
          width: RIGHT_SECTION_WIDTH
        }}
        direction='column'
        gap='m'
      >
        <AssetInsights slug={slug} />
      </Flex>
    </Flex>
  )
}
