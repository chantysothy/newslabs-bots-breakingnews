const mysql = require( "mysql" );
const getDbCreds = require( "./getDbCreds" );

module.exports = function getPreviousVersionOfContentForCpsAsset( cpsId ) {

    return new Promise( ( resolve, reject ) => {

    	getDbCreds()
    		.then( ( dbCreds ) => {

		        var connection = mysql.createConnection( dbCreds );
		     
		        connection.connect();

		        const query = `SELECT * FROM breakingNewsStoryContentSentToUser  WHERE cpsId = '${cpsId}'`;

		        console.log( query );

		        connection.query( query, function ( err, results, fields ) {
		            if ( err ) {
		            	console.log( "there is an error" );
		                reject( err );
		            } else {
		            	console.log( results );
		            	resolve( results[ 0 ] );
		            }
		        });

		        connection.end();

		    });

    });

}