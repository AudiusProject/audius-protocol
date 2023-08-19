from unittest import mock

import pytest
from solders.rpc.responses import GetTransactionResp

from src.solana.solana_client_manager import SolanaClientManager

solana_client_manager = SolanaClientManager(
    "https://audius.rpcpool.com,https://api.mainnet-beta.solana.com,https://solana-api.projectserum.com"
)

example_response = GetTransactionResp.from_json(
    """
{"jsonrpc":"2.0","result":{"slot":207254272,"transaction":{"signatures":["564oju8DrSrWd9sSjhgDEFxSYQ1TyAR1dStAwbr5WS6kaLT2GHxt5NVwbdm9cE79ovaGyMu8ZgXUBB9EC8F2XT8J"],"message":{"header":{"numRequiredSignatures":1,"numReadonlySignedAccounts":0,"numReadonlyUnsignedAccounts":6},"accountKeys":["JsP7ivVoNhQZXMDmQd5m6VP6mYmycdCFHzK3i2jAmT9","AqxuSwjrQP2RFjdDTpe68fQnE3ei8xBjtBHxeW9RXpTe","11111111111111111111111111111111","5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx","9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM","Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ","SysvarRent111111111111111111111111111111111","TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"],"recentBlockhash":"3NGCi2ToZdrvLFKMhDneWBajtdLhhwnxvNqfWeNkBJ6u","instructions":[{"programIdIndex":5,"accounts":[0,4,3,1,6,7,2],"data":"12nbV5RC3kfWbXA2XRTymwPLfZ76r","stackHeight":null}]}},"meta":{"err":null,"status":{"Ok":null},"fee":5000,"preBalances":[3474085841,0,1,11030000,260042654,1141440,1009200,934087680],"postBalances":[3472041561,2039280,1,11030000,260042654,1141440,1009200,934087680],"innerInstructions":[{"index":0,"instructions":[{"programIdIndex":2,"accounts":[0,1,3],"data":"R7r7mFYpVnfogxGmgKgoouv7CPupJtRDwQVv3vdrK5Jc6WMMKQSCJRVvFjiJTrk9J5f2mXKuYyYtcsrdndPbHXFYPa93hm28j9kRF94eVq98TSrY89AZS6h5hfnTwZEEwR2gB2rnhF6jfuGdvzFzB1VbbEqzbzEXESC","stackHeight":null},{"programIdIndex":7,"accounts":[1,4,3,6],"data":"2","stackHeight":null}]}],"logMessages":["Program Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ invoke [1]","Program log: Instruction: CreateTokenAccount","Program 11111111111111111111111111111111 invoke [2]","Program 11111111111111111111111111111111 success","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]","Program log: Instruction: InitializeAccount","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4501 of 178292 compute units","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success","Program Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ consumed 26870 of 200000 compute units","Program Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ success"],"preTokenBalances":[],"postTokenBalances":[{"accountIndex":1,"mint":"9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM","uiTokenAmount":{"uiAmount":null,"decimals":8,"amount":"0","uiAmountString":"0"},"owner":"5ZiE3vAkrdXBgyFL7KqG3RoEGBws4CjRcXVbABDLZTgx","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"}],"rewards":[],"loadedAddresses":{"writable":[],"readonly":[]},"computeUnitsConsumed":26870},"blockTime":1690212068},"id":0}
"""
)

