const mysql = require( "mysql" );
const getDbCreds = require( "./getDbCreds" );
const getContentStoreAsset = require( "./getContentStoreAsset" );
const getSummary = require( "./getSummaryFromCpsAsset" );


function typeOfDbError ( errorMsg ) {
	if ( errorMsg.substr( 0, 12 ) === "ER_DUP_ENTRY" ) {
		return "DUPLICATE";
	}
	return "UNKNOWN";
}

function addUserToUserTable( userId, cpsId ) {

	return new Promise( ( resolve, reject ) => {

    	getDbCreds()
    		.then( ( dbCreds ) => {

		        var connection = mysql.createConnection( dbCreds );
		     
		        connection.connect();

		        const query = `INSERT INTO usersFollowingBreakingNewsStories VALUES ('${cpsId}--${userId}', '${cpsId}', '${userId}')`;

		        console.log( query );

		        connection.query(query, function (err, results, fields) {
		            if ( !err ) {
		            	console.log( results );
		            	resolve( "SUBSCRIBED" );
					} else {
						console.log( typeOfDbError( err.message ) );
						if ( typeOfDbError( err.message ) === "DUPLICATE" ) {
							resolve( "ALREADY_SUBSCRIBED" );
						} else {
							reject( err.message );
						}
		         	}
		        });

		        connection.end();

		    })
		    .catch( console.log );

    });

}

module.exports = function addSubscriber( userId, cpsId, messengerClient ) {

    return new Promise( ( resolve, reject ) => {

    	addUserToUserTable( userId, cpsId )
    		.then( ( addUserResponse ) => {

    			getContentStoreAsset( cpsId )
	    		 	.then( ( cpsContent ) => {

		    			const userMessage = {
		    				"SUBSCRIBED":         `You are now receiving updates for the story "${cpsContent.title}"`,
		    				"ALREADY_SUBSCRIBED": `You are already subscribed to "${cpsContent.title}"`
		    			}

		    			const summary = getSummary( cpsContent );

		    			// Get rid of title from summary array
		    			summary.content.shift()

		    			messengerClient.sendMessage({
					        "userId": userId,
					        "message": userMessage[ addUserResponse ] + "\n\n" + summary.content.join( "\n\n" )
					    });

		    		})
		    		.catch( console.log );
    		})
    		.catch( console.log );

    });

}