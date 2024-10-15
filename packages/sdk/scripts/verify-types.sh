npm run gen:dev
cd src/sdk/api/generated

if [ -z "$(git status . --porcelain)" ]; then 
    echo "No diff found between generated types and checked in types"
else
    echo "Found diff between generated types and checked in types, please 'npm run gen:dev' in sdk"
    exit 1
fi
