export audius_delegate_owner_wallet=AUDIUS_DELEGATE_OWNER_WALLET
export audius_delegate_private_key=AUDIUS_DELEGATE_PRIVATE_KEY
echo $audius_delegate_owner_wallet
echo $audius_delegate_private_key
export COMPOSE_HTTP_TIMEOUT=200
# Use `_` for naming instead of `-`
# https://stackoverflow.com/questions/69464001/docker-compose-container-name-use-dash-instead-of-underscore
export COMPOSE_COMPATIBILITY=true
