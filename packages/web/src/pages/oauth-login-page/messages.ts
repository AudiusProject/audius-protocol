export const messages = {
  alreadyLoggedInAuthorizePrompt: (appName: string) =>
    `Authorize ${appName} to use your Audius account?`,
  signInAndAuthorizePrompt: (appName: string) =>
    `Sign in to allow ${appName} to use your Audius account?`,
  alreadyAuthorizedContinuePrompt: (appName: string) => `Sign in to ${appName}`,
  permissionsRequestedHeader: 'This application will receive',
  readOnlyAccountAccess: 'Read-only access to your account',
  connectDashboardWalletAccess:
    'Permission to link this wallet to your account',
  writeAccountAccess: 'Read/Write access to your account',
  emailLoading: 'Email loading',
  emailAddressAccess: 'Your Email Address',
  doesNotGrantAccessTo: 'Does not grant access to:',
  walletsOrDMs: 'Wallets or Direct Messages',
  signOut: 'Not you? Sign Out & Switch Account',
  signUp: `Don't have an account? Sign up`,
  authorizeButton: 'Authorize App',
  continueButton: 'Continue',
  signInButton: 'Sign In & Authorize App',
  invalidCredentialsError: 'Invalid Credentials',
  miscError: 'An error has occurred. Please try again.',
  accountIncompleteError:
    'It looks like your account was never fully completed! Please complete your sign-up first.',
  redirectURIInvalidError:
    'Whoops, this is an invalid link (redirect URI missing or invalid).',
  missingAppNameError: 'Whoops, this is an invalid link (app name missing).',
  scopeError: `Whoops, this is an invalid link (scope missing or invalid).`,
  connectWalletNoPostMessageError:
    'Whoops, this is an invalid link (redirectUri must be `postMessage` if tx is `connectDashboardWallet`).',
  writeOnceParamsError:
    'Whoops, this is an invalid link (transaction params missing or invalid).',
  writeOnceTxError: `Whoops, this is an invalid link ('tx' missing or invalid).`,
  missingFieldError: 'Whoops, you must enter both your email and password.',
  originInvalidError:
    'Whoops, this is an invalid link (redirect URI is set to `postMessage` but origin is missing).',
  noWindowError:
    'Whoops, something went wrong. Please close this window and try again.',
  responseModeError:
    'Whoops, this is an invalid link (response mode invalid - if set, must be "fragment" or "query").',
  signedInAs: `You’re signed in as`,
  missingApiKeyError: 'Whoops, this is an invalid link (app API Key missing)',
  invalidApiKeyError: 'Whoops, this is an invalid link (app API Key invalid)'
}
