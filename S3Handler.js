var AWS;
var s3;
var BucketName = "serge-final";
var generalCollection;

var setAws = function setAws(aws){
    AWS = aws;
    s3 = new AWS.S3();
};



var uploadToS3 =  function uploadToS3(request, reply){
    //console.log(request.payload.fileUpload);
    var data = request.payload.fileUpload;
    if (data){
        var fileData = data._data;
    }else{
        //console.log("request.payload.fileUpload was null");
        return;
    }

    generalCollection.update({},{uniqueId:fileName},function(err,data) {
    });

    s3.putObject({Bucket: BucketName, Key: "input/"+fileName, Body: fileData}, function (err, data) {
        if (err) {
            console.log("File didn't uploaded");
            reply("File didn't Uploaded")

        } else {
            console.log("uploaded");
            reply("File Uploaded successfully")
        }
    })};

var uploadToS3Playlist =  function uploadToS3Playlist(url,data, reply){
    //uniqueId ++;
    //var fileName = uniqueId;
    //generalCollection.update({},{uniqueId:fileName},function(err,data) {
    //});
    var start = url.indexOf("list=")+5;
    var fileName = url.substring(start,url.length);

    s3.putObject({Bucket: BucketName, Key: "input/"+fileName+".txt", Body: data}, function (err, data) {
        if (err) {
            console.log("File didn't uploaded");
            //reply("File didn't Uploaded")

        } else {
            console.log("uploaded");
            //reply("File Uploaded successfully")
        }
    })};


module.exports.uploadToS3 = uploadToS3;
module.exports.setAws = setAws;
module.exports.uploadToS3Playlist = uploadToS3Playlist;