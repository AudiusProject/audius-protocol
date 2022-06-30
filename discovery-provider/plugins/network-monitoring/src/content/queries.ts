

import { QueryTypes } from "sequelize"
import { sequelizeConn } from "../db"
import { retryAsyncFunctionOrError } from "../utils"


export const getAllContentNodes = async (run_id: number): Promise<{ spid: number, endpoint: string }[]> => {

    const endpointsResp: unknown[] = await sequelizeConn.query(`
        SELECT spid, endpoint FROM network_monitoring_content_nodes WHERE run_id = :run_id; 
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id },
    })

    const endpoints = (endpointsResp as { endpoint: string, spid: number }[])!

    return endpoints
}

export const getEndpointToCIDCount = async (run_id: number): Promise<{ spid: number, endpoint: string, cid_count: string }[]> => {
    console.log(`[${run_id}] get endpoint => cidcount mapping`)

    const endpointToCIDCountResp = await sequelizeConn.query(`
        SELECT prejoin.cid_count, cnodes.spid, cnodes.endpoint 
        FROM (
            (
                SELECT COUNT(subquery.cid) as cid_count, subquery.spid as spid
                FROM (
                    SELECT cid, ctype, unnest(array [primaryspid, secondary1spid, secondary2spid]) AS spid
                    FROM (SELECT * FROM network_monitoring_cids_from_discovery WHERE run_id = :run_id AND ctype != 'image') AS cids_current_run
                    RIGHT JOIN (SELECT * FROM network_monitoring_users WHERE run_id = :run_id) AS users_current_run
                    ON cids_current_run.user_id = users_current_run.user_id
                ) AS subquery
                WHERE subquery.spid IS NOT NULL
                GROUP BY subquery.spid
            ) AS prejoin
            JOIN 
            (
                SELECT * FROM network_monitoring_content_nodes WHERE run_id = :run_id
            ) AS cnodes
            ON cnodes.spid = prejoin.spid
        ) 
        ORDER BY cnodes.spid;
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id },
    })

    const endpointToCIDCount = endpointToCIDCountResp as { spid: number, endpoint: string, cid_count: string }[];


    console.log(`[${run_id}] finish getting endpoint => cidcount mapping`)

    return endpointToCIDCount
}

