var path = require('path')
var http = require('http')
var fs = require('fs')
var Router = require('./router')

var args = require('minimist')(process.argv, {
  alias:{
    p:'port',
    c:'config'
  },
  default:{
    port:process.env.PORT || 80,
    config:process.env.CONFIG
  }
})

var config = {}

// load the file

if(!args.config){
  throw new Error('please supply a config argument')
}

if(!fs.existsSync(args.config)){
  throw new Error('no config file given')
}

config = require(args.config)

var router = Router(config)
var server = http.createServer(router)

server.listen(args.port, function(err){
  if(err){
    console.error(err.toString())
    return
  }
  console.log('server listening on port: ' + args.port)
})