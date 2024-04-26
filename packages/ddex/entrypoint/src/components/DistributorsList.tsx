import { Flex } from "@audius/harmony"
import { DistributorCard } from "./DistributorCard"
import { RequestCard } from "./RequestCard"
import devDistributors from '../distributors/dev.json'
import stageDistributors from '../distributors/stage.json'
import prodDistributors from '../distributors/prod.json'

type DistributorListProps = {
  environment: 'dev' | 'stage' | 'prod'
}

export const DistributorList = ({
  environment
}: DistributorListProps) => {
  let distributors
  switch (environment) {
    case 'dev':
      distributors = devDistributors.distributors
      break
    case 'stage':
      distributors = stageDistributors.distributors
      break
    case 'prod':
      distributors = prodDistributors.distributors
      break
  }
  return (
    <Flex gap='m'>
      {distributors.map(({appKey, url}) =>
        <DistributorCard
          key={appKey}
          appKey={appKey}
          url={url}
        />
      )}
      <RequestCard />
    </Flex>
  )
}