export const getEndpointToImageCIDCount = async (run_id: number): Promise<{ spid: number, endpoint: string, cid_count: string }[]> => {
    console.log(`[${run_id}] get endpoint => imageCidcount mapping`)

    const endpointToCIDCountResp = await sequelizeConn.query(`
        SELECT prejoin.cid_count, cnodes.spid, cnodes.endpoint 
        FROM (
            (
                SELECT COUNT(subquery.cid) as cid_count, subquery.spid as spid
                FROM (
                    SELECT cid, ctype, unnest(array [primaryspid, secondary1spid, secondary2spid]) AS spid
                    FROM (SELECT * FROM network_monitoring_cids_from_discovery WHERE run_id = :run_id AND ctype = 'image') AS cids_current_run
                    RIGHT JOIN (SELECT * FROM network_monitoring_users WHERE run_id = :run_id) AS users_current_run
                    ON cids_current_run.user_id = users_current_run.user_id
                ) AS subquery
                WHERE subquery.spid IS NOT NULL
                GROUP BY subquery.spid
            ) AS prejoin
            JOIN 
            (
                SELECT * FROM network_monitoring_content_nodes WHERE run_id = :run_id
            ) AS cnodes
            ON cnodes.spid = prejoin.spid
        )
        ORDER BY cnodes.spid;
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id }
    })

    const endpointToCIDCount = endpointToCIDCountResp as { spid: number, endpoint: string, cid_count: string }[];

    console.log(`[${run_id}] finish getting endpoint => imageCidcount mapping`)

    return endpointToCIDCount
}

export const getCIDBatch = async (
    run_id: number,
    endpoint: string,
    offset: number,
    limit: number
): Promise<{ cid: string, user_id: number }[]> => {
    console.log(`[${run_id}:${endpoint}] get batch - offset: ${offset}, limit: ${limit}`)

    try {

        const cidBatch: { cid: string, user_id: number }[] = await retryAsyncFunctionOrError(5, async (): Promise<{ cid: string, user_id: number }[]> => {
            const cidBatchResp = await sequelizeConn.query(`
            SELECT user_id, cid, endpoint 
            FROM (
                SELECT cids_current_run.user_id as user_id, cid, unnest(string_to_array(replica_set, ',')) as endpoint
                FROM (
                    SELECT * FROM network_monitoring_cids_from_discovery WHERE run_id = :run_id
                ) AS cids_current_run
                JOIN (
                SELECT * FROM network_monitoring_users WHERE run_id = :run_id
                ) AS users_current_run
                ON cids_current_run.user_id = users_current_run.user_id
                WHERE ctype != 'image'
            ) as cid_batch
            WHERE endpoint = :endpoint
            ORDER BY cid
            OFFSET :offset
            LIMIT :limit;
        `, {
                replacements: { run_id, endpoint, offset, limit },
                type: QueryTypes.SELECT,
            })

            const cidBatch = (cidBatchResp as { cid: string, user_id: number }[]).map(reqObject => {
                return { cid: reqObject.cid, user_id: reqObject.user_id }
            })

            return cidBatch
        })

        return cidBatch
    } catch (e) {
        console.log(`[getCIDBatch:${endpoint}:${offset}:${limit}] error - ${(e as Error).message}`)
        return []
    }
}

export const getImageCIDBatch = async (
    run_id: number,
    endpoint: string,
    offset: number,
    limit: number
): Promise<{ cid: string, user_id: number }[]> => {
    console.log(`[${run_id}:${endpoint}] get image batch - offset: ${offset}, limit: ${limit}`)

    try {

        const cidBatch: { cid: string, user_id: number }[] = await retryAsyncFunctionOrError(5, async (): Promise<{ cid: string, user_id: number }[]> => {
            const cidBatchResp = await sequelizeConn.query(`
                SELECT user_id, cid, endpoint 
                FROM (
                    SELECT cids_current_run.user_id as user_id, cid, unnest(string_to_array(replica_set, ',')) as endpoint
                    FROM (
                        SELECT * FROM network_monitoring_cids_from_discovery WHERE run_id = :run_id
                    ) AS cids_current_run
                    JOIN (
                    SELECT * FROM network_monitoring_users WHERE run_id = :run_id
                    ) AS users_current_run
                    ON cids_current_run.user_id = users_current_run.user_id
                    WHERE ctype = 'image'
                ) as cid_batch
                WHERE endpoint = :endpoint
                ORDER BY cid
                OFFSET :offset
                LIMIT :limit;
        `, {
                replacements: { run_id, endpoint, offset, limit },
                type: QueryTypes.SELECT,
            })

            const cidBatch = (cidBatchResp as { cid: string, user_id: number }[]).map(reqObject => {
                return { cid: reqObject.cid, user_id: reqObject.user_id }
            })

            return cidBatch
        })

        return cidBatch
    } catch (e) {
        console.log(`[getImageCIDBatch:${endpoint}:${offset}:${limit}] error - ${(e as Error).message}`)
        return []
    }
}

export const saveCIDResults = async (
    run_id: number,
    spid: number,
    cidBatch: { cid: string, user_id: number }[],
    results: boolean[]
) => {

    console.log(`[${run_id}:${spid}] saving batch [size:${cidBatch.length}]`)

    try {
        await Promise.all(
            cidBatch.map(async (item, i) => {

                try {
                    const cid = item.cid
                    const user_id = item.user_id

                    const exists = results[i]

                    if (exists) {
                        await sequelizeConn.query(`
                    INSERT INTO network_monitoring_cids_from_content (
                        cid, 
                        run_id,
                        user_id,
                        content_node_spid
                    ) VALUES (
                        :cid,
                        :run_id,
                        :user_id, 
                        :spid
                    );
                `, {
                            replacements: { run_id, cid, user_id, spid },
                            logging: false,
                        })
                    }
                } catch (e) {
                    console.log(`[${run_id}:${spid}:saveBatch] error saving cid - ${(e as Error).message}`)
                    return
                }
            })
        )
    } catch (e) {
        console.log(`[${run_id}:${spid}:saveBatch] error saving batch - ${(e as Error).message}`)
        return
    }
}

export const getUserCounts = async (run_id: number, spid: number): Promise<[number, number, number]> => {

    console.log(`[${run_id}:${spid}] get user counts`)

    const userCountsResp: unknown[] = await sequelizeConn.query(`
        SELECT primary_group.spid as spid, primary_count, secondary1_count, secondary2_count
        FROM (
            (
                SELECT primaryspid AS spid, COUNT(*) AS primary_count
                FROM network_monitoring_users 
                WHERE run_id = :run_id
                GROUP BY primaryspid
            ) as primary_group
            JOIN 
            (
                SELECT secondary1spid AS spid, COUNT(*) AS secondary1_count 
                FROM network_monitoring_users 
                WHERE run_id = :run_id
                GROUP BY secondary1spid
            ) secondary1_group
            ON primary_group.spid = secondary1_group.spid
            JOIN
            (
                SELECT secondary2spid AS spid, COUNT(*) AS secondary2_count 
                FROM network_monitoring_users 
                WHERE run_id = :run_id
                GROUP BY secondary2spid
            ) secondary2_group
            ON primary_group.spid = secondary2_group.spid
        )
        WHERE primary_group.spid = :spid;
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id, spid },
    })

    const userCounts = (userCountsResp as {
        spid: number,
        primary_count: number,
        secondary1_count: number,
        secondary2_count: number,
    }[])[0] || { primary_count: 0, secondary1_count: 0, secondary2_count: 0 }

    return [userCounts.primary_count, userCounts.secondary1_count, userCounts.secondary2_count]
}

