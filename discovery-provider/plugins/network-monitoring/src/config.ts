
const dotenv = require('dotenv')

let envInitialized = false

export const getEnv = () => {

    // Initialize ENV if not already initialized
    if (!envInitialized) {
        const nodeEnv = process.env['NODE_ENV']

        if (nodeEnv === "production") {
            console.info('[+] running in production (.env.prod)')
            dotenv.config({ path: '.env.prod' })
        } else if (nodeEnv === "staging") {
            console.info('[+] running in staging (.env.stage)')
            dotenv.config({ path: '.env.stage' })
        } else {
            console.info('[+] running locally (.env.local)')
            dotenv.config({ path: '.env.local' })

        }

        envInitialized = true
    }


    const deregisteredContentNodesEnv: string = process.env['DEREGISTERED_CONTENT_NODES'] || ''
    const signatureSpID = parseInt(process.env['SIGNATURE_SPID'] || '0')
    const signatureSPDelegatePrivateKey = process.env['SIGNATURE_SP_DELEGATE_PRIV_KEY'] || ''

    const deregisteredCN: string[] = deregisteredContentNodesEnv.split(',')

    if (!signatureSpID || !signatureSPDelegatePrivateKey) {
        throw new Error('Missing required signature configs')
    }

    const db = {
        name: process.env['DB_NAME'] || '',
        host: process.env['DB_HOST'] || '',
        port: parseInt(process.env['DB_PORT'] || ''),
        username: process.env['DB_USERNAME'] || '',
        password: process.env['DB_PASSWORD'] || '',
        sql_logger: (process.env['SQL_LOGGING'] || '') in ['T', 't', 'True', 'true', '1']
    }

    const fdb = {
        name: process.env['FDB_NAME'] || '',
        host: process.env['FDB_HOST'] || '',
        port: process.env['FDB_PORT'] || '',
        username: process.env['FDB_USERNAME'] || '',
        password: process.env['FDB_PASSWORD'] || '',
    }

    const foundationNodesEnv = process.env['FOUNDATION_NODES_SPIDS'] || ''
    const foundationNodes: number[] = foundationNodesEnv.split(',').map(elem => parseInt(elem))

    const pushGatewayUrl = process.env['PUSH_GATEWAY_URL'] || 'http://localhost:9091'

    const slackUrl = process.env['SLACK_URL'] || ''

    const tracingEnabled = process.env['TRACING_ENABLED'] || true
    const collectorUrl = process.env['COLLECTOR_URL'] || ''

    return { 
        db, 
        fdb, 
        deregisteredCN, 
        signatureSpID, 
        signatureSPDelegatePrivateKey, 
        foundationNodes,
        pushGatewayUrl,
        slackUrl,
        tracingEnabled,
        collectorUrl,
    }
}