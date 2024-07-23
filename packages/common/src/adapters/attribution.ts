import snakecaseKeys from 'snakecase-keys'

import { ResourceContributor } from '~/models/Track'

// Type from API is Raw, so we'll just convert the keys
export const resourceContributorFromSDK = (
  input: object
): ResourceContributor => {
  return snakecaseKeys(input) as ResourceContributor
}
