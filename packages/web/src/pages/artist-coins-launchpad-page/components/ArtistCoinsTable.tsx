import {
  Button,
  Flex,
  formatCount,
  Paper,
  Skeleton,
  Text
} from '@audius/harmony'
import { useArtistCoins } from '@audius/common/api'
import { Coin, decodeHashId } from '@audius/sdk'
import moment from 'moment'
import { Cell, Row } from 'react-table'

import { Table } from 'components/table'
import { TokenIcon } from 'components/buy-sell-modal/TokenIcon'
import { UserLink } from 'components/link'

import styles from './ArtistCoinsTable.module.css'
import { useBuySellModal } from '@audius/common/store'
import { useCallback } from 'react'

const messages = {
  title: 'Your Token Balances',
  noCoins: 'No coins found',
  loading: 'Loading your coins...',
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

const renderBuyCell = (cellInfo: CoinCell) => {
  const coin = cellInfo.row.original
  const { onOpen: openBuySellModal } = useBuySellModal()
  const handleBuy = useCallback(() => {
    openBuySellModal({
      mint: coin.mint,
      isOpen: true
    })
  }, [openBuySellModal, coin.mint])

  return (
    <Flex pr='xl' justifyContent='flex-end'>
      <Button
        variant='tertiary'
        size='small'
        css={{
          boxShadow: '0 0 0 1px inset var(--harmony-border-default) !important'
        }}
        onClick={handleBuy}
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

export const ArtistCoinsTable = () => {
  const { data: coins, isLoading } = useArtistCoins()

  if (isLoading) {
    return (
      <Paper column gap='xl' w='100%' className={styles.tableContainer}>
        <div className={styles.loadingState}>
          <Text variant='heading' size='m'>
            {messages.loading}
          </Text>
        </div>
      </Paper>
    )
  }

  if (!coins || coins.length === 0) {
    return (
      <Paper column gap='xl' w='100%' className={styles.tableContainer}>
        <div className={styles.emptyState}>
          <Text variant='body' size='m' color='subdued'>
            {messages.noCoins}
          </Text>
        </div>
      </Paper>
    )
  }

  return (
    <Paper column gap='xl' w='100%' className={styles.tableContainer}>
      <Table
        columns={Object.values(tableColumnMap)}
        data={coins}
        tableHeaderClassName={styles.tableHeader}
      />
    </Paper>
  )
}
