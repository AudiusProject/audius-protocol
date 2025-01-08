import { log } from '@pedalboard/logger'
import { App } from '@pedalboard/basekit'
import { webServer } from './server'
import { logger } from './logger'
import { createPublicClient, http, HttpTransport, PublicClient } from 'viem'
import { mainnet } from 'viem/chains'
import { Connection } from '@solana/web3.js'
import dotenv from 'dotenv'

dotenv.config()

export type SharedData = {
  ethRpcEndpoint: string
  viemClient: PublicClient<HttpTransport, typeof mainnet>
  solanaRpcEndpoint: string
  solanaConnection: Connection
  port: number
}

const main = async () => {
  const sharedData = {
    solanaRpcEndpoint: process.env.solana_rpc_endpoint!,
    ethRpcEndpoint: process.env.eth_rpc_endpoint!,
    solanaConnection: new Connection(process.env.solana_rpc_endpoint!),
    viemClient: createPublicClient({
      chain: mainnet,
      transport: http(process.env.eth_rpc_endpoint!)
    }),
    port: process.env.port ? parseInt(process.env.port) : 6000
  }
  await new App<SharedData>({ appData: sharedData })
    .task(async (app: App<SharedData>) => {
      const server = webServer(app)
      const port = app.viewAppData().port
      server.listen(
        port,
        () => logger.info({ port },
        'webserver is running')
      )
    })
    .run()
}

;(async () => {
  await main().catch(log)
})()
