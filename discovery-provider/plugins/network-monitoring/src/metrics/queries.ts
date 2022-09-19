
import { QueryTypes } from "sequelize"
import { sequelizeConn } from "../db"

/*
 * Metrics from the discovery DB
 *
 * These metrics are primarily used to make prometheus
 * and grafana more readable/understandable
 */ 

// Get the current user count from discovery nodes
export const getUserCount = async (run_id: number): Promise<number> => {

    const usersResp: unknown[] = await sequelizeConn.query(`
    SELECT COUNT(*) as user_count
    FROM network_monitoring_users
    WHERE run_id = :run_id
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id },
    })

    const usersCount = parseInt(((usersResp as { user_count: string }[])[0] || { user_count: '0' }).user_count)

    return usersCount
}

/* 
 * Core metrics
 */

export const getRunStartTime = async (run_id: number): Promise<Date> => {
    const runStartTimeResp: unknown[] = await sequelizeConn.query(`
        SELECT created_at
        FROM 
            network_monitoring_index_blocks
        WHERE
            run_id = :run_id 
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id }
    })

    const runStartTimeStr = runStartTimeResp[0] as string
    const runStartTime = new Date(runStartTimeStr)

    return runStartTime
}

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

// Count of users who have a specific content node in their replica set 
// This is different from `getUserCount()` which literally just gets the number of users on Audius
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

// The number of users whose primary content node is in sync 
// with all of their secondary content nodes in their replica set
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

// The number of users whose primary content node is only in sync
// with one of their secondary content nodes in their replica set
export const getPartiallySyncedUsersCount = async (run_id: number): Promise<number> => {
    const usersResp: unknown[] = await sequelizeConn.query(`
        SELECT COUNT(*) as user_count
        FROM network_monitoring_users
        WHERE 
            run_id = :run_id
        AND 
            primary_clock_value IS NOT NULL
        AND ( 
            primary_clock_value = secondary1_clock_value
            OR
            primary_clock_value = secondary2_clock_value
        )
        AND 
            secondary1_clock_value != secondary2_clock_value;
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id },
    })

    const usersCount = parseInt(((usersResp as { user_count: string }[])[0] || { user_count: '0' }).user_count)

    return usersCount
}

// The number of users whose primary content node isn't in sync 
// with any of their other secondary content nodes in their replica set
export const getUnsyncedUsersCount = async (run_id: number): Promise<number> => {
    const usersResp: unknown[] = await sequelizeConn.query(`
        SELECT COUNT(*) as user_count
        FROM network_monitoring_users
        WHERE 
            run_id = :run_id
        AND 
            primary_clock_value IS NOT NULL
        AND 
            primary_clock_value != secondary1_clock_value
        AND
            primary_clock_value != secondary2_clock_value;
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id },
    })

    const usersCount = parseInt(((usersResp as { user_count: string }[])[0] || { user_count: '0' }).user_count)

    return usersCount
}

// The number of users whose primary content node clock value is null
export const getUsersWithNullPrimaryClock = async (run_id: number): Promise<number> => {
    const usersResp: unknown[] = await sequelizeConn.query(`
    SELECT COUNT(*) as user_count
    FROM network_monitoring_users
    WHERE 
        run_id = :run_id
    AND 
        primary_clock_value IS NULL;
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id },
    })

    const usersCount = parseInt(((usersResp as { user_count: string }[])[0] || { user_count: '0' }).user_count)

    return usersCount
}

export const getUsersWithEntireReplicaSetInSpidSetCount = async (run_id: number, spidSet: number[]): Promise<number> => {

    const spidSetStr = `{${spidSet.join(",")}}`

    const usersResp: unknown[] = await sequelizeConn.query(`
    SELECT COUNT(*) as user_count
    FROM network_monitoring_users
    WHERE
        run_id = :run_id
    AND 
        primaryspid = ANY( :spidSetStr )
    AND
        secondary1spid = ANY( :spidSetStr )
    AND 
        secondary2spid = ANY( :spidSetStr );
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id, spidSetStr },
    })

    const usersCount = parseInt(((usersResp as { user_count: string }[])[0] || { user_count: '0' }).user_count)

    return usersCount
}
