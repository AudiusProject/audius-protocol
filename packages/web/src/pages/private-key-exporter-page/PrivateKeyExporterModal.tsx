import { useState, useEffect } from 'react'

import { Nullable } from '@audius/common'
import pkg from 'bs58'

import { waitForLibsInit } from 'services/audius-backend/eagerLoadUtils'

import { AdvancedWalletDetails } from './AdvancedWalletDetails'

const messages = {
  address: 'ADDRESS',
  privateKey: 'PRIVATE KEY'
}

export const PrivateKeyExporterModal = () => {
  const [publicKey, setPublicKey] = useState<Nullable<string>>(null)
  const [encodedPrivateKey, setEncodedPrivateKey] =
    useState<Nullable<string>>(null)

  useEffect(() => {
    const fetchKeypair = async () => {
      await waitForLibsInit()
      const libs = window.audiusLibs
      const privateKey = libs.Account?.hedgehog?.wallet?.getPrivateKey()
      if (privateKey) {
        const keypair =
          libs.solanaWeb3Manager?.solanaWeb3?.Keypair?.fromSeed(privateKey)
        if (keypair) {
          setPublicKey(keypair.publicKey.toString())
          setEncodedPrivateKey(pkg.encode(keypair.secretKey))
        }
      }
    }
    fetchKeypair()
  }, [])

  if (!publicKey || !encodedPrivateKey) {
    return (
      <div>
        <h1>No keypair found</h1>
      </div>
    )
  }

  return (
    <div>
      <h1>PrivateKeyExporterPage</h1>
      <AdvancedWalletDetails
        keys={[
          { label: messages.address, value: publicKey },
          { label: messages.privateKey, value: encodedPrivateKey }
        ]}
      />
    </div>
  )
}
