### [_Torrent Ratio Proxy_](https://github.com/warren-bank/node-torrent-client-ratio-modifier-http-proxy)

Command-line HTTP proxy server for use with BitTorrent clients to modify the upload/download ratio reported to trackers.

Should work with any BitTorrent client that can be configured to use an HTTP proxy server.

#### Installation:

```bash
npm install --global @warren-bank/torrent-ratio-proxy
```

#### Usage:

```bash
torrent-ratio-proxy <options>

========
options:
========

"-h"
"--help"
  Print a help message describing all command-line options.

"-V"
"--version"
  Print the current version.

"-v"
"--verbose"
  Print a lot of information at runtime to trace operations.

"-p" <port>
"--port" <port>
  Port for HTTP proxy server to listen for incoming connections.
  Default: 3773

"--min-leechers" <integer>
  Only modify the upload and download amounts
  when the count of active leechers is >= this value.
  Default: 5
  Warning: option is not yet implemented

"--min-dl-factor" <float>
"--max-dl-factor" <float>
  When the download amount is modified,
  multiply the actual download amount
  by a factor in the inclusive range between min and max.
  Defaults:
    min: 0.00
    max: 0.05

"--min-ul-factor" <float>
"--max-ul-factor" <float>
  When the upload amount is modified,
  multiply the actual upload amount
  by a factor in the inclusive range between min and max.
  Defaults:
    min: 4.00
    max: 8.00

"--boost-ul-speed" <integer>
  When the upload amount is modified,
  conditionally add an extra boost that is determined by multiplying:
  * an upload speed in the range between 0 and this value (unit: KB/sec)
  * the elapsed time since the last tracker update
  Default: 15

"--boost-ul-chance" <percent>
  The condition that determines whether or not to add an upload boost.
  This value randomly evaluates to either an "on" or "off" state.
  The "on" state occurs during this percentage of tracker updates.
  Default: 5

"-z"
"--zero-dl"
  Report download amount to always be zero.

"-s"
"--seed"
  Pretend to be a seeder.
  Report percent of torrent available for upload to always be 100%.
```

#### Credits:

* [Ratio Ghost](https://github.com/ratioghost/ratioghost)

#### Sample Torrents (public domain/license):

* [short videos](https://webtorrent.io/free-torrents)
* [Puppy Linux](https://fosstorrents.com/distributions/puppy-linux/)

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
