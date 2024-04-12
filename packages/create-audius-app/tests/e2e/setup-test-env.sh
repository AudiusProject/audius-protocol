# Replace the API key in the example app with a test key
find ./examples/react/src/App.tsx -type f -exec sed -i.bak "s/\/\/ apiKey: \"Your API Key goes here\"/,apiKey: \"$CREATE_AUDIUS_APP_TEST_API_KEY\"/g" {} \;
find ./examples/react/src/App.tsx -type f -exec sed -i.bak "s/\/\/ apiSecret: \"Your API Secret goes here\"/apiSecret: \"$CREATE_AUDIUS_APP_TEST_API_SECRET\"/g" {} \;
rm ./examples/react/src/App.tsx.bak