const { execSync } = require("child_process")
const path = require("path")

function generateProtobuf() {
  const protocGenPath = path.resolve(__dirname, "../../../../../../../../node_modules/.bin/protoc-gen-ts_proto")
  const protoDir = path.resolve(__dirname, "../../../../../../../../core")
  const outDir = path.resolve(__dirname, "")

  const command = `
    protoc \
      --plugin=protoc-gen-ts=${protocGenPath} \
      --ts_out=${outDir} \
      --proto_path=${protoDir} \
      ${protoDir}/protocol.proto
  `

  try {
    execSync(command, { stdio: "inherit" })
  } catch (error) {
    console.error("Error generating TypeScript from protobuf:", error.message)
    process.exit(1)
  }
}

generateProtobuf()
