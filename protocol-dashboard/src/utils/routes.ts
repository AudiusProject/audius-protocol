import { useLocation } from 'react-router-dom'

/**
 * All Routes for the Audius Protocol Dashboard
 */

export const HOME = '/'
export const HOME_TITLE = 'Overview'

export const API = '/api'
export const API_TITLE = 'API Leaderboard'

export const API_LEADERBOARD = '/api/leaderboard'
export const API_LEADERBOARD_TITLE = 'API Leaderboard'

export const ANALYTICS = '/analytics'
export const ANALYTICS_TITLE = 'Analytics'

// Services Pages
export const SERVICES = '/services'
export const SERVICES_TITLE = 'Services Overview'

export const SERVICES_DISCOVERY_PROVIDER = '/services/discovery-node'
export const SERVICES_DISCOVERY_PROVIDER_TITLE = 'Discovery Nodes'

export const SERVICES_DISCOVERY_PROVIDER_NODE = '/services/discovery-node/:spID'
export const SERVICES_DISCOVERY_PROVIDER_NODE_TITLE = 'Discovery Node'
export const SERVICES_UNREGISTERED_DISCOVERY_NODE =
  '/services/discovery-node/unregistered'
export const SERVICES_UNREGISTERED_DISCOVERY_NODE_TITLE = 'Unregistered Node'

export const SERVICES_CONTENT = '/services/content-node'
export const SERVICES_CONTENT_TITLE = 'Content Nodes'

export const SERVICES_CONTENT_NODE = '/services/content-node/:spID'
export const SERVICES_CONTENT_NODE_TITLE = 'Content Node'
export const SERVICES_UNREGISTERED_CONTENT_NODE =
  '/services/content-node/unregistered'
export const SERVICES_UNREGISTERED_CONTENT_NODE_TITLE = 'Unregistered Node'

export const SERVICES_SERVICE_PROVIDERS = '/services/service-providers'
export const SERVICES_SERVICE_PROVIDERS_TITLE = 'All Service Operators'

export const SERVICES_USERS = '/services/users'
export const SERVICES_USERS_TITLE = 'All Users'

export const SERVICES_ACCOUNT = '/services/user'
export const SERVICES_ACCOUNT_USER = '/services/user/:wallet'
export const SERVICES_ACCOUNT_USER_TITLE = 'User'

export const SERVICES_OPERATOR = '/services/operator'
export const SERVICES_ACCOUNT_OPERATOR = '/services/operator/:wallet'
export const SERVICES_ACCOUNT_OPERATOR_TITLE = 'Operator'

// Governance Pages
export const GOVERNANCE = '/governance'
export const GOVERNANCE_TITLE = 'All Governance Proposals'
export const GOVERNANCE_PROPOSAL = '/governance/proposal/:proposalId'
export const GOVERNANCE_PROPOSAL_TITLE = 'Proposal'

export const NOT_FOUND = '/404'

// External Routes
export const AUDIUS_API_URL = 'https://audius.org/api'
export const AUDIUS_DAPP_URL =
  import.meta.env.VITE_AUDIUS_URL || 'https://audius.co'

// Get Routes
export const accountPage = (address: string) => {
  return `${SERVICES_ACCOUNT}/${address}`
}

export const operatorPage = (address: string) => {
  return `${SERVICES_OPERATOR}/${address}`
}

export const discoveryNodePage = (spID: number) => {
  return `${SERVICES_DISCOVERY_PROVIDER}/${spID}`
}

export const contentNodePage = (spID: number) => {
  return `${SERVICES_CONTENT}/${spID}`
}

export const proposalPage = (proposalId: number) => {
  return `${GOVERNANCE}/proposal/${proposalId}`
}

const routeTitles = {
  [HOME]: HOME_TITLE,
  [ANALYTICS]: ANALYTICS_TITLE,
  [SERVICES_DISCOVERY_PROVIDER]: SERVICES_DISCOVERY_PROVIDER_TITLE,
  [SERVICES]: SERVICES_TITLE,
  [GOVERNANCE]: GOVERNANCE_TITLE,
  [GOVERNANCE_PROPOSAL]: GOVERNANCE_TITLE,
  [SERVICES_USERS]: SERVICES_USERS_TITLE,
  [SERVICES_ACCOUNT_USER]: SERVICES_ACCOUNT_USER_TITLE,
  [SERVICES_ACCOUNT_OPERATOR]: SERVICES_ACCOUNT_OPERATOR_TITLE,
  [SERVICES_SERVICE_PROVIDERS]: SERVICES_SERVICE_PROVIDERS_TITLE,
  [SERVICES_CONTENT_NODE]: SERVICES_CONTENT_NODE_TITLE,
  [SERVICES_CONTENT]: SERVICES_CONTENT_TITLE,
  [SERVICES_DISCOVERY_PROVIDER_NODE]: SERVICES_DISCOVERY_PROVIDER_NODE_TITLE,
  [API]: API_TITLE,
  [API_LEADERBOARD]: API_LEADERBOARD_TITLE
}

export const getPageTitle = (route: string) => {
  return routeTitles[route] // If no routes matched, the 404 page was reached
}

export const usePageTitle = () => {
  const location = useLocation()
  return getPageTitle(location.pathname)
}

export const isCryptoPage = (route: string) => {
  return route.startsWith(GOVERNANCE) || route.startsWith(SERVICES)
}

export const navRoutes = [
  {
    baseRoute: HOME,
    matchParams: [{ path: HOME, exact: true }],
    text: 'OVERVIEW'
  },
  {
    baseRoute: ANALYTICS,
    matchParams: [{ path: ANALYTICS, exact: true }, { path: API }],
    text: 'ANALYTICS'
  },
  {
    baseRoute: SERVICES,
    matchParams: [{ path: `${SERVICES}*` }],
    text: 'SERVICES'
  },
  {
    baseRoute: GOVERNANCE,
    matchParams: [{ path: `${GOVERNANCE}*` }],
    text: 'GOVERNANCE'
  }
]
