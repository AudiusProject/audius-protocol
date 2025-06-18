import { Flex } from '@audius/harmony'
import { DistributorCard } from './DistributorCard'
import { RequestCard } from './RequestCard'
import { useDistributors } from '../hooks/useDistributors'

export const DistributorList = () => {
  const distributors = useDistributors()
  return (
    <Flex gap='m' wrap='wrap' justifyContent='center'>
      {distributors.map(({ appKey, url }) => (
        <DistributorCard key={appKey} appKey={appKey} url={url} />
      ))}
      <RequestCard />
    </Flex>
  )
}
