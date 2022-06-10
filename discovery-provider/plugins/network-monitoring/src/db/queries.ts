
import { QueryTypes } from "sequelize"
import { sequelizeConn } from "."
import { retryAsyncFunctionOrError } from "../utils"

// ------------------------------------------
// QUERIES FOR INDEXING DISCOVERY NODE
// ------------------------------------------

export const create_new_run = async (): Promise<number> => {
    console.log('[+] starting new run')

    // Get block number
    const latestBlockNumberResp = await sequelizeConn.query(`
        SELECT number FROM blocks WHERE is_current = TRUE LIMIT 1;  
    `, {
        type: QueryTypes.SELECT,
    })

    console.log(`[+] latest block number : `, (latestBlockNumberResp as { number: number }[])[0]!.number)
    const latestBlockNumber = (latestBlockNumberResp[0] as { number: number }).number

    const runs = await sequelizeConn.query(`
        INSERT INTO network_monitoring_index_blocks (
            is_current, 
            blocknumber, 
            is_complete,
            created_at
        ) VALUES (
            TRUE,
            :latestBlockNumber,
            FALSE,
            NOW()
        )
        RETURNING run_id;
    `, {
        type: QueryTypes.INSERT,
        replacements: { latestBlockNumber },
        logging: false,
    })

    // Remove `is_current` from old run
    await sequelizeConn.query(`
        UPDATE network_monitoring_index_blocks 
        SET is_current = FALSE
        WHERE blocknumber != :latestBlockNumber;
    `, {
        replacements: { latestBlockNumber },
        logging: false,
    })

    const run_id: number = (runs[0] as any)[0].run_id
    console.log(`[+] current run id : ${run_id}`)

    return run_id
}

export const import_cn = async (run_id: number) => {
    console.log(`[${run_id}] importing content nodes`)

    await sequelizeConn.query(`
        INSERT INTO network_monitoring_content_nodes (
            spID, 
            endpoint, 
            run_id
        )
        SELECT cnode_sp_id, endpoint, :run_id
        FROM ursm_content_nodes
        WHERE is_current = TRUE;
    `, {
        replacements: { run_id },
        logging: false,
    })
}

export const import_users = async (run_id: number) => {
    console.log(`[${run_id}] importing users`)

    await sequelizeConn.query(`
        INSERT INTO network_monitoring_users (
            user_id, 
            wallet, 
            replica_set, 
            run_id,
            primarySpID, 
            secondary1SpID, 
            secondary2SpID
        )
        SELECT 
            user_id, 
            wallet, 
            creator_node_endpoint as replica_set, 
            :run_id,
            primary_id as primarySpID, 
            secondary_ids[1] as secondary1SpID,
            secondary_ids[2] as secondary2SpID
        FROM users
        WHERE is_current = TRUE;
    `, {
        replacements: { run_id },
        logging: false,
    })
}

