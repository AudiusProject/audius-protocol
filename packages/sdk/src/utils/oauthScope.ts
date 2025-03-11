import { OAUTH_SCOPE_OPTIONS, WriteOnceParams } from '../oauth'

export const isOAuthScopeValid = (scope: string[]) => {
  const validScopes = new Set(OAUTH_SCOPE_OPTIONS)
  return scope.findIndex((s) => !validScopes.has(s as any)) === -1
}

export const isWriteOnceParams = (object: any): object is WriteOnceParams => {
  return (
    ('tx' in object &&
      object.tx === 'connect_dashboard_wallet' &&
      'wallet' in object) ||
    (object.tx === 'disconnect_dashboard_wallet' && 'wallet' in object)
  )
}
