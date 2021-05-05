const reverse = (promise: Promise<any>) => {
  return new Promise((resolve, reject) => Promise.resolve(promise).then(reject, resolve))
}

const promiseAny = (iterable: Array<Promise<any>>) => {
  return reverse(Promise.all([...iterable].map(reverse)))
}

export default promiseAny
