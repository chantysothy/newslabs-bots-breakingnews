const AWS   = require( "aws-sdk" );

var secrets = null;

module.exports = function getSecret ( secret ) {

    return new Promise( ( resolve, reject ) => {

        if ( !secrets ) {

            const s3 = new AWS.S3({
                "params": {
                    "Bucket": "bot-experiments"
                },
                "signatureVersion": "v4"
            });

            s3.getObject( {
                "Key": "breaking-news/secrets.json"
            }, function( err, raw ) {
                if ( !err ) {
                    const buf = new Buffer( raw.Body );
                    secrets = JSON.parse( buf.toString( "utf8" ) );
                    resolve( secrets[ secret ] );
                } else {
                    reject( err );
                }
            });

        } else {

            resolve( secrets[ secret ] );

        }

    });
}