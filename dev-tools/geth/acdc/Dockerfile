FROM ethereum/client-go:latest

WORKDIR /root

COPY genesis.json /root/genesis.json

RUN geth init /root/genesis.json

COPY . /root

ENTRYPOINT ["geth", "--dev", "--http", "--http.addr", "0.0.0.0", "--http.port", "8545", "--http.api", "personal,eth,net,web3", "--ws", "--ws.addr", "0.0.0.0", "--ws.port", "8546", "--ws.api", "personal,eth,net,web3", "--mine" ]
