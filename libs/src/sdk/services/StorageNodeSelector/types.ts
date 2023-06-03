export type StorageNodeSelectorService = {
  getSelectedNode: () => Promise<string | null>
}
