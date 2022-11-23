const process_argv = require('@warren-bank/node-process-argv')

const argv_flags = {
  "--help":                {bool: true},
  "--version":             {bool: true},
  "--verbose":             {bool: true},

  "--port":                {num:  "int"},
  "--min-leechers":        {num:  "int"},
  "--min-dl-factor":       {num:  true},
  "--max-dl-factor":       {num:  true},
  "--min-ul-factor":       {num:  true},
  "--max-ul-factor":       {num:  true},
  "--boost-ul-speed":      {num:  "int"},
  "--boost-ul-chance":     {num:  "int"},
  "--zero-dl":             {bool: true},
  "--seed":                {bool: true}
}

const argv_flag_aliases = {
  "--help":                ["-h"],
  "--version":             ["-V"],
  "--verbose":             ["-v"],
  "--port":                ["-p"],
  "--zero-dl":             ["-z"],
  "--seed":                ["-s"]
}

let argv_vals = {}

try {
  argv_vals = process_argv(argv_flags, argv_flag_aliases)
}
catch(e) {
  console.log('ERROR: ' + e.message)
  process.exit(1)
}

if (argv_vals["--help"]) {
  const help = require('./help')
  console.log(help)
  process.exit(0)
}

if (argv_vals["--version"]) {
  let data = require('../../package.json')
  console.log(data.version)
  process.exit(0)
}

// https://github.com/ratioghost/ratioghost/blob/master/rghost.vfs/lib/app-ghost/ghost.tcl#L89-L105
//   default values

if (typeof argv_vals["--port"] !== 'number')
  argv_vals["--port"] = 3773
if (typeof argv_vals["--min-leechers"] !== 'number')
  argv_vals["--min-leechers"] = 5
if (typeof argv_vals["--min-dl-factor"] !== 'number')
  argv_vals["--min-dl-factor"] = 0.00
if (typeof argv_vals["--max-dl-factor"] !== 'number')
  argv_vals["--max-dl-factor"] = 0.05
if (typeof argv_vals["--min-ul-factor"] !== 'number')
  argv_vals["--min-ul-factor"] = 4.00
if (typeof argv_vals["--max-ul-factor"] !== 'number')
  argv_vals["--max-ul-factor"] = 8.00
if (typeof argv_vals["--boost-ul-speed"] !== 'number')
  argv_vals["--boost-ul-speed"] = 15
if (typeof argv_vals["--boost-ul-chance"] !== 'number')
  argv_vals["--boost-ul-chance"] = 5

module.exports = argv_vals
