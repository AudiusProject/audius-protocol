
import { QueryTypes } from "sequelize"
import { sequelizeConn } from "../db"
import { instrumentTracing, tracing } from "../tracer"

/*
 * Metrics from the discovery DB
 *
 * These metrics are primarily used to make prometheus
 * and grafana more readable/understandable
 */

// Get the current user count from discovery nodes
const _getUserCount = async (run_id: number): Promise<number> => {

    try {
        const usersResp: unknown[] = await sequelizeConn.query(`
    SELECT COUNT(*) as user_count
    FROM network_monitoring_users
    WHERE run_id = :run_id
    `,
            {
                type: QueryTypes.SELECT,
                replacements: { run_id },
            }
        );

        const usersCount = parseInt(
            ((usersResp as { user_count: string }[])[0] || { user_count: "0" })
                .user_count
        );

        return usersCount;
    } catch (e: any) {
        tracing.recordException(e)
        return 0
    }
};

export const getUserCount = instrumentTracing({
    fn: _getUserCount,
})

/* 
 * Core metrics
 */

const _getRunStartTime = async (run_id: number): Promise<Date> => {
    try {
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

        const runStartTimeStr = (runStartTimeResp[0] as { created_at: string }).created_at as string
        const runStartTime = new Date(runStartTimeStr)

        return runStartTime
    } catch (e: any) {
        tracing.recordException(e)
        return new Date()
    }
}

export const getRunStartTime = instrumentTracing({
    fn: _getRunStartTime,
})

const _getCidsReplicatedAtLeastOnce = async (run_id: number): Promise<{ content_node_spid: string, cid_count: number }[]> => {

    try {
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
    } catch (e: any) {
        tracing.recordException(e)
        return []
    }
}

export const getCidsReplicatedAtLeastOnce = instrumentTracing({
    fn: _getCidsReplicatedAtLeastOnce,
})

const _getPrimaryUserCount = async (run_id: number): Promise<{ endpoint: string, count: number }[]> => {

    try {
        tracing.info(`[${run_id}] metric: primary user count`);
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
    } catch (e: any) {
        tracing.recordException(e)
        return []
    }
}

export const getPrimaryUserCount = instrumentTracing({
    fn: _getPrimaryUserCount,
})

// Count of users who have a specific content node in their replica set 
// This is different from `getUserCount()` which literally just gets the number of users on Audius
const _getAllUserCount = async (run_id: number): Promise<{ endpoint: string, count: number }[]> => {
    try {
        tracing.info(`[${run_id}] metric: all user count`);
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
    } catch (e: any) {
        tracing.recordException(e)
        return []
    }
}

export const getAllUserCount = instrumentTracing({
    fn: _getAllUserCount,
})

const _getCidReplicationFactor = async (run_id: number): Promise<number> => {
    try {
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
    `,
            {
                type: QueryTypes.SELECT,
                replacements: { run_id },
            }
        );

        const replicationFactor = (await (replicationFactorResp as number[])[0]) || 0;

        return replicationFactor;
    } catch (e: any) {
        tracing.recordException(e)
        return 0
    }
};

export const getCidReplicationFactor = instrumentTracing({
    fn: _getCidReplicationFactor,
})

// The number of users whose primary content node is in sync 
// with all of their secondary content nodes in their replica set
const _getFullySyncedUsersCount = async (run_id: number): Promise<number> => {
    try {
        const usersResp: unknown[] = await sequelizeConn.query(`
        SELECT COUNT(*) as user_count
        FROM network_monitoring_users
        WHERE
            run_id = :run_id
        AND 
            primary_clock_value IS NOT NULL
        AND 
            primary_clock_value != -2
        AND
            primary_clock_value = secondary1_clock_value
        AND
            secondary1_clock_value = secondary2_clock_value;
    `,
            {
                type: QueryTypes.SELECT,
                replacements: { run_id },
            }
        );

        const usersCount = parseInt(
            ((usersResp as { user_count: string }[])[0] || { user_count: "0" })
                .user_count
        );

        return usersCount;
    } catch (e: any) {
        tracing.recordException(e)
        return 0
    }
};

export const getFullySyncedUsersCount = instrumentTracing({
    fn: _getFullySyncedUsersCount,
})

// The number of users whose primary content node is only in sync
// with one of their secondary content nodes in their replica set
const _getPartiallySyncedUsersCount = async (run_id: number): Promise<number> => {
    try {
        const usersResp: unknown[] = await sequelizeConn.query(`
        SELECT COUNT(*) as user_count
        FROM network_monitoring_users
        WHERE 
            run_id = :run_id
        AND 
            primary_clock_value IS NOT NULL
        AND 
            primary_clock_value != -2
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
    } catch (e: any) {
        tracing.recordException(e)
        return 0
    }
}

