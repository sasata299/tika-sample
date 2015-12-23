console.log('Loading function');

var aws = require('aws-sdk');
var s3 = new aws.S3({ apiVersion: '2006-03-01' });

var tika = require('tika');

exports.handler = function(event, context) {
    console.log('Received event:', JSON.stringify(event, null, 2));

    var bucket = event.Records[0].s3.bucket.name;
    var key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    var params = {
        Bucket: bucket,
        Key: key
    };
    s3.getObject(params, function(err, data) {
        if (err) {
            console.log(err);
            var message = "Error getting object " + key + " from bucket " + bucket +
                ". Make sure they exist and your bucket is in the same region as this function.";
            context.fail(message);
        } else {
            console.log('CONTENT TYPE:', data.ContentType);
            console.log('KEY:', key);

            var url = "https://s3-" + event.Records[0].awsRegion+ ".amazonaws.com/" + bucket + "/" + key;
            console.log(url);

            tika.text(url, function(err, text) {
                if (err) {
                    context.fail(err);
                } else {
                    s3.putObject({
                        Bucket: bucket,
                        Key: key + ".txt", // S3にUPするファイル名
                        Body: text
                    }, function(err, data) {
                        if (err) {
                          context.fail(err);
                        } else {
                          context.succeed("Successfully finished");
                        }
                    });
                }
            });
        }
    });
};
