## 1.0.4 - 2026-10-31

- fix: add missing default `remoteFileRefreshInterval: 0`; without it the refresh timer got `NaN` as delay and re-fetched `remoteFile` in a tight loop, exhausting memory and crashing the renderer
- change: drop the 15 minute minimum of `remoteFileRefreshInterval`; any positive number of minutes up to 35791 (about 24.8 days, the timer maximum) is used as is
- fix: invalid `remoteFileRefreshInterval` values (non-numeric, negative, or too large for a timer, e.g. `43200`) no longer cause a tight refresh loop; the refresh is disabled and an error is logged
- fix: invalid `updateInterval` values (non-numeric, `0`, negative, too large) no longer cause a tight render loop; the default is used and an error is logged
- fix: the initial `remoteFile` load no longer delays the start of MagicMirror; a load without response is aborted after 30 seconds
- fix: `remoteFile` reloads no longer overlap; the next reload is scheduled after the previous one has finished, so an older response can no longer overwrite newer kudos
- fix: a failing `remoteFile` load (network error, HTTP error status, invalid JSON) no longer stops the module; the error is logged, kudo rotation continues and a configured refresh retries the load
- fix: refreshed `remoteFile` kudos are used from the next update on (previously one update later); random and sequential positions are reset when the kudos change
- fix: kudo sets that are missing (e.g. a set named in `hourmap` but not defined in `remoteFile`) or are not arrays are treated as empty instead of crashing the module
- fix: an empty kudo list no longer hangs the module in random mode
- fix: kudos keys that are no valid regular expression (e.g. `"(birthday"`) are ignored for date matching and logged once, instead of crashing the module

## 1.0.3 - 2026-10-15

- update dev dependencies (eslint 10, jest 30, globals 17, @stylistic/eslint-plugin 5.10, eslint-plugin-jest 29.16, moment 2.31)
- fix eslint config to apply the `@stylistic` rule overrides
- require Node.js >= 20 (tested with Node.js 20, 22 and 26)
- verified compatibility with MagicMirror² 2.38.0
- README: add requirements, installation and development sections

## 1.0.2 - 2025-09-28

- add option `remoteFileRefreshInterval`
- rework of README.md
- add eslint config and dependencies
- add some unit tests

## 1.0.1 - 2024-01-16

- cleanup


## 1.0.0 - 2017-04-30

- First public release
