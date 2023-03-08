import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { SP, useDiscoveryProviders } from './useServiceProviders'
import Web3 from 'web3'

export function Acdc() {
    const { data: sps, error } = useDiscoveryProviders()

    const gateway = "https://acdc-gateway.audius.co/"
    const web3 = new Web3(gateway)

    if (error) return <div>error</div>
    if (!sps) return null

    const [seconds, setSeconds] = useState(0);
    const [currentBlock, setCurrentBlock] = useState(0)
    const [signers, setSigners] = useState(null)

    useEffect(() => {
      const interval = setInterval(() => {
        setSeconds(seconds => seconds + 1)
        gatherData()
      }, 1000);
      return () => clearInterval(interval);
    }, []);

    // gets all the data from web3 we want
    const gatherData = () => {
        web3.eth.getBlockNumber(((e, num) => setCurrentBlock(num)))
        rpc(gateway, "clique_getSigners", [], (res) => setSigners(res.result))
    }


    return (
        <div style={{ padding: 20 }}>
        {currentBlock != 0 && <h3>Current Block: {currentBlock}</h3>}
        {signers && <table className="table">
          <tr>
            {sps.map((sp) => (
                <div key={sp.endpoint} >{sp.endpoint}</div>
            ))}
          </tr>
        </table>}
      </div>
    )
}

const rpc = (url: string, method: string, params: any[], callback: (any)) => {
    fetch(url, {
        method: 'POST',
        mode: "no-cors",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'method': method,
            'params': params,
            'id': 1,
            'jsonrpc': '2.0'
        })
    }).then((res) => {
        console.log(res.json())
        callback(res.json())})
}
