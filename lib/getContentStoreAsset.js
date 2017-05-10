const http  = require( "http" );

const _ = require( "lodash" );
const getSecrets = require( "./getSecrets" );

const apiKey = "ngahuwtYCQwg7iopcWGm0VXsAcYjjGIN";
const config = require( "../settings.json" )[ process.env.NODE_ENV ];

function getPath ( cpsAssetId, apigeeSecret ) {
    _.templateSettings.interpolate = /\${([\s\S]+?)}/g;
    const compiled = _.template( config.contentStore.path );
    return compiled({
        "cpsAssetId":   cpsAssetId,
        "apigeeSecret": apigeeSecret
    });
}

module.exports = function getContentStoreAsset( cpsAssetId ) {

    return new Promise( ( resolve, reject ) => {

        getSecrets( "apigee" ).then( ( apigeeSecret ) => {

            const requestParams = {
              hostname: config.contentStore.hostname,
              path:     getPath( cpsAssetId, apigeeSecret ),
              method:   "GET",
              headers: {
                "x-candy-platform": "EnhancedMobile",
                "x-candy-audience": "domestic",
                "Accept": "application/json"
              }
            };

            var req = http.request( requestParams, ( res ) => {
                
                res.setEncoding( "utf8" );

                var raw = "";

                res.on( "data", ( d ) => {
                    raw += d;
                });

                res.on( "end", () => {

                    const responseBody = JSON.parse( raw ).results[ 0 ];
                                        
                    if ( res.statusCode === 200 ) {
                        resolve( responseBody );
                    } else {
                        reject( res.statusCode );
                    }

                });

            });

            req.on( "error", ( err ) => {
                console.log( requestParams.hostname + requestParams.path );
                reject( err );
            });

            req.end();

        }).catch( console.log );

    });

}