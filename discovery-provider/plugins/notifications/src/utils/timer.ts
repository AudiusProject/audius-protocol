
export class Timer {
  title: string
  timer: {
    [name: string]: [number, number]
  }
  duration: {
    [name: string]: number
  }
  constructor(title: string) {
    this.title = title
    this.timer = {}
    this.duration = {}
    this.startTime(this.title)
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