example_response_v0 = GetTransactionResp.from_json(
    """
{"jsonrpc":"2.0","result":{"slot":209280836,"transaction":{"signatures":["2ML2h2YwBmRqgmF86EvxdZMJCBwBDtspaqANpqdm4ajuKCnL7K7nXuHK7AMeBe9Zk7yJp3KR4V28WZ8tPApaQB6t"],"message":{"header":{"numRequiredSignatures":1,"numReadonlySignedAccounts":0,"numReadonlyUnsignedAccounts":6},"accountKeys":["8dbEDtUgZZ3EFFGfeAg65cCiBCrj4ccxGeijQFiVwxjt","JSvtokJbtGsYhneKomFBjnJh4djEQLdHV2kAeS43bBZ","24oqQXbKb3o4s7uekMienV5g3UePtYjB4xxtkMWJSLTd","2VLv56bYGyzahopzj9ZcBD2YUseadwVuthAsVva2k2Er","2Wg45BET6HwsPpTE5titBtchk97jZe2Ed3MhAfJ4SQvF","7WqjtUUrZntXiWz5gQZyAMyL6iMRdQ2o8u27HRdCFnB6","9WyYVAkVmfnEWJsTrWgCGXSzrkBCq4XpczBRnFa1yKoS","FcHUTdSScVovLiu7qZxD78N3xDGSFGGBcDco1959DZXg","H1qQ6Hent1C5wa4Hc3GK2V1sgg4grvDBbmKd5H8dsTmo","HWRNE1CVdbPWeB6DPAt6JT3Me3KqaMwm9ZHo2Qf1UFst","ComputeBudget111111111111111111111111111111","JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4","iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns","2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h","9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM","D8cy77BBepLMngZx6ZukaTff5hCt1HrWyKk3Hnd9oitf"],"recentBlockhash":"CAyU8PZGwGwH1rcdGrt3nmkEsPWUANTGN4W96g2A44e9","instructions":[{"programIdIndex":10,"accounts":[],"data":"K1FDJ7","stackHeight":null},{"programIdIndex":10,"accounts":[],"data":"3F8aKq24k59R","stackHeight":null},{"programIdIndex":11,"accounts":[33,13,0,6,7,3,9,14,12,11,11,15,11,36,33,16,35,17,18,19,37,20,16,16,16,16,16,16,7,1,13,39,40,25,13,8,1,26,24,33,34,33,13,23,8,21,1,22,2,4,5,38,34,33,13,30,8,27,3,32,28,31,29,41],"data":"BWAry1sSeCvqdziXQaXVDhBChgzF17MtpZ98KRv2XBUmtsUkMwct2rr1rnh5P216T8hNuM","stackHeight":null}],"addressTableLookups":[{"accountKey":"77GdiNCiB2vsrGnfBDBAy31WKUC1BsnpPVqobNArysdn","writableIndexes":[56,58,59,60,62],"readonlyIndexes":[1,15,3,0,7]},{"accountKey":"5nuw6XREo7Z1yrbx2uTfBQqfW5jrHajJt7KKsxLouW1Y","writableIndexes":[3,4,2],"readonlyIndexes":[8]},{"accountKey":"BTvBcTswkqpgbuKMU2zCdAhnXQsevXjM7ASXe4smm8ct","writableIndexes":[73,71,72],"readonlyIndexes":[63,64]},{"accountKey":"sSfUTVBAhFLsePUpvwiWpszanjic6Y9oQGHZ1vLMprN","writableIndexes":[89,91,93,88,92,90],"readonlyIndexes":[94]}]}},"meta":{"err":null,"status":{"Ok":null},"fee":5014,"preBalances":[5738474176,2039280,70407360,2039280,70407360,70407360,2039280,2039280,30058239,2039280,1,1141440,1745924130,0,260042654,0,6124800,23357760,2039280,2039280,3591360,5090627106578,2039280,5435760,2039280,11996367360,2159469039280,16733670319,70407360,70407360,5435760,70407360,2039280,934087680,1141440,283356390,1141440,1141440,0,1141440,0,0],"postBalances":[5738469162,2039280,70407360,2039280,70407360,70407360,2039280,2039280,30058239,2039280,1,1141440,1745924130,0,260042654,0,6124800,23357760,2039280,2039280,3591360,5090360343509,2039280,5435760,2039280,11996367360,2157069039280,19400433388,70407360,70407360,5435760,70407360,2039280,934087680,1141440,283356390,1141440,1141440,0,1141440,0,0],"innerInstructions":[{"index":2,"instructions":[{"programIdIndex":33,"accounts":[6,14,7,0],"data":"huuGbDMUEyoU3","stackHeight":null},{"programIdIndex":36,"accounts":[33,16,35,17,18,19,37,20,16,16,16,16,16,16,7,1,13],"data":"6D4dbMCz2KJYHkVUEiz5GL7","stackHeight":null},{"programIdIndex":33,"accounts":[7,18,13],"data":"3dEigAqSvsFu","stackHeight":null},{"programIdIndex":33,"accounts":[19,1,35],"data":"3MxTJ5HLsT4j","stackHeight":null},{"programIdIndex":11,"accounts":[15],"data":"QMqFu4fYGGeUEysFnenhAvR83g86EDDNxzUskfkWKYCBPWe1hqgD6jgKAXr6aYoEQcEzbgh6RmXznjrXchceoAj7c6e3cM5E1N25UmdUeSoYBhwvZieJUCJ9YnNyhphDK3bPuPErASve98pS753DiHe7WML9b9eg9uFaGgT5wA7eCYf","stackHeight":null},{"programIdIndex":39,"accounts":[39,40,25,13,8,1,26,24,33],"data":"1AMTAauCh9UPEJKN7DQMVso49cnfiKCGS4pPj7dsJf6JRkn1C6YxPcb6kAdCDVcFb1Y5Qb8ACf","stackHeight":null},{"programIdIndex":33,"accounts":[26,8,26],"data":"3DUUTySPf5RH","stackHeight":null},{"programIdIndex":33,"accounts":[1,24,13],"data":"3Gb1qKegUuwm","stackHeight":null},{"programIdIndex":39,"accounts":[40],"data":"9bruwfMBFHpjNCHMjjxyRXnKsgBqMBstxdM9Bo4JZwZVUrB3eT5smqk6BsdmhpMnGtvV5q1voNNE7enFskXydQdAqkL7nxjmoje9TtzYBoTMm4qyVbtUkfMye1ZJSs8xoiN8oCEbxc8c6Tq8Y1yfYq8b221h6wqSfipPim5XLmYXkLm32Rizkt9oN16XXGWw2DcUiK9zMWd1aF88XJyNR61WMbjnVHTdAPoVwjE8mgoSZyw6wYBwUejQ63PUb5YD62EsUjHYxZZvbm1PEDD4s","stackHeight":null},{"programIdIndex":11,"accounts":[15],"data":"QMqFu4fYGGeUEysFnenhAvByRXZbTme1qDxf1F3AKLUXRXgSbHSGSyxqbH3GFRxnJ6SVB39MxAtu4iRaTJwgcDLeiToZ2svgbbCzgANxJtg5acZHK9RPeJbP8PwHMSuwL4pMfBE3oJKtW3boo8E1EyfdyGZf7TYAqvxu4RapNmAJ7jm","stackHeight":null},{"programIdIndex":34,"accounts":[33,13,23,8,21,1,22,2,4,5,38],"data":"59p8WydnSZtUGoS81cETFegvkXfPyLMpr6tGfNMHxioBMeskZXqWPtv1j5","stackHeight":null},{"programIdIndex":33,"accounts":[1,22,13],"data":"3XfqZdF51cvK","stackHeight":null},{"programIdIndex":33,"accounts":[21,8,23],"data":"3Pk2xCrxJPDy","stackHeight":null},{"programIdIndex":11,"accounts":[15],"data":"QMqFu4fYGGeUEysFnenhAvDWgqp1W7DbrMv3z8JcyrP4Bu3Yyyj7irLW76wEzMiFqkMXcsUXJG1WLwjdCWzNTL6957kdfWSD7SPFG2av5YHKd6bCLS2tNXnMxCtTYryFEE4iakv6cTBps9vDbNGdjSRohyrvHrzQbG6P8kf2nNyNxCX","stackHeight":null},{"programIdIndex":34,"accounts":[33,13,30,8,27,3,32,28,31,29,41],"data":"59p8WydnSZtTCnBx72GzogsiKBnuuMq3oFwENEskTq63krQp1XKVYCwDDS","stackHeight":null},{"programIdIndex":33,"accounts":[8,27,13],"data":"3PkwpVMU9UB1","stackHeight":null},{"programIdIndex":33,"accounts":[32,3,30],"data":"3n72Fyiht5BM","stackHeight":null},{"programIdIndex":11,"accounts":[15],"data":"QMqFu4fYGGeUEysFnenhAvDWgqp1W7DbrMv3z8JcyrP4Bu3Yyyj7irLW76wEzMiFqiFwoETYwdqiPRSaEKSWpjDuenVF1jJfDrxNf9W2BiSt1egQSKJNtM56BLeVXnY9yzgeADV2dNuaRfdzXtFwrApfnCr38YcvdrdAtNS9V7uHm2P","stackHeight":null},{"programIdIndex":33,"accounts":[3,12,9,13],"data":"ib3JCSHiEeRNm","stackHeight":null}]}],"logMessages":["Program ComputeBudget111111111111111111111111111111 invoke [1]","Program ComputeBudget111111111111111111111111111111 success","Program ComputeBudget111111111111111111111111111111 invoke [1]","Program ComputeBudget111111111111111111111111111111 success","Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [1]","Program log: Instruction: SharedAccountsRoute","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]","Program log: Instruction: TransferChecked","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6173 of 1379190 compute units","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success","Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 invoke [2]","Program log: ray_log: A44pqEoIAAAAAAAAAAAAAAACAAAAAAAAAI4pqEoIAAAAx3C3ffesAAD5kEgSSwAAADLOlgMAAAAA","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]","Program log: Instruction: Transfer","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 1333929 compute units","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]","Program log: Instruction: Transfer","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 1326364 compute units","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success","Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 consumed 29770 of 1350768 compute units","Program 675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8 success","Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]","Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 2115 of 1318175 compute units","Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success","Program PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY invoke [2]","Program log: Discriminant for phoenix::program::accounts::MarketHeader is 8167313896524341111","Program log: PhoenixInstruction::Swap","Program consumption: 1292774 units remaining","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]","Program log: Instruction: Transfer","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 1276231 compute units","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]","Program log: Instruction: Transfer","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 1268823 compute units","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success","Program log: Sending batch 1 with header and 2 market events, total events sent: 2","Program PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY invoke [3]","Program PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY consumed 582 of 1261695 compute units","Program PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY success","Program PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY consumed 37180 of 1297755 compute units","Program PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY success","Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]","Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 2115 of 1258086 compute units","Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success","Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc invoke [2]","Program log: Instruction: Swap","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]","Program log: Instruction: Transfer","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 1209112 compute units","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]","Program log: Instruction: Transfer","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4736 of 1201565 compute units","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success","Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc consumed 47734 of 1240505 compute units","Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc success","Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]","Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 2115 of 1190090 compute units","Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success","Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc invoke [2]","Program log: Instruction: Swap","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]","Program log: Instruction: Transfer","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4736 of 1132456 compute units","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [3]","Program log: Instruction: Transfer","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 4645 of 1124821 compute units","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success","Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc consumed 56393 of 1172511 compute units","Program whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc success","Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 invoke [2]","Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 2115 of 1113437 compute units","Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]","Program log: Instruction: TransferChecked","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 6200 of 1108028 compute units","Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success","Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 consumed 300634 of 1400000 compute units","Program return: JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 wy1ELh0AAAA=","Program JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4 success"],"preTokenBalances":[{"accountIndex":1,"mint":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","uiTokenAmount":{"uiAmount":2.998004,"decimals":6,"amount":"2998004","uiAmountString":"2.998004"},"owner":"2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":3,"mint":"iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns","uiTokenAmount":{"uiAmount":null,"decimals":6,"amount":"0","uiAmountString":"0"},"owner":"2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":6,"mint":"9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM","uiTokenAmount":{"uiAmount":356.12273038,"decimals":8,"amount":"35612273038","uiAmountString":"356.12273038"},"owner":"8dbEDtUgZZ3EFFGfeAg65cCiBCrj4ccxGeijQFiVwxjt","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":7,"mint":"9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM","uiTokenAmount":{"uiAmount":null,"decimals":8,"amount":"0","uiAmountString":"0"},"owner":"2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":8,"mint":"So11111111111111111111111111111111111111112","uiTokenAmount":{"uiAmount":0.028018959,"decimals":9,"amount":"28018959","uiAmountString":"0.028018959"},"owner":"2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":9,"mint":"iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns","uiTokenAmount":{"uiAmount":594827.986351,"decimals":6,"amount":"594827986351","uiAmountString":"594827.986351"},"owner":"8dbEDtUgZZ3EFFGfeAg65cCiBCrj4ccxGeijQFiVwxjt","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":18,"mint":"9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM","uiTokenAmount":{"uiAmount":1901789.66073543,"decimals":8,"amount":"190178966073543","uiAmountString":"1901789.66073543"},"owner":"5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":19,"mint":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","uiTokenAmount":{"uiAmount":322429.292793,"decimals":6,"amount":"322429292793","uiAmountString":"322429.292793"},"owner":"5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":21,"mint":"So11111111111111111111111111111111111111112","uiTokenAmount":{"uiAmount":5090.625067298,"decimals":9,"amount":"5090625067298","uiAmountString":"5090.625067298"},"owner":"FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":22,"mint":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","uiTokenAmount":{"uiAmount":30213.573619,"decimals":6,"amount":"30213573619","uiAmountString":"30213.573619"},"owner":"FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":24,"mint":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","uiTokenAmount":{"uiAmount":32162.493746,"decimals":6,"amount":"32162493746","uiAmountString":"32162.493746"},"owner":"3HSYXeGc3LjEPCuzoNDjQN37F1ebsSiR4CqXVqQCdekZ","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":26,"mint":"So11111111111111111111111111111111111111112","uiTokenAmount":{"uiAmount":2159.467,"decimals":9,"amount":"2159467000000","uiAmountString":"2159.467"},"owner":"8g4Z9d6PqGkgH31tMW6FwxGhwYJrXpxZHQrkikpLJKrG","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":27,"mint":"So11111111111111111111111111111111111111112","uiTokenAmount":{"uiAmount":16.731631039,"decimals":9,"amount":"16731631039","uiAmountString":"16.731631039"},"owner":"Cx6WqD4ViGZArdA3nPcneNBJxECftm36CZbtdb7jw9gP","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":32,"mint":"iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns","uiTokenAmount":{"uiAmount":974341.597038,"decimals":6,"amount":"974341597038","uiAmountString":"974341.597038"},"owner":"Cx6WqD4ViGZArdA3nPcneNBJxECftm36CZbtdb7jw9gP","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"}],"postTokenBalances":[{"accountIndex":1,"mint":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","uiTokenAmount":{"uiAmount":3.01252,"decimals":6,"amount":"3012520","uiAmountString":"3.01252"},"owner":"2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":3,"mint":"iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns","uiTokenAmount":{"uiAmount":null,"decimals":6,"amount":"0","uiAmountString":"0"},"owner":"2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":6,"mint":"9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM","uiTokenAmount":{"uiAmount":null,"decimals":8,"amount":"0","uiAmountString":"0"},"owner":"8dbEDtUgZZ3EFFGfeAg65cCiBCrj4ccxGeijQFiVwxjt","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":7,"mint":"9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM","uiTokenAmount":{"uiAmount":null,"decimals":8,"amount":"0","uiAmountString":"0"},"owner":"2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":8,"mint":"So11111111111111111111111111111111111111112","uiTokenAmount":{"uiAmount":0.028018959,"decimals":9,"amount":"28018959","uiAmountString":"0.028018959"},"owner":"2MFoS3MPtvyQ4Wh4M9pdfPjz6UhVoNbFbGJAskCPCj3h","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":9,"mint":"iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns","uiTokenAmount":{"uiAmount":720158.258034,"decimals":6,"amount":"720158258034","uiAmountString":"720158.258034"},"owner":"8dbEDtUgZZ3EFFGfeAg65cCiBCrj4ccxGeijQFiVwxjt","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":18,"mint":"9LzCMqDgTKYz9Drzqnpgee3SGa89up3a247ypMj2xrqM","uiTokenAmount":{"uiAmount":1902145.78346581,"decimals":8,"amount":"190214578346581","uiAmountString":"1902145.78346581"},"owner":"5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":19,"mint":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","uiTokenAmount":{"uiAmount":322369.077959,"decimals":6,"amount":"322369077959","uiAmountString":"322369.077959"},"owner":"5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":21,"mint":"So11111111111111111111111111111111111111112","uiTokenAmount":{"uiAmount":5090.358304229,"decimals":9,"amount":"5090358304229","uiAmountString":"5090.358304229"},"owner":"FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":22,"mint":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","uiTokenAmount":{"uiAmount":30219.595103,"decimals":6,"amount":"30219595103","uiAmountString":"30219.595103"},"owner":"FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":24,"mint":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","uiTokenAmount":{"uiAmount":32216.67258,"decimals":6,"amount":"32216672580","uiAmountString":"32216.67258"},"owner":"3HSYXeGc3LjEPCuzoNDjQN37F1ebsSiR4CqXVqQCdekZ","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":26,"mint":"So11111111111111111111111111111111111111112","uiTokenAmount":{"uiAmount":2157.067,"decimals":9,"amount":"2157067000000","uiAmountString":"2157.067"},"owner":"8g4Z9d6PqGkgH31tMW6FwxGhwYJrXpxZHQrkikpLJKrG","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":27,"mint":"So11111111111111111111111111111111111111112","uiTokenAmount":{"uiAmount":19.398394108,"decimals":9,"amount":"19398394108","uiAmountString":"19.398394108"},"owner":"Cx6WqD4ViGZArdA3nPcneNBJxECftm36CZbtdb7jw9gP","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"accountIndex":32,"mint":"iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns","uiTokenAmount":{"uiAmount":849011.325355,"decimals":6,"amount":"849011325355","uiAmountString":"849011.325355"},"owner":"Cx6WqD4ViGZArdA3nPcneNBJxECftm36CZbtdb7jw9gP","programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"}],"rewards":[],"loadedAddresses":{"writable":["4EbdAfaShVDNeHm6GbXZX3xsKccRHdTbR5962Bvya8xt","7uvYqyiiqEw3vKkFdnRUbmZgMNSsDXZMo57ZmEeDUavg","CmMV3U4QYsykzM1fEYi3zoZh6A3ktmTKQpJxgignK1YR","DD3baZQb3PFkk7NmJXRj9Ab7o1oq2h1mUae2FmEnJCs3","FxquLRmVMPXiS84FFSp8q5fbVExhLkX85yiXucyu7xSC","6mQ8xEaHdTikyMvvMxUctYch6dUjnKgfoeib2msyMMi1","AQ36QRk3HAe6PHqBCtKTQnYKpt2kAagq9YoeTqUPMGHx","FpCMFDFGYotvufJ7HrFHsWEiiQCGbkLCtwHiDnh7o28Q","3HSYXeGc3LjEPCuzoNDjQN37F1ebsSiR4CqXVqQCdekZ","4DoNfFBfF7UokCC2FQzriy7yHK6DY6NVdYpuekQ5pRgg","8g4Z9d6PqGkgH31tMW6FwxGhwYJrXpxZHQrkikpLJKrG","6wLM5GfteP3uzyeapfjAAZwcHF5gQjXJ2J4Ed4DYjDnN","8LaSXrX7BxMXnh6A3JvSwNQoVifC36Bc8hbMGTW8Swi7","8X8U4iy379gGLcLpdH41uRw2skTDBdy9EiaqdRMVqZad","Cx6WqD4ViGZArdA3nPcneNBJxECftm36CZbtdb7jw9gP","GAYVeqmm6xeEQp5154hTruzgoDw1KbFmbXnzzPsxnFqW","HVBuRsZHAGHL8xKp4DmJFVhLsSDXaDVsxbCykPvnUmHL"],"readonly":["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc","5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1","675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8","9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin","923j69hYbT5Set5kYfiQr1D8jPL6z15tbfTbVLSwUWJD","PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY","7aDTsspkQNGKmrexAN7FLx9oxU3iPczSSvHNggyuqYkR","H8oVxtJnyN81BjE5wZTz4DkX53k1BNRNyC9eT61q2bRH"]},"returnData":{"programId":"JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4","data":["wy1ELh0=","base64"]},"computeUnitsConsumed":300634},"version":0,"blockTime":1691102059},"id":0}
"""
)


