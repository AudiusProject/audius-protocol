CURRENT_SHA=$(git rev-parse HEAD)
rm -rf env/.env.git
echo "VITE_CURRENT_GIT_SHA=$CURRENT_SHA" > env/.env.git
echo "{\"git\": \"$CURRENT_SHA\"}" > public/.gitsha
