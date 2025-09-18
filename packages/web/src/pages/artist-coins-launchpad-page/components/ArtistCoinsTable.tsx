import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom-v5-compat'

import { useArtistCoins } from '@audius/common/api'
import { walletMessages } from '@audius/common/messages'
import { ASSET_DETAIL_PAGE } from '@audius/common/src/utils/route'
import { useBuySellModal } from '@audius/common/store'
import {
  Button,
  Flex,
  formatCount,
  IconSearch,
  LoadingSpinner,
  Paper,
  Skeleton,
  spacing,
  Text
} from '@audius/harmony'
import {
  GetCoinsSortMethodEnum,
  GetCoinsSortDirectionEnum,
  Coin,
  HashId
} from '@audius/sdk'
import moment from 'moment'
import { Cell } from 'react-table'

import { TokenIcon } from 'components/buy-sell-modal/TokenIcon'
import { TextLink, UserLink } from 'components/link'
import { dateSorter, numericSorter, Table } from 'components/table'
import { useRequiresAccountCallback } from 'hooks/useRequiresAccount'
import { useMainContentRef } from 'pages/MainContentContext'

import styles from './ArtistCoinsTable.module.css'

type CoinCell = Cell<Coin>

const renderTokenNameCell = (cellInfo: CoinCell) => {
  const coin = cellInfo.row.original
  const ownerId = HashId.parse(coin.ownerId)

  if (!coin || !coin.ticker) {
    return null
  }

  const assetDetailUrl = ASSET_DETAIL_PAGE.replace(':ticker', coin.ticker)

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
          <TextLink to={assetDetailUrl} textVariant='title' size='s'>
            {coin.name}
          </TextLink>
          <TextLink
            to={assetDetailUrl}
            textVariant='body'
            size='s'
            strength='strong'
          >
            {coin.ticker}
          </TextLink>
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
      {walletMessages.dollarSign}
      {coin.price.toFixed(4)}
    </Text>
  )
}

const renderMarketCapCell = (cellInfo: CoinCell) => {
  const coin = cellInfo.row.original
  return (
    <Text variant='body' size='m'>
      {walletMessages.dollarSign}
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
  handleBuy: (ticker: string) => void
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
        onClick={(e) => {
          e.stopPropagation()
          handleBuy(coin.ticker ?? '')
        }}
      >
        {walletMessages.buy}
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
    align: 'right',
    sorter: numericSorter('price')
  },
  volume24h: {
    id: 'volume24h',
    Header: 'Vol',
    accessor: 'v24hUSD',
    Cell: renderVolume24hCell,
    disableSortBy: false,
    align: 'right',
    sorter: numericSorter('v24hUSD')
  },
  marketCap: {
    id: 'marketCap',
    Header: 'Market Cap',
    accessor: 'marketCap',
    Cell: renderMarketCapCell,
    disableSortBy: false,
    align: 'right',
    width: 80,
    sorter: numericSorter('marketCap')
  },
  createdDate: {
    id: 'createdDate',
    Header: 'Launch',
    accessor: 'createdAt',
    Cell: renderCreatedDateCell,
    disableSortBy: false,
    align: 'right',
    sorter: dateSorter('createdAt')
  },
  holders: {
    id: 'holders',
    Header: 'Holders',
    accessor: 'holder',
    Cell: renderHoldersCell,
    disableSortBy: false,
    align: 'right',
    sorter: numericSorter('holder')
  },
  buy: {
    id: 'buy',
    accessor: 'buy',
    Cell: renderBuyCell,
    disableSortBy: true,
    align: 'right'
  }
}

const sortMethodMap: Record<string, GetCoinsSortMethodEnum> = {
  price: GetCoinsSortMethodEnum.Price,
  marketCap: GetCoinsSortMethodEnum.MarketCap,
  volume24h: GetCoinsSortMethodEnum.Volume,
  createdDate: GetCoinsSortMethodEnum.CreatedAt,
  holders: GetCoinsSortMethodEnum.Holder
}

