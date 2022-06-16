cd ../api-client-generator
npm run gen:dev
cd ../libs
mkdir src/sdk/generated
cp -R ../api-client-generator/gen/typescript-fetch/v1/full src/sdk/generated
cp -R ../api-client-generator/gen/typescript-fetch/v1/default src/sdk/generated
