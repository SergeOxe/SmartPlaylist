var Promise = require('bluebird');

var songsCollection;
var popularSongsCollection;


var setupSongs = function setupSongs(db){
    db.collection("Songs",function(err, data) {
        if(!err) {
            songsCollection = data;
        }else{
            console.log(err);
        }
    });
}

var setupPopular = function setupPopular(db){
    db.collection("Popular",function(err, data) {
        if(!err) {
            popularSongsCollection = data;
        }else{
            console.log(err);
        }
    });
}



//Get Sorted Playlist
var getSortedPlaylist = function getSortedPlaylist (Song){
    var defer = Promise.defer();
    //var key = replaceAll(" ","_",Song);
    var band = Song.split("-")[0].toLowerCase().trim();
    songsCollection.findOne({name: Song.toLowerCase()},function(err,data) {
        if (!data) {
            songsCollection.findOne({band:band},function(err,data) {
                if (!data) {
                    console.log("getSortedPlaylist err", err);
                    defer.resolve("Song was not found in our database");
                } else {
                    var sorted = data.playlist.sort(function(obj1, obj2) {
                        return obj2.rank - obj1.rank;
                    });
                    //console.log(sorted);
                    var result = "";
                    sorted.forEach(function(song) {
                        result += replaceAll("_"," ",song.suggest) + " \n";
                    });
                    defer.resolve(result);
                }
            });
        }else{
            var sorted = data.playlist.sort(function(obj1, obj2) {
                return obj2.rank - obj1.rank;
            });
            //console.log(sorted);
            var result = "";
            sorted.forEach(function(song) {
                var songName = song.suggest.charAt(0).toUpperCase() + song.suggest.slice(1);
                result += replaceAll("_"," ",songName) + " \n";
            });
            defer.resolve(result);
        }
    });
    return defer.promise;
};

var getPopularPlaylist = function getPopularPlaylist (){
    var defer = Promise.defer();
    popularSongsCollection.find({}).sort({rank:-1}).limit(40).toArray(function(err,data) {
        if (data) {
            var result = "";
            data.forEach(function (song) {
                var songName = song.name.charAt(0).toUpperCase() + song.name.slice(1);
                result += songName.replace("  "," - ") + "  (" + song.rank +")"+ '\n';
            });
            //console.log(result);
            defer.resolve(result);
        }
    });
    return defer.promise;
}

function replaceAll(find, replace, str) {
    return str.replace(new RegExp(find, 'g'), replace);
}


module.exports.setupSongs = setupSongs;
module.exports.setupPopular = setupPopular;
module.exports.getSortedPlaylist = getSortedPlaylist;
module.exports.getPopularPlaylist = getPopularPlaylist;