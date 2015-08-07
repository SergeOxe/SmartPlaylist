var Hapi = require('hapi');
var MongoClient = require('mongodb').MongoClient;
var mongoHandler = require('./mongoHandler');
var youtubeHandler = require('./YoutubeToPlaylist');


var db;

// Connect to the db
MongoClient.connect("mongodb://Serge:serge5958164@ds031852.mongolab.com:31852/finalproj", function(err, data) {
    if (!err) {
        console.log("We are connected");
        db = data;
        mongoHandler.setupPopular(db);
        mongoHandler.setupSongs(db);
    } else {
        console.log(err);
    }
});





// Create a server with a host and port
var server = new Hapi.Server();
server.connection({
    port: 8080
});

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply.file('index.html');
    }
});


server.route({
    method: 'GET',
    path:'/generatePlaylistBySong/{key}',
    handler: function (request, reply) {
        mongoHandler.getSortedPlaylist(request.params.key).then(function(data){
            reply(data);
        });
    }
});

server.route({
    method: 'GET',
    path:'/getPlaylist/{key}',
    handler: function (request, reply) {
        youtubeHandler.displayPlayList(request.params.key,reply);
    }
});



server.route({
    method: 'GET',
    path:'/getPopularPlaylist',
    handler: function (request, reply) {
        mongoHandler.getPopularPlaylist().then(function (data) {
            reply(data);
        });
    }
});



// Start the server
server.start((function (){
    console.log("Server running on port: "+ server.info.uri)
}));