export const getPrimaryWalletBatch = async (
    run_id: number,
    spid: number,
    offset: number,
    limit: number,
): Promise<string[]> => {
    const walletBatchResp: unknown[] = await sequelizeConn.query(`
        SELECT wallet 
        FROM network_monitoring_users
        WHERE run_id = :run_id
        AND primaryspid = :spid
        OFFSET :offset
        LIMIT :limit;
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id, spid, offset, limit }
    })

    const walletBatch = (walletBatchResp as { wallet: string }[]).map(item => item.wallet)

    return walletBatch
}

export const getSecondary1WalletBatch = async (
    run_id: number,
    spid: number,
    offset: number,
    limit: number,
): Promise<string[]> => {
    const walletBatchResp: unknown[] = await sequelizeConn.query(`
    SELECT wallet 
    FROM network_monitoring_users
    WHERE run_id = :run_id
    AND secondary1spid = :spid
    OFFSET :offset
    LIMIT :limit;
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id, spid, limit, offset }
    })

    const walletBatch = (walletBatchResp as { wallet: string }[]).map(item => item.wallet)

    return walletBatch
}


export const getSecondary2WalletBatch = async (
    run_id: number,
    spid: number,
    offset: number,
    limit: number,
): Promise<string[]> => {
    const walletBatchResp: unknown[] = await sequelizeConn.query(`
    SELECT wallet 
    FROM network_monitoring_users
    WHERE run_id = :run_id
    AND secondary2spid = :spid
    OFFSET :offset
    LIMIT :limit;
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id, spid, limit, offset }
    })

    const walletBatch = (walletBatchResp as { wallet: string }[]).map(item => item.wallet)

    return walletBatch
}


export const savePrimaryUserResults = async (
    run_id: number,
    spid: number,
    results: { walletPublicKey: string, clock: number }[],
): Promise<number> => {

    try {
        const queryStr = `UPDATE network_monitoring_users as nm_users
                    SET primary_clock_value = tmp.clock::text::int
                    FROM (
                        VALUES 
                            ${formatUserValues(run_id, results)}
                    ) AS tmp(run_id, wallet, clock)
                    WHERE nm_users.wallet = tmp.wallet::text
                    AND nm_users.run_id::text = tmp.run_id::text;`

        await sequelizeConn.query(queryStr, {
            type: QueryTypes.UPDATE,
        })

    } catch (e) {
        console.log(`[${run_id}:${spid}:saveUserResults] error saving batch - ${(e as Error).message}`)
        return results.length
    }

    return 0
}


export const saveSecondary1UserResults = async (
    run_id: number,
    spid: number,
    results: { walletPublicKey: string, clock: number }[],
): Promise<number> => {
    try {
        await sequelizeConn.query(`
                    UPDATE network_monitoring_users as nm_users
                    SET secondary1_clock_value = tmp.clock::text::int
                    FROM (
                        VALUES 
                            ${formatUserValues(run_id, results)}
                    ) AS tmp(run_id, wallet, clock)
                    WHERE nm_users.wallet = tmp.wallet::text
                    AND nm_users.run_id::text = tmp.run_id::text;
                `, {
            type: QueryTypes.UPDATE,
            replacements: { run_id },
        })

    } catch (e) {
        console.log(`[${run_id}:${spid}:saveUserResults] error saving batch - ${(e as Error).message}`)
        return results.length
    }

    return 0
}

export const saveSecondary2UserResults = async (
    run_id: number,
    spid: number,
    results: { walletPublicKey: string, clock: number }[],
): Promise<number> => {

    try {
        const queryStr = `
                    UPDATE network_monitoring_users as nm_users
                    SET secondary2_clock_value = tmp.clock::text::int
                    FROM (
                        VALUES 
                            ${formatUserValues(run_id, results)}
                    ) AS tmp(run_id, wallet, clock)
                    WHERE nm_users.wallet = tmp.wallet::text
                    AND nm_users.run_id::text = tmp.run_id::text;
                `

        await sequelizeConn.query(queryStr, {
            type: QueryTypes.UPDATE,
            replacements: { run_id },
        })

    } catch (e) {
        console.log(`[${run_id}:${spid}:saveUserResults] error saving batch - ${(e as Error).message}`)
        return results.length
    }

    return 0
}

const formatUserValues = (run_id: number, results: { walletPublicKey: string, clock: number }[]): string => {
    let formattedStr = ''

    results.forEach((result, i) => {
        if (
            result.walletPublicKey === undefined
            || result.walletPublicKey === null 
            || result.clock === undefined
            || result.clock === null 
        ) {
            return
        }

        if (i === results.length - 1) {
            formattedStr += `(${run_id}, '${result.walletPublicKey}', ${result.clock})\n`
        } else {
            formattedStr += `(${run_id}, '${result.walletPublicKey}', ${result.clock}),\n`
        }
    })

    return formattedStr
}