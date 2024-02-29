import { useState } from 'react'

import { Button, ButtonType } from '@audius/stems'

import Input from 'components/data-entry/Input'
import { useDevModeHotkey } from 'hooks/useDevModeHotkey'

import styles from './DiscoveryNodeSelection.module.css'

const localStorageKey = '@audius/libs:discovery-node-timestamp'

const DiscoveryNodeSelection = () => {
  const isEnabled = useDevModeHotkey(68 /* d */)
  const [endpoint, setEndpoint] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(false)

  const handleDiscoveryNodeSelection = async () => {
    try {
      const url = endpoint.endsWith('/')
        ? endpoint.substring(0, endpoint.length - 1)
        : endpoint
      const item = {
        endpoint: url,
        timestamp: Date.now()
      }
      window.localStorage.setItem(localStorageKey, JSON.stringify(item))
      setEndpoint('')
      setSuccess(true)
      setError(false)
    } catch (e) {
      setError(true)
      setSuccess(false)
    }
  }

  const getDiscoveryNode = () => {
    const storedItem = window.localStorage.getItem(localStorageKey)
    const { endpoint } = JSON.parse(storedItem || '{}') as {
      endpoint: string
      timestamp: string
    }
    return endpoint
  }

  return isEnabled ? (
    <div className={styles.container}>
      <div className={styles.title}>Discovery Node Selection Preview</div>
      <div className={styles.inputContainer}>
        <div className={styles.current}>
          {`Current discovery node is: ${getDiscoveryNode()}`}
        </div>
        <Input
          // not using messages variable because this is not intended for end user
          placeholder='Enter a valid discovery node to change'
          value={endpoint}
          onChange={(value: string) => setEndpoint(value.trim())}
        />

        <Button
          // not using messages variable because this is not intended for end user
          text='Apply'
          type={ButtonType.PRIMARY_ALT}
          onClick={handleDiscoveryNodeSelection}
        />
      </div>

      {success && (
        <div className={styles.success}>
          New discovery provider successfully set
        </div>
      )}

      {error && (
        <div className={styles.error}>
          Could not set discovery provider (does not exist or currently
          unhealthy)
        </div>
      )}
    </div>
  ) : null
}

export default DiscoveryNodeSelection
