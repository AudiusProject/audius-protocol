// Metro resolves react-router here (see metro.config.js). Mobile only reaches
// it through packages/web/src/utils/route.ts, whose matchPath/useLocation
// helpers are web-only, so this keeps react-router (~225 KB) out of the bundle.
const unavailable = (name: string) => () => {
  throw new Error(`react-router ${name} is not available on mobile`)
}

export const matchPath = unavailable('matchPath')
export const useLocation = unavailable('useLocation')
