import { ArtistSpotlight } from './ArtistSpotlight'
import { BestOfAudiusTiles } from './BestOfAudiusTiles'
import { FeaturedPlaylists } from './FeaturedPlaylists'
import { FeaturedRemixContests } from './FeaturedRemixContests'
import { LabelSpotlight } from './LabelSpotlight'
import { MoodsGrid } from './MoodsGrid'
import { ProgressiveScrollView } from './ProgressiveScrollView'

export const ExploreContent = () => {
  return (
    <ProgressiveScrollView>
      <FeaturedPlaylists />
      <FeaturedRemixContests />
      <ArtistSpotlight />
      <LabelSpotlight />
      <MoodsGrid />
      <BestOfAudiusTiles />
    </ProgressiveScrollView>
  )
}
