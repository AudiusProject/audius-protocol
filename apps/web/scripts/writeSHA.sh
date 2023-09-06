CURRENT_SHA=$(git rev-parse HEAD)
rm -rf .env/.env.git
echo "REACT_APP_CURRENT_GIT_SHA=$CURRENT_SHA" > .env/.env.git
