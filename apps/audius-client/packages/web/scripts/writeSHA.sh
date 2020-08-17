CURRENT_SHA=$(git rev-parse HEAD)
rm -rf ./../.env.git
echo "REACT_APP_CURRENT_GIT_SHA=$CURRENT_SHA" > .env.git
