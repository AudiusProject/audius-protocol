import { auditVersions } from "./audits/version";
import { propose } from "./proposal";

export type Node = {
  delegateOwnerWallet: string;
  endpoint: string;
  owner: string;
  spID: number;
  type: "discovery-node" | "content-node";
};

export const audit = async (app: App<SharedData>) => {
  const { libs } = app.viewAppData();
  const discoveryNodes: Node[] =
    await libs.ServiceProvider.listDiscoveryProviders();
  const contentNodes: Node[] = await libs.ServiceProvider.listCreatorNodes();

  const nodes = [...discoveryNodes, ...contentNodes];

  const proposals = await auditVersions(nodes);
  for (const proposal of proposals) {
    await propose(app, proposal);
  }
};
