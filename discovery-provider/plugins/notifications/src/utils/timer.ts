export class Timer {
  title: string
  timer: {
    [name: string]: [number, number]
  }
  duration: {
    [name: string]: number
  }
  messages: {
    message: string
    time: number
  }[]
  lastLogTime: [number, number]
  constructor(title: string) {
    this.title = title
    this.timer = {}
    this.messages = []
    this.duration = {}
    this.startTime(this.title)
    this.lastLogTime = process.hrtime()
  }

  logMessage(message: string) {
    const elapsed = process.hrtime(this.lastLogTime)
    const elapsedMs = elapsed[0] * 1000 + Math.trunc(elapsed[1] / 1000000)
    this.messages.push({
      message,
      time: elapsedMs
    })
    this.lastLogTime = process.hrtime()
  }

  startTime(name: string) {
    if (this.timer[name]) {
      console.warn(
        `Timer ${this.title} warning: ${name} has already been started`
      )
      return
    }
    this.timer[name] = process.hrtime()
  }

  endTime(name: string) {
    if (!this.timer[name]) {
      console.warn(`Timer ${this.title} warning: ${name} has not been started`)
      return
    }
    const startTime = this.timer[name]
    const elapsed = process.hrtime(startTime)
    const elapsedMs = elapsed[0] * 1000 + Math.trunc(elapsed[1] / 1000000)
    this.duration[name] = elapsedMs
  }

  getContext() {
    this.endTime(this.title)
    return {
      timerTitle: this.title,
      ...this.duration
    }
  }
}
