/**
 * Create an announcement notification
 */
import prompts from 'prompts'
import { AudiusLibs, Utils } from '@audius/sdk'

export const main = async () => {
  // Get Env Keys
  const message = {
    rpc: process.env.RPC_ENDPOINT,
    registryAddress: process.env.REGISTRY_ADDRESS,
    entityManagerAddress: process.env.ENTITY_MANAGER_ADDRESS,
    privateKey: process.env.PRIVATE_KEY,
    identityService: process.env.IDENTITY_SERVICE
  }
  const values = await prompts([
    {
      message: 'rpc endpoint',
      name: 'rpc',
      type: 'text',
      initial: message.rpc
    },
    {
      message: 'registry address',
      name: 'registryAddress',
      type: 'text',
      initial: message.registryAddress
    },
    {
      message: 'private key',
      name: 'pk',
      type: 'text',
      initial: message.privateKey
    },
    {
      message: 'entity manager address',
      name: 'entityManagerAddress',
      type: 'text',
      initial: message.entityManagerAddress
    },
    {
      message: 'title',
      name: 'title',
      type: 'text',
      initial: 'This is an announcement'
    },
    {
      message: 'body',
      name: 'body',
      type: 'text',
      initial: 'Details about announcement'
    }
  ])

  const dataWeb3 = await Utils.configureWeb3(values.rpc, null, false)
  if (!dataWeb3) {
    return
  }

  const wallet = dataWeb3.eth.accounts.privateKeyToAccount(message.privateKey)

  // @ts-ignore
  const audiusInstance = new AudiusLibs({
    identityServiceConfig: AudiusLibs.configIdentityService(
      message.identityService
    ),
    web3Config: {
      registryAddress: values.registryAddress,
      useExternalWeb3: false,
      internalWeb3Config: {
        web3ProviderEndpoints: [values.rpc],
        privateKey: message.privateKey
      },
      entityManagerAddress: values.entityManagerAddress
    },
    isServer: true
  })

  await audiusInstance.init()
  const notification = {
    title: values.title,
    short_description: values.body
  }

  try {
    const res =
      await audiusInstance.contracts.EntityManagerClient!.manageEntity(
        0, // userId
        // @ts-ignore
        'Notification', // EntityManagerClient.EntityType.NOTIFICATION,
        0, // userId
        // @ts-ignore
        'Create', // EntityManagerClient.Action.CREATE,
        JSON.stringify(notification),
        values.pk
      )
    console.log({ res })
  } catch (e) {
    console.log(e)
    console.log('error')
  }
}

main()
