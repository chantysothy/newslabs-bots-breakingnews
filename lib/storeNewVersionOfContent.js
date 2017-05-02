const mysql           = require( "mysql" );
const getDbCreds = require( "./getDbCreds" );

function anyNewContent ( content ) {
	return content.length > 0;
}

module.exports = function storeNewVersionOfContent ( cpsId, latestUpdate ) {

	return new Promise( ( resolve, reject ) => {

		if ( anyNewContent( latestUpdate.content ) ) {

			getDbCreds()
				.then( ( dbCreds ) => {

			        var connection = mysql.createConnection( dbCreds );
			     
			        connection.connect();

			        const safeLatestUpdate = connection.escape( JSON.stringify( latestUpdate ) );

			        const query = `INSERT INTO breakingNewsStoryContentSentToUser( cpsId, content, created ) VALUES ( '${cpsId}', ${safeLatestUpdate}, '2017-04-29' )
						ON DUPLICATE KEY UPDATE content = ${safeLatestUpdate}`;

			        console.log( query );

			        connection.query( query, function ( err, results, fields ) {
			            if ( err ) {
			                reject( err );
			            } else {
			            	resolve();
			            }
			        });

			        connection.end();

			    })
			    .catch( console.log );

		} else {

			resolve();

		}

	});

}