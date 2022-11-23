const regexs = {
  url: new RegExp('^([^/:]+:)//(?:([^/:@]+):?([^/:@]+)?@)?([^/:]+)(?::(\\d+))?(/[^\\?#]*)(\\?[^#]*)?(#[.]*)?$')
}

class URL {
  constructor(url) {
    const matches = regexs.url.exec(url)

    if (!matches) throw new Error('bad URL format')

    this.href         = matches[0] || ''
    this.protocol     = matches[1] || ''
    this.username     = matches[2] || ''
    this.password     = matches[3] || ''
    this.hostname     = matches[4] || ''
    this.port         = matches[5] || ''
    this.host         = this.port ? `${this.hostname}:${this.port}` : this.hostname
    this.origin       = `${this.protocol}//${this.host}`
    this.pathname     = matches[6] || ''
    this.search       = matches[7] || ''
    this.hash         = matches[8] || ''
    this.searchParams = new URLSearchParams(this.search)
  }

  toString() {
    return `${this.protocol}//${this.username ? (this.password ? `${this.username}:${this.password}@` : `${this.username}@`) : ''}${this.host}${this.pathname}${this.searchParams.toString()}${this.hash}`
  }
}

class URLSearchParams {
  constructor(search) {
    this.map = {}

    if (search && (search[0] === '?'))
      search = search.substring(1)

    if (search) {
      const pairs = search.split('&')
      pairs.forEach(pair => {
        const index = pair.indexOf('=')

        if (index > 0) {
          const key = pair.substring(0, index)
          const val = (index + 1 < pair.length) ? pair.substring(index + 1) : ''

          if (!this.map[key])
            this.map[key] = []

          this.map[key].push(val)
        }
      })
    }
  }

  has(key) {
    return !!this.map[key]
  }

  get(key) {
    return this.map[key] ? this.map[key][0] : null
  }

  getAll(key) {
    return this.map[key] ? [...this.map[key]] : []
  }

  set(key, val) {
    this.map[key] = [val]
  }

  append(key, val) {
    if (!this.map[key])
      this.map[key] = []

    this.map[key].push(val)
  }

  delete(key, val) {
    if (!this.map[key]) return

    if (val) {
      const index = this.map[key].indexOf(val)
      if (index >= 0) {
        this.map[key].splice(index, 1)

        if (!this.map[key].length)
          delete this.map[key]
      }
    }
    else {
      delete this.map[key]
    }
  }

  keys() {
    return Object.keys(this.map)
  }

  toString(exclude_question_mark) {
    let search = ''
    const keys = this.keys()
    keys.forEach(key => {
      const vals = this.map[key]
      vals.forEach(val => {
        let prefix = search ? '&' : exclude_question_mark ? '' : '?'
        search += `${prefix}${key}=${val}`
      })
    })
    return search
  }
}

module.exports = URL
