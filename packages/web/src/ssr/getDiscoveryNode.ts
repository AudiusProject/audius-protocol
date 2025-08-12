import { discoveryNodeAllowlist } from './constants'

export const getDiscoveryNode = () =>
  discoveryNodeAllowlist[
    Math.floor(Math.random() * discoveryNodeAllowlist.length)
  ]
