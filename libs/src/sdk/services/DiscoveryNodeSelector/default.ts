import { DiscoveryNodeSelector } from './DiscoveryNodeSelector'

export const defaultDiscoveryNodeSelector = new DiscoveryNodeSelector({
  bootstrapServices: ['https://discoveryprovider.audius.co']
})
