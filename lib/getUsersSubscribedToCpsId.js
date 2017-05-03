const mysql = require( "mysql" );
const getDbCreds = require( "./getDbCreds" );

module.exports = function getUsersSubscribedToCpsId( cpsId ) {

    return new Promise( ( resolve, reject ) => {

    	getDbCreds()
    		.then( ( dbCreds ) => {

		        var connection = mysql.createConnection( dbCreds );
		     
		        connection.connect();

		        const query = `SELECT * FROM usersFollowingBreakingNewsStories WHERE cpsId = '${cpsId}'`;

		        connection.query( query, function ( err, results, fields ) {
		            if ( err ) {
		                reject( err );
		            } else {
		            	const subscribers = results.map( ( row ) => row.userId );
		            	resolve( subscribers );
		            }
		        });

		        connection.end();

		    });

    });

}