const AWS = require( "aws-sdk" );
AWS.config.region = "eu-west-1";

function getSecret ( varName ) {

    return new Promise( ( resolve, reject ) => {

        const kms = new AWS.KMS();

        const params = {
            "CiphertextBlob": new Buffer( process.env[ varName ], "base64" )
        };

        kms.decrypt( params, function( err, data ) {
            if ( err ) {
                reject( err );
            } else {
                resolve( data.Plaintext.toString() );
            }
        });

    });

}

function determineWhatIsToBeReturned ( secrets ) {

    let returnValue;
    if ( secrets.length === 1 ) {
        returnValue = secrets[ 0 ];
    } else {
        returnValue = secrets;
    }
    return Promise.resolve( returnValue );

}

module.exports = function getSecrets () {

    return new Promise( ( resolve, reject ) => {

        const secrets = Array.from( arguments );
        
        Promise
            .all( secrets.map( getSecret ) )
            .then( determineWhatIsToBeReturned )
            .then( resolve );

    });

}