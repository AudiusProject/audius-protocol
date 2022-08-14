---
sidebar_position: 3
title: Sample Queries
---

## Sample Queries

Below are some sample queries you can use to gather information from the Sablier contracts. 

You can build your own queries using a [GraphQL Explorer](https://graphiql-online.com/graphiql) and enter your endpoint to limit the data to exactly what you need.

### Sender Streams

Description: Gathers the streams created by an account as well as the stream's most recent withdrawal

```
query SenderStreams($Sender: Bytes = "0x3d8115998bc6dd73dbc2686a0f1640bbdf802a5c") {
  streams(where: {sender: $Sender}) {
    id
    sender {id}
    startTime
    stopTime
    ratePerSecond
    recipient
    deposit
    withdrawals(first: 1, orderBy: timestamp, orderDirection: desc) {
      amount
      timestamp
      txhash
    }
  }
}

```

### Receiver Streams

Description: Gathers the streams an account receives as well as the stream's most recent withdrawal

```
query RecipientStreams($Recipient: Bytes = "0x6484a2514aee516ddac6f67dd2322f23e0a4a7d6") {
  streams(where: {recipient: $Recipient}) {
    id
    sender {id}
    startTime
    stopTime
    ratePerSecond
    recipient
    deposit
    withdrawals(first: 1, orderBy: timestamp, orderDirection: desc) {
      amount
      timestamp
      txhash
    }
  }
}
```


```
