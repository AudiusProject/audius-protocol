import { cleanEnv, str, email, json } from "envalid"

type S3Config = {
    region: string
    endpoint: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    keyPrefix: string
}

type Config = {
    env: string
    dbUrl: string
    s3Configs: S3Config[]
}

let config: Config | null = null

export const readConfig = (): Config => {
    if (config !== null) return config

    const env = cleanEnv(process.env, {
        audius_discprov_env: str({ default: "dev" }),
        audius_db_url: str({ default: "postgresql://postgres:pass@0.0.0.0:5433/default_db" }),

        // internal audius managed bucket for backups
        // defaults to localstack
        audius_mri_internal_region: str({ default: "us-east-1" }),
        audius_mri_internal_endpoint: str({ default: "http://localhost:4566" }),
        audius_mri_internal_access_key_id: str({ default: "test" }),
        audius_mri_internal_secret_access_key: str({ default: "test" }),
        audius_mri_internal_bucket: str({ default: "audius-clm-internal-data"}),
        audius_mri_internal_key_prefix: str({ default: "Audius_CLM_"}),

        // mri managed bucket for reporting
        // defaults to a separate localstack
        audius_mri_external_region: str({ default: "us-east-1" }),
        audius_mri_external_endpoint: str({ default: "http://localhost:4566" }),
        audius_mri_external_access_key_id: str({ default: "test" }),
        audius_mri_external_secret_access_key: str({ default: "test" }),
        audius_mri_external_bucket: str({ default: "audius-clm-data"}),
        audius_mri_external_key_prefix: str({ default: "Audius_CLM_"}),
    })

    const internalS3Config: S3Config = {
        region: env.audius_mri_internal_region,
        endpoint: env.audius_mri_internal_endpoint,
        accessKeyId: env.audius_mri_internal_access_key_id,
        secretAccessKey: env.audius_mri_internal_secret_access_key,
        bucket: env.audius_mri_internal_bucket,
        keyPrefix: env.audius_mri_internal_key_prefix
    }

    const externalS3Config: S3Config = {
        region: env.audius_mri_external_region,
        endpoint: env.audius_mri_external_endpoint,
        accessKeyId: env.audius_mri_external_access_key_id,
        secretAccessKey: env.audius_mri_external_secret_access_key,
        bucket: env.audius_mri_external_bucket,
        keyPrefix: env.audius_mri_external_key_prefix
    }

    config = {
        env: env.audius_discprov_env,
        dbUrl: env.audius_db_url,
        s3Configs: [internalS3Config, externalS3Config],
    }

    return readConfig()
}
