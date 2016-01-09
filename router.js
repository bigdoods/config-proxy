var hyperprox = require('hyperprox')

function processRoute(route){
  if(route.indexOf('env:')==0){
    var parts = route.split(':')
    return process.env[parts[1]]
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

    var checkBackend = backend.replace(/^http:\/\//i, '')

    if(checkBackend.indexOf('/')>0){
      var parts = checkBackend.split('/')
      backend = parts.shift()
      var path = '/' + parts.join('/')
      req.url = req.url.replace(matchingRoute, path)
    }
    
    return backend
  })

  var router = backends.handler()

  router.routes = function(){
    return routes
  }

  return router
}