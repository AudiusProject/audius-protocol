import { useFeaturedProfiles } from '@audius/common/api'
import { User } from '@audius/common/models'
import { LoadingSpinner, Flex } from '@audius/harmony'

import Section from './Section'
import UserArtCard from './UserArtCard'

const messages = {
  featuredProfiles: 'Artists You Should Follow',
  exploreMoreProfiles: 'Explore More Artists'
}

export const FeaturedProfiles = () => {
  const { data: profiles, isPending } = useFeaturedProfiles()

  return (
    <Section
      title={messages.featuredProfiles}
      expandable
      expandText={messages.exploreMoreProfiles}
    >
      {profiles?.map((profile: User, i: number) => {
        return (
          <UserArtCard key={profile.user_id} id={profile.user_id} index={i} />
        )
      })}
      {isPending && (
        <Flex w='100%' h={320} alignItems='center' justifyContent='center'>
          <LoadingSpinner />
        </Flex>
      )}
    </Section>
  )
}
