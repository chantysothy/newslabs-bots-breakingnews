const mysql = require( "mysql" );
const getDbCreds = require( "./getDbCreds" );

function removeSubscriberFromDb( userId, cpsId ) {

	return new Promise( ( resolve, reject ) => {

    	getDbCreds()
    		.then( ( dbCreds ) => {

		        var connection = mysql.createConnection( dbCreds );
		     
		        connection.connect();

		        const query = `DELETE FROM usersFollowingBreakingNewsStories WHERE id = '${cpsId}--${userId}'`;

		        connection.query( query, ( error, results, fields ) => {
		            if ( error ) {
		                reject( error );
		            } else {
		                resolve();
		            }
		        });

		        connection.end();

		    });

    });

}

function tellUserTheyAreUnsubscribed( userId, messengerClient ) {
	messengerClient.sendMessage({
        "userId":  userId,
        "message": "You have been unsubscribed"
    });
}

module.exports = function removeSubscriber( userId, cpsId, messengerClient ) {

	return removeSubscriberFromDb( userId, cpsId )
		.then( ()=> {
			tellUserTheyAreUnsubscribed( userId, messengerClient );
		});

}