const sortDirectionMap: Record<string, GetCoinsSortDirectionEnum> = {
  asc: GetCoinsSortDirectionEnum.Asc,
  desc: GetCoinsSortDirectionEnum.Desc
}

type ArtistCoinsTableProps = {
  searchQuery?: string
}

const ARTIST_COINS_BATCH_SIZE = 50

const isEmptyRow = (row: any) => {
  return Boolean(!row?.original || Object.keys(row.original).length === 0)
}

export const ArtistCoinsTable = ({ searchQuery }: ArtistCoinsTableProps) => {
  const mainContentRef = useMainContentRef()
  const navigate = useNavigate()
  const { onOpen: openBuySellModal } = useBuySellModal()
  const [sortMethod, setSortMethod] = useState<GetCoinsSortMethodEnum>(
    GetCoinsSortMethodEnum.MarketCap
  )
  const [sortDirection, setSortDirection] = useState<GetCoinsSortDirectionEnum>(
    GetCoinsSortDirectionEnum.Desc
  )
  const [page, setPage] = useState(0)

  const { data: coins, isPending } = useArtistCoins({
    sortMethod,
    sortDirection,
    query: searchQuery,
    limit: ARTIST_COINS_BATCH_SIZE,
    offset: page * ARTIST_COINS_BATCH_SIZE
  })

  const fetchMore = useCallback((offset: number) => {
    setPage(Math.floor(offset / ARTIST_COINS_BATCH_SIZE))
  }, [])

  const onSort = useCallback(
    (method: string, direction: string) => {
      const newSortMethod = sortMethodMap[method] ?? sortMethod
      const newSortDirection = sortDirectionMap[direction] ?? sortDirection

      setSortMethod(newSortMethod)
      setSortDirection(newSortDirection)

      // Reset page when sorting changes
      setPage(0)
    },
    [sortMethod, sortDirection]
  )

  const handleBuy = useRequiresAccountCallback(
    (ticker: string) => {
      openBuySellModal({
        ticker,
        isOpen: true
      })
    },
    [openBuySellModal]
  )

  const handleRowClick = useRequiresAccountCallback(
    (e: React.MouseEvent<HTMLTableRowElement>, rowInfo: any) => {
      const coin = rowInfo.original
      if (coin?.ticker) {
        navigate(ASSET_DETAIL_PAGE.replace(':ticker', coin.ticker))
      }
    },
    [navigate]
  )

  const columns = useMemo(() => {
    const baseColumns = { ...tableColumnMap }
    baseColumns.buy = {
      ...baseColumns.buy,
      Cell: (cellInfo: CoinCell) => renderBuyCell(cellInfo, handleBuy)
    }
    return Object.values(baseColumns)
  }, [handleBuy])

  if (isPending) {
    return (
      <Paper w='100%' justifyContent='center' alignItems='center' p='4xl'>
        <LoadingSpinner
          style={{ height: spacing.unit8, width: spacing.unit8 }}
        />
      </Paper>
    )
  }

  if (!coins || coins.length === 0) {
    return (
      <Paper
        column
        w='100%'
        justifyContent='center'
        alignItems='center'
        p='4xl'
        gap='l'
      >
        <IconSearch size='2xl' color='default' />
        <Text variant='heading' size='m'>
          {walletMessages.artistCoins.noCoins}
        </Text>
        <Text variant='body' size='l'>
          {walletMessages.artistCoins.noCoinsDescription}
        </Text>
      </Paper>
    )
  }

  return (
    <Table
      columns={columns}
      data={coins}
      isVirtualized
      onSort={onSort}
      onClickRow={handleRowClick}
      isEmptyRow={isEmptyRow}
      fetchMore={fetchMore}
      fetchBatchSize={ARTIST_COINS_BATCH_SIZE}
      tableHeaderClassName={styles.tableHeader}
      scrollRef={mainContentRef}
    />
  )
}
