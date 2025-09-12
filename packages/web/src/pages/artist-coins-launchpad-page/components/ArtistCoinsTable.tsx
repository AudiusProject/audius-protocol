import { useCallback, useMemo } from 'react'

import { useArtistCoins, useUsers } from '@audius/common/api'
import { useBuySellModal } from '@audius/common/store'
import {
  Button,
  Flex,
  formatCount,
  LoadingSpinner,
  Paper,
  Skeleton,
  Text
} from '@audius/harmony'
import { Coin, decodeHashId } from '@audius/sdk'
import moment from 'moment'
import { Cell } from 'react-table'

import { TokenIcon } from 'components/buy-sell-modal/TokenIcon'
import { UserLink } from 'components/link'
import { Table } from 'components/table'

import styles from './ArtistCoinsTable.module.css'

const messages = {
  title: 'Your Token Balances',
  noCoins: 'No coins found',
  buy: 'Buy',
  dollarSign: '$'
}

type CoinCell = Cell<Coin>

const renderTokenNameCell = (cellInfo: CoinCell) => {
  const coin = cellInfo.row.original
  const ownerId = coin.ownerId ? decodeHashId(coin.ownerId) : null

  return (
    <Flex
      pl='xl'
      gap='xl'
      alignItems='center'
      justifyContent='space-between'
      w='100%'
    >
      <Flex gap='s' alignItems='center' w='100%'>
        <TokenIcon logoURI={coin.logoUri} size='xl' hex />
        <Flex column>
          <Text variant='title' size='s'>
            {/* {coin.name} */}
            Audius Coin
          </Text>
          <Text variant='body' size='s' strength='strong'>
            {coin.ticker}
          </Text>
        </Flex>
      </Flex>
      <Flex w='100%' justifyContent='flex-start'>
        {ownerId ? (
          <UserLink userId={ownerId} size='s' badgeSize='xs' />
        ) : (
          <Skeleton h='24px' w='100px' />
        )}
      </Flex>
    </Flex>
  )
}

const renderPriceCell = (cellInfo: CoinCell) => {
  const coin = cellInfo.row.original
  return (
    <Text variant='body' size='m' color='default'>
      {messages.dollarSign}
      {coin.price.toFixed(4)}
    </Text>
  )
}

const renderMarketCapCell = (cellInfo: CoinCell) => {
  const coin = cellInfo.row.original
  return (
    <Text variant='body' size='m'>
      {messages.dollarSign}
      {formatCount(coin.marketCap)}
    </Text>
  )
}

const renderVolume24hCell = (cellInfo: CoinCell) => {
  const coin = cellInfo.row.original
  return (
    <Text variant='body' size='m'>
      {formatCount(coin.v24hUSD)}
    </Text>
  )
}

const renderHoldersCell = (cellInfo: CoinCell) => {
  const coin = cellInfo.row.original
  return (
    <Text variant='body' size='m'>
      {formatCount(coin.holder)}
    </Text>
  )
}

const renderCreatedDateCell = (cellInfo: CoinCell) => {
  const coin = cellInfo.row.original
  return (
    <Text variant='body' size='m'>
      {moment(coin.createdAt).format('M/D/YY')}
    </Text>
  )
}

const renderBuyCell = (
  cellInfo: CoinCell,
  handleBuy: (mint: string) => void
) => {
  const coin = cellInfo.row.original

  return (
    <Flex pr='xl' justifyContent='flex-end'>
      <Button
        variant='tertiary'
        size='small'
        css={{
          boxShadow: '0 0 0 1px inset var(--harmony-border-default) !important'
        }}
        onClick={() => handleBuy(coin.mint)}
      >
        {messages.buy}
      </Button>
    </Flex>
  )
}

