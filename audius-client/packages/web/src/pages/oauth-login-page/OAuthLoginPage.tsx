import React, { FormEvent, useMemo, useState } from 'react'

import { Button } from '@audius/stems'
import base64url from 'base64url'
import * as queryString from 'query-string'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { getAccountUser } from 'common/store/account/selectors'
import Input from 'components/data-entry/Input'
import AudiusBackend from 'services/AudiusBackend'

import styles from '../styles/OAuthLoginPage.module.css'

export const OAuthLoginPage = () => {
  const { search, hash } = useLocation()
  const { scope, state, redirect_uri } = queryString.parse(search)
  const parsedRedirectUri = useMemo(() => {
    if (redirect_uri && typeof redirect_uri === 'string') {
      try {
        return new URL(redirect_uri)
      } catch {
        return null
      }
    }
    return null
  }, [redirect_uri])
  const redirectUriHost =
    parsedRedirectUri == null ? null : parsedRedirectUri.host
  const { token } = queryString.parse(hash)
  const account = useSelector(getAccountUser)
  const isLoggedIn = Boolean(account)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isRedirectValid = useMemo(() => {
    if (redirect_uri) {
      if (parsedRedirectUri == null) {
        // This means the redirect uri is not a string (and is thus invalid) or the URI format was invalid
        return false
      }
      const { hash, username, password, pathname, hostname } = parsedRedirectUri
      if (hash || username || password) {
        return false
      }
      if (
        pathname.includes('/..') ||
        pathname.includes('\\..') ||
        pathname.includes('../')
      ) {
        return false
      }

      // From https://stackoverflow.com/questions/106179/regular-expression-to-match-dns-hostname-or-ip-address:
      const ipRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/
      const localhostIPv4Regex = /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
      // Disallow IP addresses as redirect URIs unless it's localhost
      if (
        ipRegex.test(hostname) &&
        hostname !== '[::1]' &&
        !localhostIPv4Regex.test(hostname)
      ) {
        return false
      }
      // TODO(nkang): Potentially check URI against malware list like https://urlhaus-api.abuse.ch/#urlinfo
    }
    return true
  }, [parsedRedirectUri, redirect_uri])

  const formOAuthResponse = async () => {
    let email: string | undefined | null
    try {
      email = await AudiusBackend.getUserEmail()
    } catch {
      setSubmitError('Something went wrong.')
      return
    }
    const timestamp = Math.round(new Date().getTime() / 1000)
    const response = {
      userId: account?.user_id,
      email,
      name: account?.name,
      handle: account?.handle,
      verified: account?.is_verified,
      // TODO(nkang): Get profile pic URL
      // imageURL: account?._profile_picture_sizes,
      state,
      sub: account?.user_id,
      iat: timestamp
    }
    const header = base64url.encode(
      JSON.stringify({ typ: 'JWT', alg: 'keccak256' })
    )
    const payload = base64url.encode(JSON.stringify(response))

    const message = `${header}.${payload}`
    let signedData: { data: string; signature: string }
    try {
      signedData = await AudiusBackend.signDiscoveryNodeRequest(message)
    } catch {
      setSubmitError('Something went wrong.')
      return
    }
    const signature = signedData.signature

    return `${header}.${payload}.${base64url.encode(signature)}`
  }

  const onFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    let signInResponse: any
    try {
      signInResponse = await AudiusBackend.signIn(email, password)
    } catch (err) {
      setSubmitError('Unknown error')
    }

    if (
      !signInResponse.error &&
      signInResponse.user &&
      signInResponse.user.name
    ) {
      // Success - perform Oauth authorization
      await authAndRedirect()
    } else if (
      (!signInResponse.error &&
        signInResponse.user &&
        !signInResponse.user.name) ||
      (signInResponse.error && signInResponse.phase === 'FIND_USER')
    ) {
      setSubmitError('Sign up incomplete')
    } else {
      setSubmitError('Wrong credentials')
    }
  }

  const authAndRedirect = async () => {
    const jwt = await formOAuthResponse()
    if (jwt == null) {
      return
    }
    const statePart = state != null ? `state=${state}&` : ''
    const fragment = `#${statePart}token=${jwt}`
    if (isRedirectValid === true) {
      if (redirect_uri) {
        window.location.href = `${redirect_uri}${fragment}`
      } else {
        window.location.hash = `${statePart}token=${jwt}`
      }
    }
  }

  if (token) {
    return (
      <div className={styles.container}>You should be redirected soon...</div>
    )
  }

  if (isRedirectValid === false) {
    return (
      <div className={styles.container}>
        Something went wrong - this is an invalid link.
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        <ul>
          <li>Scope: {scope}</li>
          <li>State: {state}</li>
          <li>Redirect URL: {redirect_uri}</li>
          <li>Redirect host: {redirectUriHost}</li>
          <li>Submission error: {submitError}</li>
        </ul>
      </div>
      <div>
        {isLoggedIn ? (
          // TODO(nkang): Allow user to use different account
          <Button text='Continue' onClick={authAndRedirect} />
        ) : (
          <form onSubmit={onFormSubmit}>
            <Input
              placeholder='Email'
              size='medium'
              type='email'
              name='email'
              id='email-input'
              autoComplete='username'
              value={email}
              onChange={setEmail}
            />
            <Input
              placeholder='Password'
              size='medium'
              name='password'
              id='password-input'
              autoComplete='current-password'
              value={password}
              type='password'
              onChange={setPassword}
            />
            <Button text='Submit' buttonType='submit' />
          </form>
        )}
      </div>
    </div>
  )
}