export const import_cids_from_dn = async (run_id: number) => {
    console.log(`[${run_id}] importing cids`)

    await sequelizeConn.query(`
        INSERT INTO network_monitoring_cids_from_discovery (cid, run_id, ctype, user_id)
        SELECT metadata_multihash, :run_id, 'metadata', user_id
        FROM users
        WHERE metadata_multihash IS NOT NULL
        AND is_current = TRUE;
            `, {
        replacements: { run_id },
        logging: false,
    })

    console.log(`\t -> users.metadata_multihash`)

    await sequelizeConn.query(`
            INSERT INTO network_monitoring_cids_from_discovery (cid, run_id, ctype, user_id)
            SELECT profile_picture, :run_id, 'image', user_id
            FROM users
            WHERE profile_picture IS NOT NULL
            AND profile_picture != '0'
            AND user_id IS NOT NULL
            AND is_current = TRUE;
                `, {
        replacements: { run_id },
        logging: false,
    })

    console.log(`\t -> users.profile_picture`)

    await sequelizeConn.query(`
        INSERT INTO network_monitoring_cids_from_discovery (cid, run_id, ctype, user_id)
        SELECT profile_picture_sizes, :run_id, 'dir', user_id
        FROM users
        WHERE profile_picture_sizes IS NOT NULL
        AND is_current = TRUE;
            `, {
        replacements: { run_id },
        logging: false,
    })

    console.log(`\t -> users.profile_picture_sizes`)

    await sequelizeConn.query(`
        INSERT INTO network_monitoring_cids_from_discovery (cid, run_id, ctype, user_id)
        SELECT cover_photo, :run_id, 'image', user_id
        FROM users
        WHERE cover_photo IS NOT NULL
        AND is_current = TRUE;
            `, {
        replacements: { run_id },
        logging: false,
    })

    console.log(`\t -> users.cover_photo`)

    await sequelizeConn.query(`
        INSERT INTO network_monitoring_cids_from_discovery (cid, run_id, ctype, user_id)
        SELECT cover_photo_sizes, :run_id, 'dir', user_id 
        FROM users 
        WHERE cover_photo_sizes IS NOT NULL
        AND is_current = TRUE;
            `, {
        replacements: { run_id },
        logging: false,
    })

    console.log(`\t -> users.cover_photo_sizes`)

    await sequelizeConn.query(`
        INSERT INTO network_monitoring_cids_from_discovery (cid, run_id, ctype, user_id)
        SELECT cover_art, :run_id, 'image', owner_id
        FROM tracks
        WHERE cover_art IS NOT NULL
        AND is_current = TRUE;
            `, {
        replacements: { run_id },
        logging: false,
    })

    console.log(`\t -> tracks.cover_art`)

    await sequelizeConn.query(`
        INSERT INTO network_monitoring_cids_from_discovery (cid, run_id, ctype, user_id)
        SELECT cover_art_sizes, :run_id, 'dir', owner_id
        FROM tracks 
        WHERE cover_art_sizes IS NOT NULL
        AND is_current = TRUE;
            `, {
        replacements: { run_id },
        logging: false,
    })

    console.log(`\t -> tracks.cover_art_sizes`)

    await sequelizeConn.query(`
        INSERT INTO network_monitoring_cids_from_discovery (cid, run_id, ctype, user_id)
        SELECT metadata_multihash, :run_id, 'metadata', owner_id
        FROM tracks 
        WHERE metadata_multihash IS NOT NULL
        AND is_current = TRUE;
            `, {
        replacements: { run_id },
        logging: false,
    })

    console.log(`\t -> tracks.metadata_multihash`)

    await sequelizeConn.query(`
        INSERT INTO network_monitoring_cids_from_discovery (cid, run_id, ctype, user_id)
        SELECT download -> 'cid' as cid, :run_id, 'track', owner_id
        FROM tracks 
        WHERE download -> 'cid' != 'null'
        AND is_current = TRUE;
            `, {
        replacements: { run_id },
        logging: false,
    })

    console.log(`\t -> tracks.download->'cid'`)

    await sequelizeConn.query(`
        INSERT INTO network_monitoring_cids_from_discovery (cid, run_id, ctype, user_id)
        SELECT 
            jsonb_array_elements(track_segments) -> 'multihash', 
            :run_id, 
            'track',
            owner_id
        FROM tracks
        WHERE track_segments IS NOT NULL
        AND is_current = TRUE;
    `, {
        replacements: { run_id },
        logging: false,
    })

    console.log(`\t -> tracks.track_segments->'multihash'`)
}

// ------------------------------------------
// QUERIES FOR INDEXING CONTENT NODE
// ------------------------------------------

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
        replacements: { run_id, spid, limit, offset }
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
): Promise<void> => {
    try {
        await Promise.all(
            results.map(async ({ walletPublicKey, clock }) => {
                try {
                    await sequelizeConn.query(`
                        UPDATE network_monitoring_users
                        SET primary_clock_value = :clock
                        WHERE wallet = :walletPublicKey
                        AND run_id = :run_id;
                `, {
                        type: QueryTypes.UPDATE,
                        replacements: { run_id, walletPublicKey, clock }
                    })
                } catch (e) {
                    console.log(`[${run_id}:${spid}] error saving clock value (${clock}) to ${walletPublicKey} - ${(e as Error).message}`)
                    return
                }
            })
        )
    } catch (e) {
        console.log(`[${run_id}:${spid}:saveUserResults] error saving batch - ${(e as Error).message}`)
        return
    }

    return
}

export const saveSecondary1UserResults = async (
    run_id: number,
    spid: number,
    results: { walletPublicKey: string, clock: number }[],
): Promise<void> => {
    try {
        await Promise.all(
            results.map(async ({ walletPublicKey, clock }) => {
                await sequelizeConn.query(`
                    UPDATE network_monitoring_users
                    SET secondary1_clock_value = :clock
                    WHERE wallet = :walletPublicKey
                    AND run_id = :run_id;
                `, {
                    type: QueryTypes.UPDATE,
                    replacements: { run_id, walletPublicKey, clock }
                })
            })
        )
    } catch (e) {
        console.log(`[${run_id}:${spid}:saveUserResults] error saving batch - ${(e as Error).message}`)
        return
    }

    return
}

export const saveSecondary2UserResults = async (
    run_id: number,
    spid: number,
    results: { walletPublicKey: string, clock: number }[],
): Promise<void> => {
    try {
        await Promise.all(
            results.map(async ({ walletPublicKey, clock }) => {
                await sequelizeConn.query(`
                    UPDATE network_monitoring_users
                    SET secondary2_clock_value = :clock
                    WHERE wallet = :walletPublicKey
                    AND run_id = :run_id;
                `, {
                    type: QueryTypes.UPDATE,
                    replacements: { run_id, walletPublicKey, clock }
                })
            })
        )
    } catch (e) {
        console.log(`[${run_id}:${spid}:saveUserResults] error saving batch - ${(e as Error).message}`)
        return
    }

    return
}

