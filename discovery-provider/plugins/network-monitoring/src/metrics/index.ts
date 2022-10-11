import axios from "axios";
import {
  allUserCountGauge,
  fullySyncedUsersByPrimaryCountGauge,
  fullySyncedUsersByReplicaCountGauge,
  fullySyncedUsersCountGauge,
  gateway,
  generatingMetricsDurationGauge,
  nullPrimaryUsersCountGauge,
  partiallySyncedUsersByPrimaryCountGauge,
  partiallySyncedUsersByReplicaCountGauge,
  partiallySyncedUsersCountGauge,
  primaryUserCountGauge,
  unhealthyReplicaUsersCountGauge,
  unsyncedUsersByPrimaryCountGauge,
  unsyncedUsersByReplicaCountGauge,
  unsyncedUsersCountGauge,
  userCountGauge,
  usersWithAllFoundationNodeReplicaSetGauge,
  usersWithNoFoundationNodeReplicaSetGauge,
} from "../prometheus";
import { getEnv } from "../config";
import {
  getPrimaryUserCount,
  getAllUserCount,
  getFullySyncedUsersCount,
  getPartiallySyncedUsersCount,
  getUnsyncedUsersCount,
  getUsersWithNullPrimaryClock,
  getUsersWithEntireReplicaSetInSpidSetCount,
  getUserCount,
  getRunStartTime,
  getUsersWithEntireReplicaSetNotInSpidSetCount,
  getUserStatusByPrimary,
  getUserStatusByReplica,
  getUsersWithUnhealthyReplica,
} from "./queries";
import { instrumentTracing, tracing } from "..//tracer"

const _generateMetrics = async (run_id: number) => {
  const { foundationNodes } = getEnv();

  tracing.info(`[${run_id}] generating metrics`);

  const endTimer = generatingMetricsDurationGauge.startTimer();

  const runStartTime = await getRunStartTime(run_id);

  const userCount = await getUserCount(run_id);

  const allUserCount = await getAllUserCount(run_id);

  const primaryUserCount = await getPrimaryUserCount(run_id);

  const fullySyncedUsersCount = await getFullySyncedUsersCount(run_id);

  const partiallySyncedUserCount = await getPartiallySyncedUsersCount(run_id);

  const unsyncedUsersCount = await getUnsyncedUsersCount(run_id);

  const usersWithNullPrimaryClock = await getUsersWithNullPrimaryClock(run_id);

  const usersWithUnhealthyReplica = await getUsersWithUnhealthyReplica(run_id);

  const usersWithAllFoundationNodeReplicaSetCount =
    await getUsersWithEntireReplicaSetInSpidSetCount(run_id, foundationNodes);

  const usersWithNoFoundationNodeReplicaSetCount =
    await getUsersWithEntireReplicaSetNotInSpidSetCount(
      run_id,
      foundationNodes
    );

  const userStatusByPrimary = await getUserStatusByPrimary(run_id);
  const userStatusByReplica = await getUserStatusByReplica(run_id);

  allUserCount.forEach(({ endpoint, count }) => {
    allUserCountGauge.set({ endpoint, run_id }, count);
  });
  primaryUserCount.forEach(({ endpoint, count }) => {
    primaryUserCountGauge.set({ endpoint, run_id }, count);
  });
  userStatusByPrimary.forEach(
    ({
      endpoint,
      fullySyncedCount,
      partiallySyncedCount,
      unsyncedCount,
    }) => {
      fullySyncedUsersByPrimaryCountGauge.set({ endpoint, run_id }, fullySyncedCount);
      partiallySyncedUsersByPrimaryCountGauge.set({ endpoint, run_id }, partiallySyncedCount);
      unsyncedUsersByPrimaryCountGauge.set({ endpoint, run_id }, unsyncedCount);
    }
  );
  userStatusByReplica.forEach(
    ({
      endpoint,
      fullySyncedCount,
      partiallySyncedCount,
      unsyncedCount,
    }) => {
      fullySyncedUsersByReplicaCountGauge.set({ endpoint, run_id }, fullySyncedCount);
      partiallySyncedUsersByReplicaCountGauge.set({ endpoint, run_id }, partiallySyncedCount);
      unsyncedUsersByReplicaCountGauge.set({ endpoint, run_id }, unsyncedCount);
    }
  );

  userCountGauge.set({ run_id }, userCount);
  fullySyncedUsersCountGauge.set({ run_id }, fullySyncedUsersCount);
  partiallySyncedUsersCountGauge.set({ run_id }, partiallySyncedUserCount);
  unsyncedUsersCountGauge.set({ run_id }, unsyncedUsersCount);
  nullPrimaryUsersCountGauge.set({ run_id }, usersWithNullPrimaryClock);
  unhealthyReplicaUsersCountGauge.set({ run_id }, usersWithUnhealthyReplica);
  usersWithAllFoundationNodeReplicaSetGauge.set(
    { run_id },
    usersWithAllFoundationNodeReplicaSetCount
  );
  usersWithNoFoundationNodeReplicaSetGauge.set(
    { run_id },
    usersWithNoFoundationNodeReplicaSetCount
  );

  // Record duration for generating metrics and export to prometheus
  const endTime = Date.now();
  endTimer({ run_id: run_id });

  if (userCount > 0) {
    await publishSlackReport({
      fullySyncedUsersCount:
        ((fullySyncedUsersCount / userCount) * 100).toFixed(2) + "%",
      partiallySyncedUsersCount:
        ((partiallySyncedUserCount / userCount) * 100).toFixed(2) + "%",
      unsyncedUsersCount:
        ((unsyncedUsersCount / userCount) * 100).toFixed(2) + "%",
      usersWithNullPrimaryClock:
        ((usersWithNullPrimaryClock / userCount) * 100).toFixed(2) + "%",
      usersWithAllFoundationNodeReplicaSetCount:
        ((usersWithAllFoundationNodeReplicaSetCount / userCount) * 100).toFixed(
          2
        ) + "%",
      usersWithNoFoundationNodeReplicaSetCount:
        ((usersWithNoFoundationNodeReplicaSetCount / userCount) * 100).toFixed(
          2
        ) + "%",
        usersWithUnhealthyReplica:
        ((usersWithUnhealthyReplica / userCount) * 100).toFixed(
          2
        ) + "%",
      runDuration: msToTime(endTime - runStartTime.getTime()),
    });
  }

  try {
    // Finish by publishing metrics to prometheus push gateway
    tracing.info(`[${run_id}] pushing metrics to gateway`);
    await gateway.pushAdd({ jobName: "network-monitoring" });
  } catch (e: any) {
    tracing.recordException(e)
    tracing.info(
      `[generateMetrics] error pushing metrics to pushgateway - ${
        e.message
      }`
    );
  }

  tracing.info(`[${run_id}] finish generating metrics`);
};

export const generateMetrics = instrumentTracing({
  fn: _generateMetrics,
})

const publishSlackReport = async (metrics: Object) => {
  const { slackUrl } = getEnv();

  let message = `\`\`\`${JSON.stringify(metrics, null, 2)}\`\`\``;
  tracing.info(message);

  if (slackUrl === "") {
    return;
  }

  try {
    await axios.post(slackUrl, {
      text: message,
    });
  } catch (e: any) {
    tracing.recordException(e)
    tracing.error(
      `Error posting to slack in slack reporter ${e.toString()}`
    );
  }
};

const msToTime = (duration: number) => {
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  const hoursStr = hours < 10 ? "0" + hours : hours;
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;

  return `${hoursStr}hr ${minutesStr}min`;
};