@mock.patch("solana.rpc.api.Client")
def test_get_client(_):
    # test exception raised if no clients
    with pytest.raises(Exception):
        solana_client_manager.clients = []
        solana_client_manager.get_client()

    client_mocks = [
        mock.Mock(name="first"),
        mock.Mock(name="second"),
        mock.Mock(name="third"),
    ]
    solana_client_manager.clients = client_mocks

    # test that get client returns first one
    assert solana_client_manager.get_client() == client_mocks[0]

    # test that get random client will sometimes return other clients
    num_random_iterations = 10
    # very unlikely that 10 calls to get random client all return the first one
    returned_other_client = False
    for _ in range(num_random_iterations):
        client = solana_client_manager.get_client(randomize=True)
        if client != client_mocks[0]:
            returned_other_client = True
            break
    assert returned_other_client == True


@mock.patch("solana.rpc.api.Client")
def test_get_sol_tx_info(_):
    client_mocks = [
        mock.Mock(name="first"),
        mock.Mock(name="second"),
        mock.Mock(name="third"),
    ]
    solana_client_manager.clients = client_mocks

    expected_response = example_response

    # test that it returns the client call response
    client_mocks[0].get_transaction.return_value = expected_response
    assert (
        solana_client_manager.get_sol_tx_info(
            "564oju8DrSrWd9sSjhgDEFxSYQ1TyAR1dStAwbr5WS6kaLT2GHxt5NVwbdm9cE79ovaGyMu8ZgXUBB9EC8F2XT8J"
        )
        == expected_response
    )

    # test that it retries the same client before moving on to subsequent clients
    # also test that it will try subsequent clients if first one fails
    client_mocks[0].reset_mock()
    client_mocks[1].reset_mock()
    client_mocks[2].reset_mock()

    num_retries = 2
    client_mocks[0].get_transaction.side_effect = Exception()
    client_mocks[1].get_transaction.side_effect = Exception()
    client_mocks[2].get_transaction.return_value = expected_response
    assert (
        solana_client_manager.get_sol_tx_info(
            "564oju8DrSrWd9sSjhgDEFxSYQ1TyAR1dStAwbr5WS6kaLT2GHxt5NVwbdm9cE79ovaGyMu8ZgXUBB9EC8F2XT8J",
            num_retries,
        )
        == expected_response
    )
    assert client_mocks[0].get_transaction.call_count == 2
    assert client_mocks[1].get_transaction.call_count == 2
    assert client_mocks[2].get_transaction.call_count == 1


