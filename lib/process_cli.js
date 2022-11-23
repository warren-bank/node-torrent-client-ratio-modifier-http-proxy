const request = require('@warren-bank/node-request').request
const http    = require('http')
const net     = require('net')
const URL     = require('./URL')

/* ------------
 * issue:
 * - cannot use the native URL utility class:
 *     const {URL} = require('url')
 * - it mangles querystring parameter values,
 *   because it messes with encoding/decoding
 * - I wrote a quick workaround utility class
 *   that leaves all querystring parameter values intact
 *
 * related:
 *   https://stackoverflow.com/questions/45516070
 * ------------
 */

const process_cli = (argv_vals) => {
  const server = http.createServer()

  server.on('connect', (req, clientSocket, head) => {
    try {
      if (argv_vals["--verbose"])
        console.log('[connect]:', {url: req.url, head: head.toString('utf8')})

      const {port, hostname} = new URL(`http://${req.url}`)
      const serverSocket     = net.connect(port || 80, hostname, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\nProxy-agent: torrent-ratio-proxy\r\n\r\n')
        serverSocket.write(head)
        serverSocket.pipe(clientSocket)

        if (argv_vals["--verbose"]) {
          clientSocket.on('data', (chunk) => {
            console.log(chunk.toString('utf8'))
            serverSocket.write(chunk)
          })
        }
        else {
          clientSocket.pipe(serverSocket)
        }
      })
    }
    catch(e) {
      if (argv_vals["--verbose"])
        console.log('ERROR[connect]:', e.message)

      if (clientSocket.writable)
        clientSocket.end()
    }
  })

  server.on('request', (req, res) => {
    try {
      if (argv_vals["--verbose"])
        console.log('[request]:', {url: req.url})

      process_request(req, res, argv_vals)
    }
    catch(e) {
      if (argv_vals["--verbose"])
        console.log('ERROR[request]:', e.message)

      res.writeHead(400)
      res.end('Bad Request')
    }
  })

  server.on('clientError', (err, socket) => {
    if (err && argv_vals["--verbose"])
      console.log('ERROR[client]:', err.code, err.message)

    if (
      (err && (err.code === 'ECONNRESET')) ||
      !socket.writable
    ) return

    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n")
  })

  server.listen(argv_vals["--port"], () => {
    console.log(`HTTP server is listening at: ${argv_vals["--port"]}`)
  })
}

const state = {} // infohash: {first: {real_left}, previous: {real_dl, mock_dl, real_ul, mock_ul, boost_ul_timestamp}}

// -------------------------------------
// request handler
//   - thrown error will result in 400 response
// -------------------------------------
const process_request = (req, res, argv_vals) => {
  let url = new URL(req.url)

  if (!url.protocol || (url.protocol.toLowerCase().indexOf('http') !== 0))
    throw new Error('proxy requests must contain an absolute URL')

  let qs = url.searchParams
  let infohash = qs.get('info_hash')

  if (infohash) {
    let prev, real_dl, real_ul

    if (!state[infohash])
      state[infohash] = {first: {real_left: 0}, previous: {real_dl: 0, mock_dl: 0, real_ul: 0, mock_ul: 0, boost_ul_timestamp: 0}}

    prev = state[infohash].previous

    real_dl = qs.get('downloaded')
    real_ul = qs.get('uploaded')

    if (real_dl)
      real_dl = parseInt(real_dl, 10)
    if (real_ul)
      real_ul = parseInt(real_ul, 10)

    if ((typeof real_dl !== 'number') || isNaN(real_dl))
      real_dl = -1
    if ((typeof real_ul !== 'number') || isNaN(real_ul))
      real_ul = -1

    if (real_dl >= 0) {
      if (argv_vals["--zero-dl"]) {
        qs.set('downloaded', 0)
      }
      else {
        const prev_real_dl = prev.real_dl
        const prev_mock_dl = prev.mock_dl

        if (real_dl > prev_real_dl) {
          const diff_real_dl = real_dl - prev_real_dl
          const diff_mock_dl = Math.floor(diff_real_dl * random_float_between(argv_vals["--min-dl-factor"], argv_vals["--max-dl-factor"]))
          const mock_dl      = prev_mock_dl + diff_mock_dl

          prev.real_dl = real_dl
          prev.mock_dl = mock_dl

          qs.set('downloaded', mock_dl)
        }
        else {
          qs.set('downloaded', prev_mock_dl)
        }
      }      
    }

    if (real_ul >= 0) {
      const prev_real_ul = prev.real_ul
      const prev_mock_ul = prev.mock_ul
      let mock_ul

      if (real_ul > prev_real_ul) {
        const diff_real_ul = real_ul - prev_real_ul
        const diff_mock_ul = Math.floor(diff_real_ul * random_float_between(argv_vals["--min-ul-factor"], argv_vals["--max-ul-factor"]))
              mock_ul      = prev_mock_ul + diff_mock_ul

        prev.real_ul = real_ul
      }
      else {
        mock_ul = prev_mock_ul
      }

      const prev_boost_ul_timestamp = prev.boost_ul_timestamp
      const this_boost_ul_timestamp = Date.now()
      if (prev_boost_ul_timestamp) {
        const boost_ul_rand = Math.floor(Math.random() * 100)
        if (boost_ul_rand <= argv_vals["--boost-ul-chance"]) {
          let boost_ul_period, boost_ul_speed

          boost_ul_period = this_boost_ul_timestamp - prev_boost_ul_timestamp
          boost_ul_speed  = random_integer_between(0, argv_vals["--boost-ul-speed"])
          // convert ms to s
          boost_ul_period = Math.floor(boost_ul_period / 1000)
          // convert KB/s to B/s
          boost_ul_speed  = boost_ul_speed * 1024
          // add boost in bytes
          mock_ul += (boost_ul_period * boost_ul_speed)
        }
      }

      prev.mock_ul = mock_ul
      prev.boost_ul_timestamp = this_boost_ul_timestamp

      qs.set('uploaded', mock_ul)
    }

    if (qs.has('left')) {
      if (argv_vals["--seed"]) {
        qs.set('left', 0)
      }
      else {
        const first = state[infohash].first

        if (!first.real_left) {
          let real_left = qs.get('left')

          if (real_left)
            real_left = parseInt(real_left, 10)

          if ((typeof real_left !== 'number') || isNaN(real_left))
            real_left = -1

          if (real_left >= 0) {
            if (real_dl > 0)
              real_left += real_dl

            first.real_left = real_left
          }
        }

        if (first.real_left) {
          const full_left = first.real_left
          const mock_left = full_left - prev.mock_dl

          qs.set('left', mock_left)
        }
      }
    }

    if (argv_vals["--verbose"])
      console.log('[proxying]:', {url: url.toString(), state: prev})
  }

  url      = url.toString()
  qs       = null
  infohash = null

  request(url, '', {binary: true, stream: true})
  .then(({response}) => {
    for (let header_key in response.headers) {
      res.setHeader(header_key, response.headers[header_key])
    }

    response.pipe(res)
  })
  .catch((e) => {
    res.writeHead(500)
    res.end('Internal Server Error')
  })
}

const random_float_between = (min, max, decimal_places = 4) => {
  const shift = Math.pow(10, decimal_places)

  random_integer = random_integer_between(
    Math.floor(min * shift),
    Math.floor(max * shift)
  )

  return (random_integer / shift)
}

const random_integer_between = (min, max) => {
  return Math.floor(
    Math.random() * (max - min + 1) + min
  )
}

module.exports = process_cli
