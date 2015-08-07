/**
 * Created by User on 8/1/2015.
 */
var request = require('request');
var cheerio = require('cheerio');
var S3Handler = require('./S3Handler');
var Promise = require('bluebird');




function getPlaylistFromYoutubeUrl(url) {
    var defer  = Promise.defer();
    url = "https://www.youtube.com/watch?"+url;
    request(url, function (error, response, html) {
        var result = "";
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(html);
            var playlist = $("#watch-appbar-playlist").find('h4');
            var str = playlist.text();
            var lines = str.split(/\r?\n/);
            lines.forEach(function (line) {
                if (line.length > 0) {

                    line = line.replace("(Official)", "");
                    line = line.replace("[Official]", "");
                    line = line.replace("(Official Video)", "");
                    line = line.replace("[OFFICIAL VIDEO]", "");
                    line = replaceAll(" ", "_", line.trim());
                    if (line.length > 0) {
                        result += line + "\n";
                    }
                }
            });
            defer.resolve(result);
            //console.log(result);

        }
    });
    return defer.promise;
}

var displayPlayList = function displayPlayList(url,reply){
    if(url.indexOf("list")<0){
        reply("Sorry the link doesn't contains a list of songs");
        return;
    }
    getPlaylistFromYoutubeUrl(url).then(function(data){
        var result = "";
        var lines = data.split(/\r?\n/);
        lines.forEach(function (line) {
            if (line.length > 0) {
                line = replaceAll("_", " ", line.trim());
                if (line.length > 0) {
                    result += line + "<br>";
                }
            }
        });
        reply(result);
    })
}

var uploadPlaylistToS3 = function uploadPlaylistToS3(url,reply){
    if(url.indexOf("list")<0){
        reply("Sorry the link doesn't contains a list of songs");
        return;
    }
    getPlaylistFromYoutubeUrl(url).then(function(data){
        var result = "";
        var lines = data.split(/\r?\n/);
        lines.forEach(function (line) {
            if (line.length > 0) {
                line = replaceAll("_", " ", line.trim());
                if (line.length > 0) {
                    result += line + "\n";
                }
            }
        });
        reply(result);
    });

}

function replaceAll(find, replace, str) {
    return str.replace(new RegExp(find, 'g'), replace);
}

module.exports.displayPlayList = displayPlayList;
module.exports.uploadPlaylistToS3 = uploadPlaylistToS3;