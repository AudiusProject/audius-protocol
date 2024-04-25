import { Flex } from "@audius/harmony"
import { DistributorCard } from "./DistributorCard"
import audiusLogo from '../assets/audius.png'
import { RequestCard } from "./RequestCard"

type Distributor = {
  name: string
  imageUrl: string
  link: string
}

const devDistributors: Distributor[] = [
  {
    name: 'Test Distributor',
    imageUrl: audiusLogo,
    link: 'https://ddex.staging.audius.co'
  }
]

const stageDistributors: Distributor[] = [
  {
    name: 'Test Distributor',
    imageUrl: audiusLogo,
    link: 'https://ddex.staging.audius.co'
  }
]

const prodDistributors: Distributor[] = []


type DistributorListProps = {
  environment: 'dev' | 'stage' | 'prod'
}

export const DistributorList = ({
  environment
}: DistributorListProps) => {
  let distributors
  switch (environment) {
    case 'dev':
      distributors = devDistributors
      break
    case 'stage':
      distributors = stageDistributors
      break
    case 'prod':
      distributors = prodDistributors
      break
  }
  return (
    <Flex gap='s'>
      {distributors.map(d =>
        <DistributorCard
          name={d.name}
          imageUrl={d.imageUrl}
          onClick={() => window.open(d.link, '_blank')} />
      )}
      <RequestCard />
    </Flex>
  )
}