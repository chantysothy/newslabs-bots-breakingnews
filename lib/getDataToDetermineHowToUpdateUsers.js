const mysql = require( "mysql" );
const getDbCreds = require( "./getDbCreds" );

module.exports = function getDataToDetermineHowToUpdateUsers( cpsId ) {

    return new Promise( ( resolve, reject ) => {

    	getDbCreds()
    		.then( ( dbCreds ) => {

		        var connection = mysql.createConnection( dbCreds );
		     
		        connection.connect();

		        const query = `SELECT * FROM usersFollowingBreakingNewsStories LEFT JOIN breakingNewsStoryContentSentToUser on ( usersFollowingBreakingNewsStories.cpsId = breakingNewsStoryContentSentToUser.cpsId ) WHERE usersFollowingBreakingNewsStories.cpsId = '${cpsId}'`;

		        connection.query( query, function ( err, results, fields ) {
		            if ( err ) {
		                reject( err );
		            } else {
		            	const subscribers = results.map( ( row ) => row.userId );
		            	const content = results[ 0 ].content;
		            	resolve( [ subscribers, content ] );
		            }
		        });

		        connection.end();

		    });

    });

}