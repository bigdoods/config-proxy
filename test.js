var tape = require('tape')
var async = require('async')
var Router = require('./router')
var http = require('http')
var hyperquest = require('hyperquest')
var concat = require('concat-stream')
var from = require('from2-string')

tape('router routes a stubbed projects handler', function (t) {

  var testServer, proxyServer

  var router = Router({
    routes:{
      '/v1/projects':'http://127.0.0.1:8089'
    },
    'default':'/v1/projects'
  })

  async.series([

    function(next){
      testServer = http.createServer(function(req, res){
        res.end('this is the test server')
      })

      testServer.listen(8089, next)
    },

    function(next){
      proxyServer = http.createServer(router)

      proxyServer.listen(8088, next)
    },

    function(next){
      setTimeout(next, 100)
    },

    function(next){
      hyperquest('http://127.0.0.1:8088/v1/projects/apples').pipe(concat(function(data){
        data = data.toString()
        t.equal(data, 'this is the test server', 'response was loaded from the projects server')
        next()
      }))
    },

    function(next){
      testServer.close(next)
    },

    function(next){
      proxyServer.close(next)
    }

  ], function(err){
    if(err){
      t.error(err)
      t.end()
      return
    }
    t.end()
  })
})

tape('router allows rewriting of the target path', function (t) {

  var testServer, proxyServer

  var router = Router({
    routes:{
      // /v1/projects/project/apples -> http://127.0.0.1:8089/v1/project/apples
      '/v1/projects':'http://127.0.0.1:8089/v1'
    },
    'default':'/v1/projects'
  })

  async.series([

    function(next){
      testServer = http.createServer(function(req, res){
        res.end(req.url)
      })

      testServer.listen(8089, next)
    },

    function(next){
      proxyServer = http.createServer(router)

      proxyServer.listen(8088, next)
    },

    function(next){
      setTimeout(next, 100)
    },

    function(next){
      hyperquest('http://127.0.0.1:8088/v1/projects/project/apples').pipe(concat(function(data){
        data = data.toString()
        t.equal(data, '/v1/project/apples', 'the URL has been remapped')
        next()
      }))
    },

    function(next){
      testServer.close(next)
    },

    function(next){
      proxyServer.close(next)
    }

  ], function(err){
    if(err){
      t.error(err)
      t.end()
      return
    }
    t.end()
  })
})


tape('router copes with an async POST request', function (t) {

  var testServer, proxyServer

  var router = Router({
    handler:function(req, route, done){

      setTimeout(function(){
        done(null, route)
      },500)
    },
    routes:{
      // /v1/projects/project/apples -> http://127.0.0.1:8089/v1/project/apples
      '/v1/projects':'http://127.0.0.1:8089/v1'
    },
    'default':'/v1/projects'
  })

  async.series([

    function(next){
      testServer = http.createServer(function(req, res){
        req.pipe(concat(function(body){
          res.end(body.toString())
        }))
      })

      testServer.listen(8089, next)
    },

    function(next){
      proxyServer = http.createServer(router)

      proxyServer.listen(8088, next)
    },

    function(next){
      setTimeout(next, 100)
    },

    function(next){


      var source = from('hello world')
      var req = hyperquest.post('http://127.0.0.1:8088/v1/projects/project/apples')
      var sink = concat(function(data){
        data = data.toString()
        t.equal(data, 'hello world', 'the data is correct')
        next()
      })

      source.pipe(req).pipe(sink)
    },

    function(next){
      testServer.close(next)
    },

    function(next){
      proxyServer.close(next)
    }

  ], function(err){
    if(err){
      t.error(err)
      t.end()
      return
    }
    t.end()
  })
})

tape('router will handle the default route', function (t) {

  var testServer, guiServer, proxyServer

  var router = Router({
    routes:{
      '/v1/projects':'http://127.0.0.1:8089',
      '/v1/gui':'http://127.0.0.1:8090'
    },
    default:"/v1/gui"
  })

  async.series([

    function(next){
      testServer = http.createServer(function(req, res){
        res.end('this is the test server')
      })

      testServer.listen(8089, next)
    },

    function(next){
      guiServer = http.createServer(function(req, res){
        res.end('this is the gui server')
      })

      guiServer.listen(8090, next)
    },

    function(next){
      proxyServer = http.createServer(router)

      proxyServer.listen(8088, next)
    },

    function(next){
      setTimeout(next, 100)
    },

    function(next){
      hyperquest('http://127.0.0.1:8088/v1/projects/apples').pipe(concat(function(data){
        data = data.toString()
        t.equal(data, 'this is the test server', 'response was loaded from the projects server')
        next()
      }))
    },

    function(next){
      hyperquest('http://127.0.0.1:8088/v1/apples/oranges').pipe(concat(function(data){
        data = data.toString()
        t.equal(data, 'this is the gui server', 'response was loaded from the gui server')
        next()
      }))
    },

    function(next){
      testServer.close(next)
    },

    function(next){
      proxyServer.close(next)
    },

    function(next){
      guiServer.close(next)
    }

  ], function(err){
    if(err){
      t.error(err)
      t.end()
      return
    }
    t.end()
  })
})

tape('router will accept a map function to alter routes', function (t) {

  process.env.TEST_URL = 'apples'

  var router1 = Router({
    routes:{
      '/v1/projects':'env:TEST_URL'
    },
    default:"/v1/projects",
    map:function(route){
      if(route=='apples') return 'oranges'
      return route
    }
  })

  var router2 = Router({
    routes:{
      '/v1/projects':'env:TEST_URL'
    },
    default:"/v1/projects"
  })

  var routes1 = router1.routes()
  var routes2 = router2.routes()

  t.equal(routes1['/v1/projects'], 'oranges', 'the route was processed and returned')
  t.equal(routes2['/v1/projects'], 'apples', 'the route was processed and returned')
  t.end()

})


tape('router will allow additional paths ontop of env vars', function (t) {

  process.env.TEST_URL = 'tcp://1.2.3.4'

  var router = Router({
    routes:{
      '/v1/projects':'env:TEST_URL:/v1/projects',
      '/v1/library':'env:TEST_URL:/v1/apples'
    },
    default:"/v1/projects",
    map:function(route){
      return route.replace(/^tcp:/, 'http:')
    }
  })

  var routes = router.routes()
  

  t.equal(routes['/v1/projects'], 'http://1.2.3.4/v1/projects', 'the route was processed and returned')
  t.equal(routes['/v1/library'], 'http://1.2.3.4/v1/apples', 'the route was processed and returned')
  t.end()

})


tape('router exposes the backend hyperproxy', function (t) {

  process.env.TEST_URL = 'tcp://1.2.3.4'

  var router = Router({
    routes:{
      '/v1/projects':'env:TEST_URL:/v1/projects',
      '/v1/library':'env:TEST_URL:/v1/apples'
    },
    default:"/v1/projects",
    map:function(route){
      return route.replace(/^tcp:/, 'http:')
    }
  })

  t.ok(router.backends, 'there are some backends for a router')
  t.end()

})