const { execSync } = require('child_process')
const path = require('path')

function generateProtobuf() {
  const protoDir = path.resolve(__dirname, '../../../../../../../../core')
  const outDir = path.resolve(__dirname, '') // Set output directory for generated code

  const command = `
    grpc_tools_node_protoc \
      --js_out=import_style=commonjs,binary:${outDir} \
      --grpc_out=${outDir} \
      --plugin=protoc-gen-grpc=$(which grpc_tools_node_protoc_plugin) \
      --ts_out=${outDir} \
      --proto_path=${protoDir} \
      ${protoDir}/protocol.proto
  `

  try {
    console.log(
      'Generating JavaScript and TypeScript definitions from protobuf...'
    )
    execSync(command, { stdio: 'inherit' })
    console.log('Protobuf generation complete.')
  } catch (error) {
    console.error('Error generating files from protobuf:', error.message)
    process.exit(1)
  }
}

generateProtobuf()
