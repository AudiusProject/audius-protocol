import { log } from '@pedalboard/logger'
import App from '@pedalboard/basekit/src/app'
import fetch from 'cross-fetch'
import { initializeDiscoveryDb } from '@pedalboard/basekit'
import { Table, UsdcPurchases, Users } from '@pedalboard/storage'

type SharedData = object

const zohoRefreshToken = process.env.zoho_refresh_token
const zohoClientId = process.env.zoho_client_id
const zohoClientSecret = process.env.zoho_client_secret

const zohoBaseUrl = 'https://www.zohoapis.com/crm/v2/deals'

const discoveryDb = initializeDiscoveryDb()

const getZohoAccessToken = async () => {
  const url = 'https://accounts.zoho.com/oauth/v2/token'
  const params = new URLSearchParams()
  
  params.append('refresh_token', zohoRefreshToken!)
  params.append('client_id', zohoClientId!)
  params.append('client_secret', zohoClientSecret!)
  params.append('grant_type', 'refresh_token')
  
  try {
      const response = await fetch(url, {
          method: 'POST',
          body: params,
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
          }
      })
      
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.access_token
  } catch (error) {
      console.error('Failed to refresh access token:', error)
      return null
  }
}


const findDealByHandle = async (handle: string): Promise<string | null> => {
  const url = `${zohoBaseUrl}/search?criteria=(Audius_Profile:equals:${encodeURIComponent(`https://audius.co/${handle}`)})`
  try {
    const accessToken = await getZohoAccessToken()
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    if (data.data && data.data.length > 0) {
      return data.data[0].id
    }
    return null
  } catch (error) {
    console.error('Failed to find deal:', error)
    return null
  }
}

const updateDealRevenue = async (dealId: string, revenue: number): Promise<void> => {
  const data = {
    data: [
      {
        id: dealId,
        Revenue: revenue
      }
    ]
  }

  try {
    const accessToken = await getZohoAccessToken()
    const response = await fetch(zohoBaseUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (response.ok) {
      console.log(`Deal with ID ${dealId} updated successfully.`)
    } else {
      console.error('Failed to update deal:', await response.text())
    }
  } catch (error) {
    console.error('Failed to update deal:', error)
  }
}

const handler = async (
  _: SharedData,
  purchase: UsdcPurchases
) => {
  console.log(`Found new purchase ${JSON.stringify(purchase, null, 2)}`)
  const { seller_user_id } = purchase
  const totalRes = await discoveryDb<UsdcPurchases>(Table.UsdcPurchases)
    .where('seller_user_id', seller_user_id)
    .sum({ total: discoveryDb.raw('amount + extra_amount') })
    .first()
  const total = totalRes?.total
  const revenue = total / 1_000_000

  const handleRes = await discoveryDb<Users>(Table.Users)
    .select('handle')
    .where('user_id', seller_user_id)
    .first()
  const handle = handleRes?.handle

  console.log(`Purchase was for ${handle}, total revenue: ${revenue}`)
  if (!handle) {
    console.error(`Could not find handle for seller: ${seller_user_id}`)
    return
  }
  const dealId = await findDealByHandle(`${handle}`)
  if (dealId) {
    console.log(`Found Deal ${dealId}`)
    await updateDealRevenue(dealId, revenue)
  } else {
    console.error(`No deal found for katoproducer`)
  } 
}

const main = async () => {
  console.log('Starting up')
  await new App<SharedData>()
    .listen('usdc_purchases', handler)
    .run()
}

;(async () => {
  await main().catch(log)
})()
