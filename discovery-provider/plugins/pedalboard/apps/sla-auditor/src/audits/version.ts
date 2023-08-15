import semver from "semver";
import { SlashProposalParams } from "../proposal";
import { Node } from "../audit";

const SLASH_AMOUNT = 3000;
const SLASH_AMOUNT_WEI = SLASH_AMOUNT * 1_000_000_000_000_000_000;

type Check = {
  nodeEndpoint: string;
  nodeVersion: string;
  minVersion: string;
  owner: string;
};

type AuditResponse = {
  failedAudit: boolean;
  data: Check;
};

const checkVersion = async (
  node: Node,
  minVersions: { "discovery-node": string; "content-node": string }
): Promise<AuditResponse> => {
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

    const requiredMajorVersion = semver.major(minVersion);
    const requiredMinorVersion = semver.minor(minVersion);

    const isMajorVersionBehind = nodeMajorVersion < requiredMajorVersion;
    const isMinorVersionBehind =
      nodeMajorVersion === requiredMajorVersion &&
      nodeMinorVersion < requiredMinorVersion;

    if (isMajorVersionBehind || isMinorVersionBehind) {
      return {
        failedAudit: true,
        data: {
          nodeEndpoint: node.endpoint,
          nodeVersion,
          minVersion,
          owner: node.owner,
        },
      };
    }
    return {
      failedAudit: false,
      data: {
        nodeEndpoint: node.endpoint,
        nodeVersion,
        minVersion,
        owner: node.owner,
      },
    };
  } catch (e) {
    console.log(`Caught error ${e} making request to ${node.endpoint}`);
    return {
      failedAudit: true,
      data: {
        nodeEndpoint: node.endpoint,
        nodeVersion: "",
        minVersion: "",
        owner: node.owner,
      },
    };
  }
};

const createProposal = (auditResponse: AuditResponse): SlashProposalParams => {
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

export const auditVersions = async (
  nodes: Node[],
  minVersions: { "discovery-node": string; "content-node": string }
) => {
  const auditResponses = await Promise.all(
    nodes.map(async (node) => checkVersion(node, minVersions))
  );

  for (const audit of auditResponses) {
    const status = audit.failedAudit ? "[FAILED]" : "[PASS]";
    console.log(
      `${status} ${audit.data?.nodeEndpoint} has version ${audit.data?.nodeVersion}, min version: ${audit.data?.minVersion}`
    );
    // Write to database, determine if we have exceeded X checks
  }

  const failedAudits = auditResponses.filter(
    (auditResponse) => auditResponse.failedAudit
  );

  const proposals = failedAudits.map((failedAudit) =>
    createProposal(failedAudit)
  );

  return proposals;
};
