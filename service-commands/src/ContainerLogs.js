class ContainerLogs {
  static append ({
    containerName,
    stdout,
    metadata
  }) {
    const value = {
      stdout,
      ...metadata,
      containerName
    }

    if (!this.logs[containerName]) {
      this.logs[containerName] = value
    } else {
      // Dedupe
    }
    // if (this.logs[containerName]) {
    //   this.logs[containerName].push(value)
    // } else {
    //   this.logs[containerName] = [value]
    // }
  }
}

ContainerLogs.logs = {}

module.exports = ContainerLogs
