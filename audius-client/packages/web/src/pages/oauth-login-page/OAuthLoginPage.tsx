import React, { FormEvent, useState } from 'react'

import { Button } from '@audius/stems'
import * as queryString from 'query-string'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { getAccountUser } from 'common/store/account/selectors'
import Input from 'components/data-entry/Input'
import { MetaMaskOption } from 'pages/sign-on/components/desktop/MetaMaskOption'
import AudiusBackend from 'services/AudiusBackend'

import styles from '../styles/OAuthLoginPage.module.css'

export const OAuthLoginPage = () => {
  const { search } = useLocation()
  const { scope, api_key, state, redirect } = queryString.parse(search)
  const account = useSelector(getAccountUser)
  const isLoggedIn = Boolean(account)
  const hasMetaMask = !!(window as any).web3
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

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

  const onSignInWithMetaMask = async () => {
    try {
      window.localStorage.setItem('useMetaMask', JSON.stringify(true))
      // window.location.reload()
    } catch (err) {
      console.error({ err })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        <ul>
          <li>Scope: {scope}</li>
          <li>Api key: {api_key}</li>
          <li>State: {state}</li>
          <li>Redirect URL: {redirect}</li>
          <li>Submission error: {submitError}</li>
        </ul>
      </div>
      <div>
        {!isLoggedIn ? (
          // TODO(nkang): Allow user to use different account
          <Button text='Continue' />
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
        {hasMetaMask ? (
          <MetaMaskOption text='Sign In With' onClick={onSignInWithMetaMask} />
        ) : null}
      </div>
    </div>
  )
}
