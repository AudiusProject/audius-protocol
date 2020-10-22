import { useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'
import semver from 'semver'

import {
  Address,
  Node,
  Status,
  SortNode,
  ServiceType,
  CreatorNode
} from 'types'
import Audius from 'services/Audius'
import { AppState } from 'store/types'
import { setLoading, setNodes, setTotal } from './slice'
import { useEffect } from 'react'

type UseCreatorNodesProps = {
  owner?: Address
  sortBy?: SortNode
  limit?: number
}

const filterNodes = (
  nodes: {
    [spId: number]: CreatorNode
  },
  { owner, sortBy, limit }: UseCreatorNodesProps = {}
) => {
  let cnNodes = Object.values(nodes)

  const filterFunc = (node: CreatorNode) => {
    return (!owner || node.owner === owner) && !node.isDeregistered
  }

  const sortFunc = (n1: CreatorNode, n2: CreatorNode) => {
    if (semver.gt(n1.endpoint, n2.endpoint)) return 1
    else if (semver.lt(n1.endpoint, n2.endpoint)) return -1
    return 0
  }

  cnNodes = cnNodes.filter(filterFunc)
  if (sortBy) cnNodes = cnNodes.sort(sortFunc)
  if (limit) cnNodes = cnNodes.slice(0, limit)

  return cnNodes
}

// -------------------------------- Selectors  --------------------------------
export const getStatus = (state: AppState) => state.cache.creatorNode.status
export const getTotal = (state: AppState) => state.cache.creatorNode.total
export const getNode = (spID: number) => (state: AppState) =>
  state.cache.creatorNode.nodes[spID]

export const getNodes = (state: AppState) => state.cache.creatorNode.nodes
export const getFilteredNodes = ({
  owner,
  sortBy,
  limit
}: UseCreatorNodesProps = {}) => (state: AppState) => {
  const nodes = state.cache.creatorNode.nodes
  return filterNodes(nodes)
}

// -------------------------------- Helpers  --------------------------------

const processNode = async (node: Node, aud: Audius): Promise<CreatorNode> => {
  const version = await Audius.getNodeVersion(node.endpoint)
  const isDeregistered = node.endpoint === ''
  let previousInfo = {}
  if (isDeregistered) {
    previousInfo = await aud.ServiceProviderClient.getDeregisteredService(
      ServiceType.CreatorNode,
      node.spID
    )
  }
  return {
    ...node,
    ...previousInfo,
    type: ServiceType.CreatorNode,
    version,
    isDeregistered
  }
}

// -------------------------------- Thunk Actions  --------------------------------

// Async function to get
export function fetchCreatorNodes(
  props: UseCreatorNodesProps = {}
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    dispatch(setLoading())
    const creatorNodes = await aud.ServiceProviderClient.getServiceProviderList(
      ServiceType.CreatorNode
    )
    const creatorNodeVersions = await Promise.all(
      creatorNodes.map(node => processNode(node, aud))
    )
    const nodes = creatorNodeVersions.reduce(
      (acc: { [spID: number]: CreatorNode }, cn) => {
        acc[cn.spID] = cn
        return acc
      },
      {}
    )
    dispatch(
      setNodes({
        status: Status.Success,
        nodes
      })
    )
  }
}

// Async function to get
export function getCreatorNode(
  spID: number,
  setStatus?: (status: Status) => void
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    const numCreatorNodes = await aud.ServiceProviderClient.getTotalServiceTypeProviders(
      ServiceType.CreatorNode
    )
    dispatch(setTotal({ total: numCreatorNodes }))
    if (spID > numCreatorNodes) {
      if (setStatus) setStatus(Status.Failure)
      return null
    }

    const cnNode = await aud.ServiceProviderClient.getServiceEndpointInfo(
      ServiceType.CreatorNode,
      spID
    )
    const node = await processNode(cnNode, aud)

    dispatch(setNodes({ nodes: { [cnNode.spID]: node } }))
    if (setStatus) setStatus(Status.Success)
  }
}

// -------------------------------- Hooks  --------------------------------

export const useCreatorNodes = ({
  owner,
  sortBy,
  limit
}: UseCreatorNodesProps) => {
  const status = useSelector(getStatus)
  const allNodes = useSelector(getNodes)
  const nodes = useMemo(() => filterNodes(allNodes, { owner, sortBy, limit }), [
    allNodes,
    owner,
    sortBy,
    limit
  ])

  const dispatch = useDispatch()
  useEffect(() => {
    if (!status) {
      dispatch(fetchCreatorNodes({ owner, sortBy, limit }))
    }
  }, [dispatch, status, owner, sortBy, limit])

  return { status, nodes }
}

type UseCreatorNodeProps = { spID: number }
export const useCreatorNode = ({ spID }: UseCreatorNodeProps) => {
  const [status, setStatus] = useState(Status.Loading)
  const totalNodes = useSelector(getTotal)
  const node = useSelector(getNode(spID))
  const dispatch = useDispatch()

  useEffect(() => {
    if (!node && typeof totalNodes !== 'number') {
      dispatch(getCreatorNode(spID, setStatus))
    }
  }, [dispatch, node, totalNodes, spID])
  if (node && status !== Status.Success) setStatus(Status.Success)
  if (status === Status.Success) {
    return { node: node, status }
  }
  return {
    node: null,
    status
  }
}
