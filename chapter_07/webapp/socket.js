/*jslint
  browser : true, continue : true, devel : true, indent : 4, maxerr : 50, newcap : true, nomen : true, plusplus : true,
  regexp : true, sloppy : true, vars : true, white : true
*/
/*global */

//------------------------BEGIN MODULE SCOPE VARIABLES----------------------

'use strict';

var 
    setWatch,

    http = require('http'),
    express = require('express'),
    socketIo = require('socket.io'),
    fsHandle = require('fs'),

    app = express(),
    server = http.createServer(app),
    io = socketIo.listen(server),
    watchMap = {};

//-----------------------BEGIN UTILITY METHODS--------------------------------
setWatch = function (url_path, file_type) {
    if (url_path.indexOf('?') >= 0) {
        url_path = url_path.substring(0, url_path.indexOf('?'));
    }
    console.log('setWatch called on ' + url_path);

    if (!watchMap[url_path]) {
        console.log('setting watch on ' + url_path);

        fsHandle.watchFile(url_path.slice(1), function (current, previous) {
            console.log('file accessed');
            if (current.mtime !== previous.mtime) {
                console.log('file changed');
                io.sockets.emit(file_type, url_path);
            }
        });
        watchMap[url_path] = true;
    }
};

//-----------------------BEGIN SERVER CONFIGURATION---------------------------
app.configure(function () {
    app.use(function (request, response, next) {
        if (request.url.indexOf('/js/') >= 0) {
            setWatch(request.url, 'script');
        } else if (request.url.indexOf('/css/') >= 0) {
            setWatch(request.url, 'stylesheet');
        }
        next();
    });
    app.use(express.static(__dirname + '/'));
});
app.get('/', function (request, response) {
    response.redirect('/socket.html');
});

//-----------------------BEGIN START SERVER------------------------------------
server.listen(3000);
console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);