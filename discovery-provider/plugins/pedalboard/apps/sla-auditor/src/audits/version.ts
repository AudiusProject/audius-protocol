import fetch from "node-fetch";
import semver from "semver";
import { SlashProposalParams } from "../proposal";
import { Node, audit } from "../audit";

const SLASH_AMOUNT_WEI = 3000 * 1_000_000_000_000_000_000;

type AuditResponse = {
  failedAudit: boolean;
  data: {
    nodeEndpoint: string;
    nodeVersion: string;
    requiredVersion: string;
    owner: string;
  } | null;
};

const checkVersion = async (node: Node): Promise<AuditResponse> => {
  const res = await fetch(`${node.endpoint}/version`);
  const json = await res.json();
  const nodeVersion = json.data.version;

  const requiredVersion = "1.2.3";

  const nodeMajorVersion = semver.major(nodeVersion);
  const nodeMinorVersion = semver.minor(nodeVersion);

  const requiredMajorVersion = semver.major(requiredVersion);
  const requiredMinorVersion = semver.minor(requiredVersion);

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
        requiredVersion,
        owner: node.owner,
      },
    };
  }

  return {
    failedAudit: false,
    data: null,
  };
};

const createProposal = (auditResponse: AuditResponse): SlashProposalParams => {
  const { nodeEndpoint, owner, nodeVersion, requiredVersion } =
    auditResponse.data!;
  return {
    amountWei: SLASH_AMOUNT_WEI,
    title: `[Version SLA Audit] Proposal to slash ${owner}`,
    description: `
We are recommending to the community a slash of ${SLASH_AMOUNT_WEI}wei $AUDIO to ${owner}
for failure to comply with latest chain versions.

Endpoint: ${nodeEndpoint}
Node version: ${nodeVersion}
Required version: ${requiredVersion}
`,
    owner,
  };
};

export const auditVersions = async (nodes: Node[]) => {
  const auditResponses = await Promise.all(
    nodes.map(async (node) => checkVersion(node))
  );
  const failedAudits = auditResponses.filter(
    (auditResponse) => auditResponse.failedAudit
  );
  const proposals = failedAudits.map((failedAudit) =>
    createProposal(failedAudit)
  );
  return proposals;
};
