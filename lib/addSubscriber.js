// create db entry, add CPS_ID and USER_ID
// push all details of story to user
const mysql = require( "mysql" );
const getDbCreds = require( "./getDbCreds" );

function typeOfDbError ( errorMsg ) {
	if ( errorMsg.substr( 0, 12 ) === "ER_DUP_ENTRY" ) {
		return "DUPLICATE";
	}
	return "UNKNOWN";
}

module.exports = function addSubscriber( userId, cpsId, messengerClient ) {

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
		            	messengerClient.sendMessage({
					        "userId": userId,
					        "message": "You are now receiving updates for the story [NAME OF STORY]"
					    })
					    	.then( resolve )
							.catch( reject );
					} else {
						console.log( typeOfDbError( err.message ) );
						if ( typeOfDbError( err.message ) === "DUPLICATE" ) {
							messengerClient.sendMessage({
						        "userId": userId,
						        "message": "You are already subscribed to [NAME OF STORY]"
						    });
						}
		                reject( "err" );
		         	}
		        });

		        connection.end();

		    })
		    .catch( console.log );

    });

}