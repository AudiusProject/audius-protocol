import axios from "axios";
import {
  allUserCountGauge,
  fullySyncedUsersCountGauge,
  gateway,
  generatingMetricsDurationGauge,
  nullPrimaryUsersCountGauge,
  partiallySyncedUsersCountGauge,
  primaryUserCountGauge,
  unsyncedUsersCountGauge,
  userCountGauge,
  usersWithAllFoundationNodeReplicaSetGauge,
} from "../prometheus";
import { getEnv } from "../utils";
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
} from "./queries";

export const generateMetrics = async (run_id: number) => {
  const { foundationNodes } = getEnv();

  console.log(`[${run_id}] generating metrics`);

  const endTimer = generatingMetricsDurationGauge.startTimer();

  const runStartTime = await getRunStartTime(run_id);

  const userCount = await getUserCount(run_id);

  const allUserCount = await getAllUserCount(run_id);

  const primaryUserCount = await getPrimaryUserCount(run_id);

  const fullySyncedUsersCount = await getFullySyncedUsersCount(run_id);

  const partiallySyncedUserCount = await getPartiallySyncedUsersCount(run_id);

  const unsyncedUsersCount = await getUnsyncedUsersCount(run_id);

  const usersWithNullPrimaryClock = await getUsersWithNullPrimaryClock(run_id);

  const usersWithAllFoundationNodeReplicaSetCount =
    await getUsersWithEntireReplicaSetInSpidSetCount(run_id, foundationNodes);

  allUserCount.forEach(({ endpoint, count }) => {
    allUserCountGauge.set({ endpoint, run_id }, count);
  });
  primaryUserCount.forEach(({ endpoint, count }) => {
    primaryUserCountGauge.set({ endpoint, run_id }, count);
  });

  userCountGauge.set({ run_id }, userCount);
  fullySyncedUsersCountGauge.set({ run_id }, fullySyncedUsersCount);
  partiallySyncedUsersCountGauge.set({ run_id }, partiallySyncedUserCount);
  unsyncedUsersCountGauge.set({ run_id }, unsyncedUsersCount);
  nullPrimaryUsersCountGauge.set({ run_id }, usersWithNullPrimaryClock);
  usersWithAllFoundationNodeReplicaSetGauge.set(
    { run_id },
    usersWithAllFoundationNodeReplicaSetCount
  );

  // Record duration for generating metrics and export to prometheus
  const endTime = Date.now()
  endTimer({ run_id: run_id });

  if (userCount > 0) {
    await publishSlackReport({
      runStartTime: runStartTime.toString(),
      // duration in milliseconds / (60_000 milliseconds in a minute)
      runDuration: msToTime(endTime - runStartTime.getTime()),
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
    });
  }

  try {
    // Finish by publishing metrics to prometheus push gateway
    console.log(`[${run_id}] pushing metrics to gateway`);
    await gateway.pushAdd({ jobName: "network-monitoring" });
  } catch (e) {
    console.log(
      `[generateMetrics] error pushing metrics to pushgateway - ${
        (e as Error).message
      }`
    );
  }

  console.log(`[${run_id}] finish generating metrics`);
};

const publishSlackReport = async (metrics: Object) => {
  const { slackUrl } = getEnv();

  let message = `\`\`\`${JSON.stringify(metrics, null, 2)}\`\`\``;
  console.log(message);

  if (slackUrl === "") {
    return;
  }

  try {
    await axios.post(slackUrl, {
      text: message,
    });
  } catch (e) {
    console.log(
      `Error posting to slack in slack reporter ${(e as Error).toString()}`
    );
  }
};

const msToTime = (duration: number) => {
  const milliseconds = Math.floor((duration % 1000) / 100)
  const seconds = Math.floor((duration / 1000) % 60)
  const minutes = Math.floor((duration / (1000 * 60)) % 60)
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24)

  const hoursStr = (hours < 10) ? "0" + hours : hours;
  const minutesStr = (minutes < 10) ? "0" + minutes : minutes;
  const secondsStr = (seconds < 10) ? "0" + seconds : seconds;

  return `${hoursStr}:${minutesStr}:${secondsStr}:${milliseconds.toString()}`
}
