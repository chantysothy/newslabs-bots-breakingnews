const mysql = require( "mysql" );

const utils      = require( "../utils" );
const getDbCreds = require( "../../lib/getDbCreds" );

const usersFollowingBreakingNewsStories  = "CREATE TABLE usersFollowingBreakingNewsStories ( id VARCHAR(66) PRIMARY KEY, cpsId VARCHAR(50), userId VARCHAR(16) )";
const breakingNewsStoryContentSentToUser = "CREATE TABLE breakingNewsStoryContentSentToUser ( cpsId VARCHAR(50) PRIMARY KEY, content JSON, created DATETIME )";

function makeTable( query ) {

	return new Promise( ( resolve, reject ) => {

		getDbCreds()
    		.then( ( dbCreds ) => {

		        var connection = mysql.createConnection( dbCreds );
		     
		        connection.connect();

		        connection.query( query, function ( error, results, fields ) {

		            if (error) {
		                reject( error );
		            } else {
		            	console.log( results );
		            }

		            resolve();

		        });

		        connection.end();

		    })
		    .catch( reject );

    });

}

utils.authenticate()
	.then( utils.createFakeRunTimeRequirements )
	.then( () => { makeTable( usersFollowingBreakingNewsStories ) })
	.then( () => { makeTable( breakingNewsStoryContentSentToUser ) })
	.catch( console.log );