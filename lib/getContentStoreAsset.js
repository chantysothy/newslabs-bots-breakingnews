const http  = require( "http" );

const getSecrets = require( "./getSecrets" );

const apiKey = "ngahuwtYCQwg7iopcWGm0VXsAcYjjGIN";

module.exports = function getContentStoreAsset( cpsAssetId ) {

    return new Promise( ( resolve, reject ) => {

        getSecrets( "apigee" ).then( ( apigeeSecret ) => {

            const requestParams = {
              hostname: "content-api-a127.api.bbci.co.uk",
              path:     `/asset/${cpsAssetId}?api_key=${apigeeSecret}`,
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
                reject( err );
            });

            req.end();

        });

    });

}