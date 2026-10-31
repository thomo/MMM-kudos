## Unreleased

- fix: add missing default `remoteFileRefreshInterval: 0`; without it the refresh timer got `NaN` as delay and re-fetched `remoteFile` in a tight loop, exhausting memory and crashing the renderer
- change: drop the 15 minute minimum of `remoteFileRefreshInterval`; any positive number of minutes is used as is
- fix: invalid `remoteFileRefreshInterval` values (non-numeric, negative) no longer cause a tight refresh loop; the refresh is disabled and an error is logged
- fix: a failing `remoteFile` load (network error, HTTP error status, invalid JSON) no longer stops the module; the error is logged, kudo rotation continues and a configured refresh retries the load

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