@mock.patch("solana.rpc.api.Client")
def test_get_signatures_for_address(_):
    client_mocks = [
        mock.Mock(name="first"),
        mock.Mock(name="second"),
        mock.Mock(name="third"),
    ]
    solana_client_manager.clients = client_mocks

    expected_response = example_response

    # test that it returns the client call response
    client_mocks[0].get_signatures_for_address.return_value = expected_response
    assert (
        solana_client_manager.get_signatures_for_address(
            "JsP7ivVoNhQZXMDmQd5m6VP6mYmycdCFHzK3i2jAmT9"
        )
        == expected_response
    )

    # test that it will try subsequent clients if first one fails
    client_mocks[0].get_signatures_for_address.side_effect = Exception()
    client_mocks[1].get_signatures_for_address.side_effect = Exception()
    client_mocks[2].get_signatures_for_address.return_value = expected_response
    assert (
        solana_client_manager.get_signatures_for_address(
            "JsP7ivVoNhQZXMDmQd5m6VP6mYmycdCFHzK3i2jAmT9"
        )
        == expected_response
    )

    # test exception raised if all requests fail
    client_mocks[0].get_signatures_for_address.side_effect = Exception()
    client_mocks[1].get_signatures_for_address.side_effect = Exception()
    client_mocks[2].get_signatures_for_address.side_effect = Exception()
    with pytest.raises(Exception):
        solana_client_manager.get_signatures_for_address(
            "JsP7ivVoNhQZXMDmQd5m6VP6mYmycdCFHzK3i2jAmT9"
        )


@mock.patch("solana.rpc.api.Client")
def test_get_sol_tx_info_v0_transaction(_):
    """
    Ensures that a properly formatted v0 transaction does not error when being pulled from the client.
    """
    client_mocks = [
        mock.Mock(name="first"),
        mock.Mock(name="second"),
        mock.Mock(name="third"),
    ]
    solana_client_manager.clients = client_mocks

    expected_response = example_response

    # test that it returns the client call response
    client_mocks[0].get_transaction.return_value = expected_response
    assert (
        solana_client_manager.get_sol_tx_info(
            "2ML2h2YwBmRqgmF86EvxdZMJCBwBDtspaqANpqdm4ajuKCnL7K7nXuHK7AMeBe9Zk7yJp3KR4V28WZ8tPApaQB6t"
        )
        == expected_response
    )
