/*jslint
  browser : true, continue : true, devel : true, indent : 4, maxerr : 50, newcap : true, nomen : true, plusplus : true,
  regexp : true, sloppy : true, vars : true, white : true
*/
/*global */

//------------------------BEGIN MODULE SCOPE VARIABLES----------------------

'use strict';

var 
    http = require('http'),
    express = require('express'),
    routes = require('./lib/routes'),

    app = express(),
    server = http.createServer(app);

//------------------------BEGIN SERVER CONFIGURATION-------------------------
app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
});
app.configure('development', function () {
    app.use(express.logger());
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
});
app.configure('production', function () {
    app.use(express.errorHandler());
});

routes.configRoutes(app, server);

//------------------------BEGIN START SERVER---------------------------------
server.listen(3000);
console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);