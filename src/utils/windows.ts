export function windows<T>(windowSize: number, arr: Array<T>): Array<Array<T>> {
  return arr
    .filter((_, index) => index <= arr.length - windowSize)
    .map((_, index) => arr.slice(index, index + windowSize))
    .filter(Array.isArray);
}
