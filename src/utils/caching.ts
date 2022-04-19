import mcache from 'memory-cache'

export function cache(duration) {
  return (req, res, next) => {
    let key = '__express__' + req.originalUrl || req.url
    let cachedBody = mcache.get(key)
    if (cachedBody) {
      const parsedBody = JSON.parse(cachedBody)
      res.send(parsedBody)
      return
    } else {
      res.sendResponse = res.send
      res.send = (body) => {
        if (res.status === 503) {
          console.log(`Not caching 503 response for ${key}`, body)
        } else {
          mcache.put(key, body, duration * 1000)
        }

        res.sendResponse(body)
      }
      next()
    }
  }
}
