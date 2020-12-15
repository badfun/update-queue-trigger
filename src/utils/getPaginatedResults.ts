/**
 * Use generator function to paginate through multiple results
 * https://advancedweb.hu/how-to-paginate-the-aws-js-sdk-using-async-generators/
 *
 * @param fn
 */
export const getPaginatedResults = async (fn: Function) => {
  const EMPTY = Symbol('empty')
  const res = []

  for await (const lf of (async function* () {
    let NextMarker = EMPTY

    while (NextMarker || NextMarker === EMPTY) {
      const { marker, results } = await fn(NextMarker !== EMPTY ? NextMarker : undefined)

      yield* results
      NextMarker = marker
    }
  })()) {
    res.push(lf)
  }

  return res
}
