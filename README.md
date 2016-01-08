# config-proxy

A simple library that enables the proxying on HTTP requests based on a simple configuration.

Example using the library:

```js
var Router = require('config-proxy')
var http = require('http')

var router = Router({
  routes:{
    '/v1/projects':'http://127.0.0.1:8089'
  },
  'default':'/v1/projects'
})

var server = http.createServer(router)
server.listen(args.port)
```

Example using the CLI tool:

```bash
$ sudo npm install -g config-proxy
```

A file living in `/etc/config-proxy.json`:

```json
{
  "routes":{
    "/v1/gui":"env:GUI_URL",
    "/v1/library":"env:LIBRARY_URL",
    "/v1/projects":"env:PROJECTS_URL"
  },
  "default":"/v1/gui"
}
```

We run the config-proxy HTTP server pointing at our config file and listening on port 8080:

```bash
$ config-proxy --config /etc/config-proxy.json --port 8080
```

## install

```bash
$ npm install config-proxy
```

## test

```bash
$ npm test
```

## Config

 * routes - maps URLs onto backends
 * default - which route to use if there is no match

The value of the routes can be in `env:VARNAME` format.  This means `load the value of this environment variable` as the backend route.

## routes()

This function will return the processed routes back for analysis:

```js
var routes = router.routes()

console.log(routes['/v1/projects'])
```

## Licence

MIT
