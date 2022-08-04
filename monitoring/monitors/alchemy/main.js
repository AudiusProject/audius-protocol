const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const client = require('prom-client');

const express = require('express');
const server = express();

require('console-stamp')(console, '[HH:MM:ss.l]');

// Using HTTP
const web3 = createAlchemyWeb3(
    process.env.HTTPS,
);

const prefix = 'audius_monitors_alchemy_';
const enableDefaultMetrics = () => {
    const collectDefaultMetrics = client.collectDefaultMetrics;
    collectDefaultMetrics({ prefix });
}

const balanceGauge = new client.Gauge({
    name: `${prefix}balance`,
    help: 'Balance of a wallet holding AUDIO',
    labelNames: ['address_name'],
});

const alchemyFailureGauge = new client.Gauge({
    name: `${prefix}api_failure`,
    help: 'Count when alchemy calls fail.',
});
alchemyFailureGauge.set(0);

const main = async () => {
    // Wallet address
    const addresses = {
        communityTreasury: {
            address: "0x4deca517d6817b6510798b7328f2314d3003abac",
            tokens: [],
        },
        multiSig: {
            address: "0xeABCcd75dA6c021c7553dB4A74CACC958812432A",
            tokens: [],
        },
        tokenContract: {
            address: "0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998",
            tokens: [],
        },
    }

    let address;
    for (const addressName in addresses) {
        address = addresses[addressName].address

        // Get token balances
        const balances = await web3.alchemy.getTokenBalances(address)
        // web3.alchemy.getTokenBalances(address, 'DEFAULT_TOKENS')

        // Remove tokens with zero balance
        const nonZeroBalances = balances['tokenBalances'].filter(token => {
            return token['tokenBalance'] !== '0'
        })

        // Counter for SNo of final output
        let i = 1

        // Loop through all tokens with non-zero balance
        for (token of nonZeroBalances) {

            // Get balance of token
            let balance = token['tokenBalance']

            // Get metadata of token
            const metadata = await web3.alchemy.getTokenMetadata(token[
                'contractAddress'
            ]);

            // Compute token balance in human-readable format
            balance = balance / Math.pow(10, metadata['decimals']);
            balance = balance.toFixed(2);

            tokenSummary = {
                name: metadata['name'],
                balance: balance,
                symbol: metadata['symbol'],
            }
            balanceGauge.set({ address_name: addressName }, parseFloat(balance));

            addresses[addressName].tokens.push(tokenSummary)
        }
    }

    console.log(JSON.stringify(addresses))
}

const runMain = async () => {
    try {
        await main();
        // process.exit(0);
    }
    catch (error) {
        console.log(error);
        // process.exit(1);
        alchemyFailureGauge.inc();
    }
};

runMain()
// enableDefaultMetrics()
setInterval(function () { runMain() }, 10 * 1000)

server.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', client.register.contentType);
        res.end(await client.register.metrics());
    } catch (ex) {
        res.status(500).end(ex);
    }
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log(
        `Server listening to ${port}, metrics exposed on /metrics endpoint`,
    );
})