export const getPartiallySyncedUsersCount = instrumentTracing({
    fn: _getPartiallySyncedUsersCount,
})

// The number of users whose primary content node isn't in sync 
// with any of their other secondary content nodes in their replica set
const _getUnsyncedUsersCount = async (run_id: number): Promise<number> => {
    try {
        const usersResp: unknown[] = await sequelizeConn.query(`
        SELECT COUNT(*) as user_count
        FROM network_monitoring_users
        WHERE 
            run_id = :run_id
        AND 
            primary_clock_value IS NOT NULL
        AND 
            primary_clock_value != -2
        AND 
            primary_clock_value != secondary1_clock_value
        AND
            primary_clock_value != secondary2_clock_value;
    `,
            {
                type: QueryTypes.SELECT,
                replacements: { run_id },
            }
        );

        const usersCount = parseInt(
            ((usersResp as { user_count: string }[])[0] || { user_count: "0" })
                .user_count
        );

        return usersCount;
    } catch (e: any) {
        tracing.recordException(e)
        return 0
    }
};

export const getUnsyncedUsersCount = instrumentTracing({
    fn: _getUnsyncedUsersCount,
})

// The number of users whose primary content node clock value is null
const _getUsersWithNullPrimaryClock = async (run_id: number): Promise<number> => {
    try {
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
    } catch (e: any) {
        tracing.recordException(e)
        return 0
    }
}

export const getUsersWithNullPrimaryClock = instrumentTracing({
    fn: _getUsersWithNullPrimaryClock,
})

// The number of users who have a recorded clock value of -2
const _getUsersWithUnhealthyReplica = async (run_id: number): Promise<number> => {
    try {
        const usersResp: unknown[] = await sequelizeConn.query(`
    SELECT COUNT(*) as user_count
    FROM network_monitoring_users
    WHERE 
        run_id = :run_id
    AND (
        primary_clock_value = -2
        OR
        secondary1_clock_value = -2
        OR 
        secondary2_clock_value = -2
    );
    `, {
            type: QueryTypes.SELECT,
            replacements: { run_id },
        })

        const usersCount = parseInt(((usersResp as { user_count: string }[])[0] || { user_count: '0' }).user_count)

        return usersCount
    } catch (e: any) {
        tracing.recordException(e)
        return 0
    }
}

export const getUsersWithUnhealthyReplica = instrumentTracing({
    fn: _getUsersWithUnhealthyReplica,
})

