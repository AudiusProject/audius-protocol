#!/bin/bash

# Run from local discovery-provider/scripts/

FINAL_BLOCK=$1
NETHERMIND_DEPLOYER_PRIVATE_KEY=$2

discovery_nodes=("stage-discovery-1" "stage-discovery-2" "stage-discovery-3" "stage-discovery-4" "stage-discovery-5")

function set_identity_config {
    echo "Setting final_poa_block on identity chain $FINAL_BLOCK"

    ssh -tt stage-identity "export FINAL_BLOCK=$FINAL_BLOCK; bash" << "EOF"
    echo $FINAL_BLOCK | audius-cli set-config identity-service finalPOABlock
    audius-cli launch identity-service -y
    exit
EOF

}

function poll_identity_final_block {
    identity_final_block_endpoint="https://identityservice.staging.audius.co/health_check/poa"
    response=$(curl $identity_final_block_endpoint)

    expected_response="{\"finalPOABlock\":$FINAL_BLOCK}"
    interval=5

    while true
    do
    response=$(curl $identity_final_block_endpoint)

    if [ "$response" == "$expected_response" ]; then
        echo "Identity final block is set to $FINAL_BLOCK"
        break
    else
        echo "Final block $FINAL_BLOCK is not set, retrying in $interval seconds..."
        sleep $interval
    fi
    done
}

function kill_indexer {
    for i in "${discovery_nodes[@]}"
    do
        ssh "$i" << "EOF"
        docker rm -f indexer
        exit
EOF
    done

}

function kill_old_chain {
    for i in "${discovery_nodes[@]}"
    do
        ssh "$i" << "EOF"
        docker rm -f chain
        sudo rm -rf /var/k8s/discovery-provider-chain/db/clique/
        audius-cli launch discovery-provider -y
        exit
EOF
    done

}

function start_new_chain {
    for i in "${discovery_nodes[@]}"
        do
        ssh "$i" << EOF
        docker rm -f indexer
        docker rm -f chain
        sudo rm -rf /var/k8s/discovery-provider-chain/db/clique/
        audius-cli launch discovery-provider -y
        exit
EOF
    done
}

function poll_chain_health {
    echo "Waiting for 10 seconds after chain reset..."
    sleep 10

    for i in "${discovery_nodes[@]}"
        do
        expected_response="\"Healthy\""
        interval=5

        while true
        do
        response=$(ssh "$i" "curl localhost:8545/health | jq '.status'")
        if [ "$response" == "$expected_response" ]; then
            echo "$i chain is healthy"
            break
        else
            echo "$i unhealthy, retrying in $interval seconds..."
            sleep $interval
        fi
        done
    done

}


function deploy_entity_manager {
    cd ../../../contracts
    npm i
    export NETHERMIND_DEPLOYER_PRIVATE_KEY
    ./node_modules/.bin/truffle migrate --f 6 --to 6 --network nethermind --skip-dry-run
}

# kill_indexer
# set_identity_config
# poll_identity_final_block
# kill_old_chain
# start_new_chain
# poll_chain_health
deploy_entity_manager
