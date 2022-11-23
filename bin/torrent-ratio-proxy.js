#! /usr/bin/env node

const argv_vals = require('./torrent-ratio-proxy/process_argv')
const run_proxy = require('../lib/process_cli')

run_proxy(argv_vals)