const tableColumnMap = {
  tokenName: {
    id: 'tokenName',
    Header: 'Coin',
    accessor: 'name',
    Cell: renderTokenNameCell,
    width: 200,
    disableSortBy: true,
    align: 'left'
  },
  price: {
    id: 'price',
    Header: 'Price',
    accessor: 'price',
    Cell: renderPriceCell,
    disableSortBy: false,
    align: 'right'
  },
  volume24h: {
    id: 'volume24h',
    Header: 'Vol',
    accessor: 'v24hUSD',
    Cell: renderVolume24hCell,
    disableSortBy: false,
    align: 'right'
  },
  marketCap: {
    id: 'marketCap',
    Header: 'Market Cap',
    accessor: 'marketCap',
    Cell: renderMarketCapCell,
    disableSortBy: false,
    align: 'right',
    width: 80
  },
  createdDate: {
    id: 'createdDate',
    Header: 'Launch',
    accessor: 'createdAt',
    Cell: renderCreatedDateCell,
    disableSortBy: false,
    align: 'right'
  },
  holders: {
    id: 'holders',
    Header: 'Holders',
    accessor: 'holder',
    Cell: renderHoldersCell,
    disableSortBy: false,
    align: 'right'
  },
  buy: {
    id: 'buy',
    accessor: 'buy',
    Cell: renderBuyCell,
    disableSortBy: true,
    align: 'right'
  }
}

type ArtistCoinsTableProps = {
  searchQuery?: string
}

export const ArtistCoinsTable = ({ searchQuery }: ArtistCoinsTableProps) => {
  const { data: coins, isLoading } = useArtistCoins()
  const { onOpen: openBuySellModal } = useBuySellModal()

  const ownerIds = useMemo(() => {
    if (!coins) return []
    const uniqueIds = [
      ...new Set(coins.map((coin) => coin.ownerId).filter(Boolean))
    ]
    return uniqueIds.map((id) => decodeHashId(id)).filter(Boolean) as number[]
  }, [coins])

  const { data: users } = useUsers(ownerIds)

  // Create memoized buy handler
  const handleBuy = useCallback(
    (mint: string) => {
      openBuySellModal({
        mint,
        isOpen: true
      })
    },
    [openBuySellModal]
  )

  // Filter coins based on search query
  const filteredCoins = useMemo(() => {
    if (!coins || !searchQuery?.trim()) return coins

    const query = searchQuery.toLowerCase().trim()
    return coins.filter((coin) => {
      const name = coin.name?.toLowerCase() ?? ''
      const ticker = coin.ticker?.toLowerCase() ?? ''

      // Check coin name and ticker
      if (name.includes(query) || ticker.includes(query)) {
        return true
      }

      // Check owner artist name
      const ownerId = decodeHashId(coin.ownerId)
      const ownerUser = users?.find((user) => user.user_id === ownerId)
      const ownerName = ownerUser?.name?.toLowerCase() ?? ''
      const ownerHandle = ownerUser?.handle?.toLowerCase() ?? ''

      return ownerName.includes(query) || ownerHandle.includes(query)
    })
  }, [coins, searchQuery, users])

  const columns = useMemo(() => {
    const baseColumns = { ...tableColumnMap }
    baseColumns.buy = {
      ...baseColumns.buy,
      Cell: (cellInfo: CoinCell) => renderBuyCell(cellInfo, handleBuy)
    }
    return Object.values(baseColumns)
  }, [handleBuy])

  if (isLoading) {
    return (
      <Paper
        w='100%'
        h={500}
        justifyContent='center'
        alignItems='center'
        p='4xl'
      >
        <LoadingSpinner />
      </Paper>
    )
  }

  if (!filteredCoins || filteredCoins.length === 0) {
    return (
      <Paper
        w='100%'
        h={500}
        justifyContent='center'
        alignItems='center'
        p='4xl'
      >
        <Text variant='body' size='m' color='subdued'>
          {messages.noCoins}
        </Text>
      </Paper>
    )
  }

  return (
    <Table
      columns={columns}
      data={filteredCoins}
      tableHeaderClassName={styles.tableHeader}
    />
  )
}
