const mysql = require( "mysql" );

const utils      = require( "../utils" );
const getDbCreds = require( "../../lib/getDbCreds" );

const usersFollowingBreakingNewsStories  = "DROP TABLE usersFollowingBreakingNewsStories";
const breakingNewsStoryContentSentToUser = "DROP TABLE breakingNewsStoryContentSentToUser";

function dropTable( query ) {

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
	.then( () => { dropTable( usersFollowingBreakingNewsStories ) })
	.then( () => { dropTable( breakingNewsStoryContentSentToUser ) })
	.catch( console.log );