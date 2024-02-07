import { SmartCollectionVariant } from '@audius/common/models'
import {
  IconComponent,
  IconQuestionCircle as IconExploreFeelingLucky,
  IconBoxHeart as IconExploreMostLoved,
  IconStars as IconExploreNewReleases,
  IconRemix as IconExploreRemixables,
  IconRadar as IconExploreUnderRadar
} from '@audius/harmony'

import IconExploreRotation from 'assets/img/iconExploreRotation.svg'

export const smartCollectionIcons = {
  [SmartCollectionVariant.HEAVY_ROTATION]: IconExploreRotation as IconComponent,
  [SmartCollectionVariant.BEST_NEW_RELEASES]: IconExploreNewReleases,
  [SmartCollectionVariant.UNDER_THE_RADAR]: IconExploreUnderRadar,
  [SmartCollectionVariant.MOST_LOVED]: IconExploreMostLoved,
  [SmartCollectionVariant.REMIXABLES]: IconExploreRemixables,
  [SmartCollectionVariant.FEELING_LUCKY]: IconExploreFeelingLucky,
  [SmartCollectionVariant.AUDIO_NFT_PLAYLIST]: null
}
