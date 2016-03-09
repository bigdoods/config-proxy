var hyperprox = require('hyperprox')

function processRoute(route){
  if(route.indexOf('env:')==0){
    var parts = route.split(':')
    parts.shift()
    var field = parts[0]
    var value = process.env[field]
    parts.shift()
    var append = parts.join(':')
    return value + append
  }
  else{
    return route
  }
}

module.exports = function(args){

  if(!args.routes) args.routes = {}

  if(!args['default']){
    throw new Error('you must supply a default route name')
  }

  var routes = {}

  Object.keys(args.routes || {}).forEach(function(route){
    routes[route] = processRoute(args.routes[route])
    if(args.map){
      routes[route] = args.map(routes[route])
    }
  })

  var backends = hyperprox(function(req){
    var backend = null
    var matchingRoute = null
    Object.keys(routes || {}).forEach(function(route){
      if(req.url.indexOf(route)==0){
        backend = routes[route]
        matchingRoute = route
      }
    })

    backend = backend || routes[args['default']]

    req.url = req.url.replace(matchingRoute + '/', '/')

    return backend
  })

  var router = backends.handler()

  router.routes = function(){
    return routes
  }

  return router
}