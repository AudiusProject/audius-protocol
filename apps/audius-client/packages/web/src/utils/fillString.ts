const fillString = (str: string, ...args: string[]): string => {
  const insertFlags: string[] | null = str.match(/%(\d+)/g)
  if (insertFlags === null || !args.length) return str

  let output = str
  for (const i in insertFlags) {
    const flag = insertFlags[i]
    const val = args[Number(flag.slice(1))] || flag
    output = output.replace(new RegExp(flag, 'g'), val)
  }
  return output
}

export default fillString
