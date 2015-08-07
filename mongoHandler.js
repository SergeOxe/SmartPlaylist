var Promise = require('bluebird');
var AWS = require('aws-sdk');
var BucketName = "serge-final";
var fs = require('fs');

var s3;

var songsCollection;
var popularSongsCollection;

var setAws = function setAws(aws){
    AWS = aws;
    s3 = new AWS.S3();
};


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


var insertToMongoFromS3 = function insertToMongoFromS3(num) {
    var defer = Promise.defer();
    var params = {
        Bucket: BucketName,
        Marker : "output/"
    };

    s3.listObjects(params, function (err, data) {
        if (err) {
            console.log(err); // an error occurred
        } else {
            for (var key in data.Contents) {
                if(data.Contents[key].Key.indexOf("output/output"+num+".txt") > -1) {
                    console.log(data.Contents[key].Key);

                   insertFileToMongo(data.Contents[key].Key);
                }
                //saveOnDisk(data.Contents[key].Key);
            };
        }
    });
    //return defer.promise;
};


var insertPopularToMongoFromS3 = function insertPopularToMongoFromS3() {
    var defer = Promise.defer();
    var params = {
        Bucket: BucketName,
        Marker : "popular/"
    };

    s3.listObjects(params, function (err, data) {
        if (err) {
            console.log(err); // an error occurred
        } else {
            for (var key in data.Contents) {
                if( data.Contents[key].Key.indexOf("popular/") > -1) {
                    insertPopularFileToMongo(data.Contents[key].Key);
                }
            };
        }
    });
    //return defer.promise;
};


var insertFileToMongo = function insertFileToMongo(key){
    if(key == "_SUCCESS"){
        return;
    }
    //console.log(key);
    var defer = Promise.defer();
    var params = {
        Bucket: BucketName,
        Key: key
    };
    s3.getObject(params, function (err, data) {
        if (err) {
            console.log(err);
            defer.resolve(null);
            return;
        } else {
            var output = new Buffer(data.Body).toString('ascii');
            var lines = output.split(/\r?\n/);
            lines.forEach(function (line) {
                var playlist = [];
                //line  = line.trim();
                var key = line.split("\t")[0];
                var band = key.split("-")[0].toLowerCase();
                var values = line.replace(key,"").replace("\t","").split(",");
                values.forEach(function (value){
                    var suggest = value.split("#")[0];
                    if(suggest.trim().length > 3) {
                        var rank =  parseInt(value.split("#")[1]);
                        playlist.push({suggest: replaceAll("_"," ",suggest), rank: rank});
                    }
                });
                key = replaceAll("_"," ",key);
                //console.log(playlist.length );
                if(playlist.length > 4) {
                    songsCollection.insert({name: key, playlist: playlist, band:replaceAll("_"," ",band).toLowerCase()}, function (err, data) {
                        if (err) {
                            console.log(err);
                        } else {
                            //console.log("ok");
                        }
                    });
                }

            });

        }
        defer.resolve();
    });
    return defer.promise;
}

var insertPopularFileToMongo = function insertPopularFileToMongo(key){
    if(key == "_SUCCESS"){
        return;
    }
    var defer = Promise.defer();
    var params = {
        Bucket: BucketName,
        Key: key
    };
    s3.getObject(params, function (err, data) {
        if (err) {
            console.log(err);
            defer.resolve(null);
            return;
        } else {
            var output = new Buffer(data.Body).toString('ascii');

            var lines = output.split(/\r?\n/);
            lines.forEach(function (line) {
                //line = line.trim();
                var key1 = line.split('\t')[0];
                if (key1.length != 0) {
                    var value = parseInt(line.split('\t')[1]);
                    key1 = replaceAll("_"," ",key1);
                    popularSongsCollection.insert({name: key1, rank: value}, function (err, data) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("ok");
                        }
                    });
                }
            });

        }
        defer.resolve();
    });
    return defer.promise;
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

module.exports.insertToMongoFromS3 = insertToMongoFromS3;
module.exports.insertPopularToMongoFromS3 = insertPopularToMongoFromS3;
module.exports.setupSongs = setupSongs;
module.exports.setupPopular = setupPopular;
module.exports.getSortedPlaylist = getSortedPlaylist;
module.exports.getPopularPlaylist = getPopularPlaylist;
module.exports.setAws = setAws;