const _getUsersWithEntireReplicaSetInSpidSetCount = async (run_id: number, spidSet: number[]): Promise<number> => {
    try {

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
    `,
            {
                type: QueryTypes.SELECT,
                replacements: { run_id, spidSetStr },
            }
        );

        const usersCount = parseInt(
            ((usersResp as { user_count: string }[])[0] || { user_count: "0" })
                .user_count
        );

        return usersCount;
    } catch (e: any) {
        tracing.recordException(e)
        return 0
    }
};

export const getUsersWithEntireReplicaSetInSpidSetCount = instrumentTracing({
    fn: _getUsersWithEntireReplicaSetInSpidSetCount,
})

const _getUsersWithEntireReplicaSetNotInSpidSetCount = async (
    run_id: number,
    spidSet: number[]
): Promise<number> => {
    try {
        const spidSetStr = `{${spidSet.join(",")}}`;

        const usersResp: unknown[] = await sequelizeConn.query(
            `
    SELECT COUNT(*) as user_count
    FROM network_monitoring_users
    WHERE
        run_id = :run_id
    AND 
        primaryspid != ALL( :spidSetStr )
    AND
        secondary1spid != ALL( :spidSetStr )
    AND 
        secondary2spid != ALL( :spidSetStr );
    `,
            {
                type: QueryTypes.SELECT,
                replacements: { run_id, spidSetStr },
            }
        );

        const usersCount = parseInt(
            ((usersResp as { user_count: string }[])[0] || { user_count: "0" })
                .user_count
        );

        return usersCount;
    } catch (e: any) {
        tracing.recordException(e)
        return 0
    }
};

export const getUsersWithEntireReplicaSetNotInSpidSetCount = instrumentTracing({
    fn: _getUsersWithEntireReplicaSetNotInSpidSetCount,
});

const _getUserStatusByPrimary = async (
    run_id: number
): Promise<{
    spid: number;
    endpoint: string;
    fullySyncedCount: number;
    partiallySyncedCount: number;
    unsyncedCount: number;
}[]> => {
    try {
        const userStatusByPrimaryResp: unknown[] = await sequelizeConn.query(
            `
            SELECT fully_synced.spid, cnodes.endpoint, fully_synced.fully_synced_count, partially_synced.partially_synced_count, unsynced.unsynced_count
        FROM (
            SELECT primaryspid AS spid, COUNT(*) as fully_synced_count
            FROM network_monitoring_users
            WHERE
                run_id = :run_id
            AND 
                primary_clock_value IS NOT NULL
            AND
                primary_clock_value = secondary1_clock_value
            AND
                secondary1_clock_value = secondary2_clock_value
            GROUP BY primaryspid
        ) AS fully_synced
        JOIN (
            SELECT primaryspid AS SPID, COUNT(*) AS partially_synced_count
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
                secondary1_clock_value != secondary2_clock_value
            GROUP BY primaryspid
        ) AS partially_synced
        ON fully_synced.spid = partially_synced.spid
        JOIN (
            SELECT primaryspid AS spid, COUNT(*) AS unsynced_count
            FROM network_monitoring_users
            WHERE 
                run_id = :run_id
            AND 
                primary_clock_value IS NOT NULL
            AND 
                primary_clock_value != secondary1_clock_value
            AND
                primary_clock_value != secondary2_clock_value
            GROUP BY primaryspid
        ) AS unsynced
        ON fully_synced.spid = unsynced.spid
        JOIN (
            SELECT spid, endpoint
            FROM network_monitoring_content_nodes
            WHERE
                run_id = :run_id
        ) AS cnodes
        ON cnodes.spid = fully_synced.spid
        ORDER BY fully_synced.spid;
        `,
            {
                type: QueryTypes.SELECT,
                replacements: { run_id },
            }
        );

        const userStatusByPrimary: {
            spid: number;
            endpoint: string;
            fullySyncedCount: number;
            partiallySyncedCount: number;
            unsyncedCount: number;
        }[] = (
            userStatusByPrimaryResp as {
                spid: string;
                endpoint: string;
                fully_synced_count: string;
                partially_synced_count: string;
                unsynced_count: string;
            }[]
        ).map((elem) => {
            return {
                spid: parseInt(elem.spid),
                endpoint: elem.endpoint,
                fullySyncedCount: parseInt(elem.fully_synced_count),
                partiallySyncedCount: parseInt(elem.partially_synced_count),
                unsyncedCount: parseInt(elem.unsynced_count),
            };
        });

        return userStatusByPrimary;
    } catch (e: any) {
        tracing.recordException(e)
        return []
    }
};

export const getUserStatusByPrimary = instrumentTracing({
    fn: _getUserStatusByPrimary,
})

const _getUserStatusByReplica = async (run_id: number): Promise<{
    spid: number;
    endpoint: string;
    fullySyncedCount: number;
    partiallySyncedCount: number;
    unsyncedCount: number;
}[]> => {
    try {
        const userStatusByReplicaResp: unknown[] = await sequelizeConn.query(
            `
        SELECT 
    fully_synced.spid, 
    cnodes.endpoint, 
    fully_synced.fully_synced_count, 
    partially_synced.partially_synced_count, 
    unsynced.unsynced_count
FROM (
    SELECT 
        fully_synced_primary.spid AS spid, 
        (SUM(fully_synced_primary.fully_synced_count) +
        SUM(fully_synced_secondary1.fully_synced_count) +
        SUM(fully_synced_secondary2.fully_synced_count)) AS fully_synced_count
    FROM (
        SELECT primaryspid AS spid, COUNT(*) as fully_synced_count
        FROM network_monitoring_users
        WHERE
            run_id = :run_id
        AND 
            primary_clock_value IS NOT NULL
        AND
            primary_clock_value = secondary1_clock_value
        AND
            secondary1_clock_value = secondary2_clock_value
        GROUP BY primaryspid
    ) AS fully_synced_primary
    JOIN (
        SELECT secondary1spid AS spid, COUNT(*) as fully_synced_count
        FROM network_monitoring_users
        WHERE
            run_id = :run_id
        AND 
            primary_clock_value IS NOT NULL
        AND
            primary_clock_value = secondary1_clock_value
        AND
            secondary1_clock_value = secondary2_clock_value
        GROUP BY secondary1spid
    ) AS fully_synced_secondary1
    ON fully_synced_primary.spid = fully_synced_secondary1.spid
    JOIN (
        SELECT secondary2spid AS spid, COUNT(*) as fully_synced_count
        FROM network_monitoring_users
        WHERE
            run_id = :run_id
        AND 
            primary_clock_value IS NOT NULL
        AND
            primary_clock_value = secondary1_clock_value
        AND
            secondary1_clock_value = secondary2_clock_value
        GROUP BY secondary2spid
    ) AS fully_synced_secondary2
    ON fully_synced_primary.spid = fully_synced_secondary2.spid
    GROUP BY fully_synced_primary.spid
) AS fully_synced
JOIN (
    SELECT 
        partially_synced_primary.spid AS spid, 
        (SUM(partially_synced_primary.partially_synced_count) +
        SUM(partially_synced_secondary1.partially_synced_count) +
        SUM(partially_synced_secondary2.partially_synced_count)) AS partially_synced_count
    FROM (
        SELECT primaryspid AS SPID, COUNT(*) AS partially_synced_count
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
            secondary1_clock_value != secondary2_clock_value
        GROUP BY primaryspid
    ) AS partially_synced_primary
    JOIN (
        SELECT secondary1spid AS SPID, COUNT(*) AS partially_synced_count
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
            secondary1_clock_value != secondary2_clock_value
        GROUP BY secondary1spid
    ) AS partially_synced_secondary1
    ON partially_synced_primary.spid = partially_synced_secondary1.spid
    JOIN (
        SELECT secondary2spid AS SPID, COUNT(*) AS partially_synced_count
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
            secondary1_clock_value != secondary2_clock_value
        GROUP BY secondary2spid
    ) AS partially_synced_secondary2
    ON partially_synced_primary.spid = partially_synced_secondary2.spid
    GROUP BY partially_synced_primary.spid
) AS partially_synced
ON fully_synced.spid = partially_synced.spid
JOIN (
    SELECT 
        unsynced_primary.spid AS spid, 
        (SUM(unsynced_primary.unsynced_count) +
        SUM(unsynced_secondary1.unsynced_count) +
        SUM(unsynced_secondary2.unsynced_count)) AS unsynced_count
    FROM (
        SELECT primaryspid AS spid, COUNT(*) AS unsynced_count
        FROM network_monitoring_users
        WHERE 
            run_id = :run_id
        AND 
            primary_clock_value IS NOT NULL
        AND 
            primary_clock_value != secondary1_clock_value
        AND
            primary_clock_value != secondary2_clock_value
        GROUP BY primaryspid
    ) AS unsynced_primary
    JOIN (
        SELECT secondary1spid AS spid, COUNT(*) AS unsynced_count
        FROM network_monitoring_users
        WHERE 
            run_id = :run_id
        AND 
            primary_clock_value IS NOT NULL
        AND 
            primary_clock_value != secondary1_clock_value
        AND
            primary_clock_value != secondary2_clock_value
        GROUP BY secondary1spid
    ) AS unsynced_secondary1
    ON unsynced_primary.spid = unsynced_secondary1.spid
    JOIN (
        SELECT secondary2spid AS spid, COUNT(*) AS unsynced_count
        FROM network_monitoring_users
        WHERE 
            run_id = :run_id
        AND 
            primary_clock_value IS NOT NULL
        AND 
            primary_clock_value != secondary1_clock_value
        AND
            primary_clock_value != secondary2_clock_value
        GROUP BY secondary2spid
    ) AS unsynced_secondary2
    ON unsynced_primary.spid = unsynced_secondary2.spid
    GROUP BY unsynced_primary.spid
) AS unsynced
ON fully_synced.spid = unsynced.spid
JOIN (
    SELECT spid, endpoint
    FROM network_monitoring_content_nodes
    WHERE
        run_id = :run_id 
) AS cnodes
ON cnodes.spid = fully_synced.spid
ORDER BY fully_synced.spid;
            `,
            {
                type: QueryTypes.SELECT,
                replacements: { run_id },
            }
        );

        const userStatusByReplica: {
            spid: number;
            endpoint: string;
            fullySyncedCount: number;
            partiallySyncedCount: number;
            unsyncedCount: number;
        }[] = (
            userStatusByReplicaResp as {
                spid: string;
                endpoint: string;
                fully_synced_count: string;
                partially_synced_count: string;
                unsynced_count: string;
            }[]
        ).map((elem) => {
            return {
                spid: parseInt(elem.spid),
                endpoint: elem.endpoint,
                fullySyncedCount: parseInt(elem.fully_synced_count),
                partiallySyncedCount: parseInt(elem.partially_synced_count),
                unsyncedCount: parseInt(elem.unsynced_count),
            };
        });

        return userStatusByReplica;
    } catch (e: any) {
        tracing.recordException(e)
        return []
    }
}

export const getUserStatusByReplica = instrumentTracing({
    fn: _getUserStatusByReplica,
})