// ------------------------------------------
// QUERIES FOR INDEXING CONTENT NODE
// ------------------------------------------
/* 
- he number of CID on each CN that have been replicated at least once
- The number of CID on each CN that have ***NOT*** been replicated at least once
- [ex 1] **The number of users with a specific CN as their primary**
- The number of users with a specific CN in their replica set
- CID replication across the CNs
- CID replication factor
- The number of users with their data syncs across 0, 1, 2, or 3 CNs
*/

export const getCidsReplicatedAtLeastOnce = async (run_id: number): Promise<{ content_node_spid: string, cid_count: number }[]> => {

    const cidsListResp = await sequelizeConn.query(`
        SELECT content_node_spid, COUNT(*) as cid_count
        FROM 
            (SELECT * FROM network_monitoring_cids_from_content WHERE run_id = :run_id)
        JOIN (
            SELECT cid, COUNT(content_node_spid) as spid_count 
            FROM network_monitoring_cids_from_content
            WHERE run_id = :run_id
            GROUP BY 
                cid
        ) as cids_to_cn_count
        ON
            network_monitoring_cids_from_content.cid = cids_to_cn_count.cid
        WHERE
            spid_count >= 2
        GROUP BY 
            content_node_spid;
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id },
    })

    const cids = (cidsListResp as { content_node_spid: string, cid_count: number }[])

    return cids
}

export const getPrimaryUserCount = async (run_id: number): Promise<{ endpoint: string, count: number }[]> => {

    console.log(`[${run_id}] metric: primary user count`);
    const primaryCountResp: unknown[] = await sequelizeConn.query(`
        SELECT 
            joined.endpoint, COUNT(*) 
        FROM (
            (SELECT * FROM network_monitoring_users WHERE run_id = :run_id) AS current_users
        JOIN
            (SELECT * FROM network_monitoring_content_nodes WHERE run_id = :run_id) AS cnodes
        ON
            current_users.primaryspid = cnodes.spid
        ) AS joined
        GROUP BY 
            joined.endpoint
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id }
    })


    const primaryCount = (primaryCountResp as { endpoint: string, count: string }[]).map(({ endpoint, count }) => {
        return { endpoint, count: parseInt(count) }
    })

    return primaryCount
}

export const getAllUserCount = async (run_id: number): Promise<{ endpoint: string, count: number }[]> => {
    console.log(`[${run_id}] metric: all user count`);
    const userListResp: unknown[] = await sequelizeConn.query(`
        SELECT joined.endpoint, COUNT(*) 
        FROM (
            (SELECT * FROM network_monitoring_content_nodes WHERE run_id = :run_id) AS cnodes
        JOIN
        (
            SELECT user_id, unnest(string_to_array(replica_set, ',')) AS user_endpoint 
            FROM network_monitoring_users
            WHERE run_id = :run_id
        ) as unnested_users
        ON
            cnodes.endpoint = unnested_users.user_endpoint
        ) AS joined
        GROUP BY 
            joined.endpoint;
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id },
    })

    const userList = await (userListResp as { endpoint: string, count: string }[]).map(({ endpoint, count }) => {
        return { endpoint, count: parseInt(count) }
    })

    return userList
}

export const getCidReplicationFactor = async (run_id: number): Promise<number> => {
    const replicationFactorResp: unknown[] = await sequelizeConn.query(`
        SELECT AVG(cid_counts.count) 
        FROM (
            (
                SELECT cid, COUNT(*) AS count 
                FROM network_monitoring_cids_from_content
                WHERE run_id = :run_id
                GROUP BY cid
            )
            UNION
            (
                SELECT set_diff.cid, 0 AS count 
                FROM (
                    SELECT network_monitoring_cids_from_discovery.cid 
                    FROM (SELECT * FROM network_monitoring_cids_from_discovery WHERE run_id = :run_id
                    LEFT JOIN (SELECT * FROM network_monitoring_cids_from_content WHERE run_id = :run_id)
                    ON network_monitoring_cids_from_discovery.cid = network_monitoring_cids_from_content.cid
                    WHERE network_monitoring_cids_from_content IS NULL
                ) as set_diff
            )
        ) as cid_counts; 
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id }
    })

    const replicationFactor = await (replicationFactorResp as number[])[0] || 0

    return replicationFactor
}

export const getFullySyncedUsersCount = async (run_id: number): Promise<number> => {
    const usersResp: unknown[] = await sequelizeConn.query(`
        SELECT COUNT(*) as user_count
        FROM network_monitoring_users
        WHERE
            run_id = :run_id
        AND 
            primary_clock_value IS NOT NULL
        AND
            primary_clock_value = secondary1_clock_value
        AND
            secondary1_clock_value = secondary2_clock_value;
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id },
    })

    const usersCount = parseInt(((usersResp as { user_count: string }[])[0] || { user_count: '0' }).user_count)

    return usersCount
}
