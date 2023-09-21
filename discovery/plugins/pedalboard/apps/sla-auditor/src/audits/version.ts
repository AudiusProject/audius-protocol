import semver from "semver";
import { SlashProposalParams } from "../proposal";
import { Node } from "../audit";
import * as knex from "knex";
import { VERSION_DATA_TABLE_NAME, VersionData } from "../db";
import BN from 'bn.js'

const SLASH_AMOUNT = 3000;
const WEI = new BN('1000000000000000000')
const SLASH_AMOUNT_WEI = new BN(SLASH_AMOUNT).mul(WEI)
const TIME_RANGE_MS = 24 * 60 * 60 * 1000;

type AuditResponse = {
  failedAudit: boolean;
  data: VersionData;
};

const getVersionData = async (
  node: Node,
  minVersions: { "discovery-node": string; "content-node": string },
  nodeType: "discovery-node" | "content-node"
): Promise<VersionData> => {
  try {
    // @ts-ignore: fetch defined in node 18
    const res = await fetch(`${node.endpoint}/health_check`);
    const json: {
      data: { version: string; service: "discovery-node" | "content-node" };
    } = (await res.json()) as any;
    const nodeVersion = json.data.version;
    const nodeServiceType = json.data.service;

    const minVersion = minVersions[nodeServiceType];

    const nodeMajorVersion = semver.major(nodeVersion);
    const nodeMinorVersion = semver.minor(nodeVersion);

    const minMajorVersion = semver.major(minVersion);
    const minMinorVersion = semver.minor(minVersion);

    const isMajorVersionBehind = nodeMajorVersion < minMajorVersion;
    const isMinorVersionBehind =
      nodeMajorVersion === minMajorVersion &&
      nodeMinorVersion < minMinorVersion;

    const ok = !isMajorVersionBehind && !isMinorVersionBehind;

    return {
      nodeEndpoint: node.endpoint,
      nodeVersion,
      minVersion,
      owner: node.owner,
      ok,
    };
  } catch (e) {
    console.log(`Caught error ${e} making request to ${node.endpoint}`);
    return {
      nodeEndpoint: node.endpoint,
      nodeVersion: "N/A",
      minVersion: minVersions[nodeType],
      owner: node.owner,
      ok: false,
    };
  }
};

const writeVersionData = async (db: knex.Knex, versionData: VersionData[]) => {
  await db(VERSION_DATA_TABLE_NAME).insert(versionData);
};

/**
 * Formats an audit response into params to create a proposal.
 * Note that the auditor currently does duplication prevention based on the `title`
 * string. Do not modify unless you modify the deduplication logic.
 * @param auditResponse
 * @returns
 */
const formatProposal = (auditResponse: AuditResponse): SlashProposalParams => {
  const { nodeEndpoint, owner, nodeVersion, minVersion } = auditResponse.data!;
  return {
    amountWei: SLASH_AMOUNT_WEI,
    title: `[SLA] Slash ${SLASH_AMOUNT} $AUDIO from ${owner}`,
    description: `
This proposal presents recommendation to the community to slash ${SLASH_AMOUNT} $AUDIO from\n
${owner}\n
for failure to comply with latest chain versions.

SLA: https://docs.audius.org/token/running-a-node/sla#1-minimum-version-guarantee\n
Endpoint: ${nodeEndpoint}\n
Node version: ${nodeVersion}\n
Minimum required version: ${minVersion}\n
`,
    owner,
  };
};

const audit = async (
  db: knex.Knex,
  versionData: VersionData
): Promise<AuditResponse> => {
  const now = new Date();
  const before = new Date(now.getTime() - TIME_RANGE_MS);

  // Find out if this node was ever ok during the entire range we care about.
  // If so, we ca
  const ok = await db(VERSION_DATA_TABLE_NAME)
    .select("ok")
    .where("nodeEndpoint", versionData.nodeEndpoint)
    .andWhere("timestamp", ">=", before)
    .andWhere("timestamp", "<=", now)
    .andWhere("ok", true)
    .first();

  // Ensure that we have data at least dating back 24 hours ago
  const hasEnoughData = await db(VERSION_DATA_TABLE_NAME)
    .select("*")
    .where("nodeEndpoint", versionData.nodeEndpoint)
    .andWhere("timestamp", "<=", before)
    .first();

  const failedAudit = hasEnoughData && !ok;
  return {
    failedAudit,
    data: versionData,
  };
};

export const auditVersions = async (
  db: knex.Knex,
  discoveryNodes: Node[],
  contentNodes: Node[],
  minVersions: { "discovery-node": string; "content-node": string }
) => {
  const versionDataDiscovery = await Promise.all(
    discoveryNodes.map(async (node) => getVersionData(node, minVersions, "discovery-node"))
  );
  const versionDataContent = await Promise.all(
    contentNodes.map(async (node) => getVersionData(node, minVersions, "content-node"))
  );
  const versionData = [...versionDataDiscovery, ...versionDataContent];
  await writeVersionData(db, versionData);

  const auditResponses = await Promise.all(
    versionData.map(async (data) => audit(db, data))
  );

  for (const audit of auditResponses) {
    const status = audit.failedAudit ? "[FAILED]" : "[PASS]";
    console.log(
      `${status} ${audit.data?.nodeEndpoint} has version ${audit.data?.nodeVersion}, min version: ${audit.data?.minVersion}`
    );
  }

  const failedAudits = auditResponses.filter(
    (auditResponse) => auditResponse.failedAudit
  );

  const proposals = failedAudits.map((failedAudit) =>
    formatProposal(failedAudit)
  );

  return proposals;
};
