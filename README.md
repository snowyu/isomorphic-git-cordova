# isomorphic-git for Cordova

## install

install cordova plugins first:

* cordova-plugin-advanced-http
* cordova-plugin-file

NOTE: Cordova can not support web worker currently.

Known Issues(isomorphic-git):

* no symlink on android-plugin-file
* crashed if take up too much time to calculate the index of pack.
* crashed if too many files checkout for Promise.all
* fs.mkdir may raise error when checkout for Promise.all
  * workaround, add `try...catch`:
  ```js
          // commands/checkout.js#197
          try {
          await fs.mkdir(filepath)
          if (onProgress) {
            await onProgress({
              phase: 'Updating workdir',
              loaded: ++count,
              total,
            })
          }}
          catch(err) {
            console.error(`mkdir err: ${filepath} ${err.code} ${err.message}`)
          }
  ```

