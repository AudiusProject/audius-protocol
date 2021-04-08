import { matchPath } from 'react-router-dom'

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
export const SERVICES_DISCOVERY_PROVIDER_TITLE = 'Discovery Node'

export const SERVICES_DISCOVERY_PROVIDER_NODE = '/services/discovery-node/:spID'
export const SERVICES_DISCOVERY_PROVIDER_NODE_TITLE = 'Service'

export const SERVICES_CONTENT = '/services/content-node'
export const SERVICES_CONTENT_TITLE = 'Service'
export const SERVICES_CONTENT_NODE = '/services/content-node/:spID'
export const SERVICES_CONTENT_NODE_TITLE = 'Service'

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
  process.env.REACT_APP_AUDIUS_URL || 'https://audius.co'

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

const routes = [
  { matchParams: { path: HOME, exact: true }, title: HOME_TITLE },
  { matchParams: { path: ANALYTICS, exact: true }, title: ANALYTICS_TITLE },
  {
    matchParams: { path: SERVICES_DISCOVERY_PROVIDER, exact: true },
    title: SERVICES_DISCOVERY_PROVIDER_TITLE
  },
  { matchParams: { path: SERVICES, exact: true }, title: 'SERVICES' },
  { matchParams: { path: GOVERNANCE, exact: true }, title: GOVERNANCE_TITLE },
  {
    matchParams: { path: GOVERNANCE_PROPOSAL, exact: true },
    title: GOVERNANCE_TITLE
  },
  {
    matchParams: { path: SERVICES_USERS, exact: true },
    title: SERVICES_USERS_TITLE
  },
  {
    matchParams: { path: SERVICES_ACCOUNT_USER, exact: true },
    title: SERVICES_ACCOUNT_USER_TITLE
  },
  {
    matchParams: { path: SERVICES_ACCOUNT_OPERATOR, exact: true },
    title: SERVICES_ACCOUNT_OPERATOR_TITLE
  },
  {
    matchParams: { path: SERVICES_SERVICE_PROVIDERS, exact: true },
    title: SERVICES_SERVICE_PROVIDERS_TITLE
  },
  {
    matchParams: { path: SERVICES_CONTENT_NODE, exact: true },
    title: SERVICES_CONTENT_NODE_TITLE
  },
  {
    matchParams: { path: SERVICES_CONTENT, exact: true },
    title: SERVICES_CONTENT_TITLE
  },
  {
    matchParams: { path: SERVICES_DISCOVERY_PROVIDER_NODE, exact: true },
    title: SERVICES_DISCOVERY_PROVIDER_NODE_TITLE
  },
  { matchParams: { path: SERVICES, exact: true }, title: SERVICES_TITLE },
  {
    matchParams: { path: API, exact: true },
    title: API_TITLE
  },
  {
    matchParams: { path: API_LEADERBOARD, exact: true },
    title: API_LEADERBOARD_TITLE
  }
]

export const getPageTitleFromRoute = (route: string) => {
  const path = routes.find(rt => !!matchPath(route, rt.matchParams))
  if (path) {
    return path.title
  }
  // If no routes matched, the 404 page was reached.
}

export const isCryptoPage = (route: string) => {
  return route.startsWith(GOVERNANCE) || route.startsWith(SERVICES)
}
