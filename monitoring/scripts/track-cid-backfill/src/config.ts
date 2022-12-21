
const dotenv = require('dotenv')

let envInitialized = false

export const getEnv = () => {

    const nodeEnv = process.env['NODE_ENV']
    // Initialize ENV if not already initialized
    if (!envInitialized) {
        if (nodeEnv === "production") {
            console.info('[+] running in production (.env.prod)')
            dotenv.config({ path: '.env.prod' })
        } else if (nodeEnv === "staging") {
            console.info('[+] running in staging (.env.stage)')
            dotenv.config({ path: '.env.stage' })
        } else {
            console.info('[+] running locally (.env.stage)')
            dotenv.config({ path: '.env.stage' })
        }

        envInitialized = true
    }


    // const signatureSpID = parseInt(process.env['SIGNATURE_SPID'] || '0')
    // const signatureSPDelegatePrivateKey = process.env['SIGNATURE_SP_DELEGATE_PRIV_KEY'] || ''

    // if (!signatureSpID || !signatureSPDelegatePrivateKey) {
    //     throw new Error('Missing required signature configs')
    // }

    const db = {
        name: process.env['DB_NAME'] || '',
        host: process.env['DB_HOST'] || '',
        port: parseInt(process.env['DB_PORT'] || ''),
        username: process.env['DB_USERNAME'] || '',
        password: process.env['DB_PASSWORD'] || '',
        sql_logger: (process.env['SQL_LOGGING'] || '') in ['T', 't', 'True', 'true', '1']
    }

    return { 
        db, 
        nodeEnv,
        // deregisteredCN, 
        // signatureSpID, 
        // signatureSPDelegatePrivateKey, 
        // foundationNodes,
    }
}