const mysql = require( "mysql" );
const getDbCreds = require( "./lib/getDbCreds" );
const getUsersSubscribedToCpsId = require( "./lib/getUsersSubscribedToCpsId" );
const removeSubscriber = require( "./lib/removeSubscriber" );
const MessengerClient  = require( "./lib/messengerClient" );
const getSecrets       = require( "./lib/getSecrets" );

function removeNewsStories ( cpsIds ) {

	return new Promise( ( resolve, reject ) => {

    	getDbCreds()
    		.then( ( dbCreds ) => {

		        var connection = mysql.createConnection( dbCreds );
		     
		        connection.connect();

		        const query = `DELETE FROM breakingNewsStoryContentSentToUser WHERE cpsId = '${cpsIds.join( "' OR cpsId = '" )}'`;

		        console.log( query );

		        connection.query( query, function ( err, results, fields ) {
		            if ( err ) {
		            	reject( err );
		            } else {
		            	resolve();
		            }
		        });

		        connection.end();

		    });

    });

}

function getOldBreakingNewsStories() {

	return new Promise( ( resolve, reject ) => {

    	getDbCreds()
    		.then( ( dbCreds ) => {

		        var connection = mysql.createConnection( dbCreds );
		     
		        connection.connect();

		        const query = `SELECT * FROM breakingNewsStoryContentSentToUser WHERE created <= subdate(current_date, INTERVAL 24 HOUR)`;

		        connection.query( query, function ( err, results, fields ) {
		            if ( err ) {
		            	console.log( err );
		            	reject( err );
		            } else {
		            	const cpsIds = results.map( row => row.cpsId );
		            	console.log( cpsIds );
		            	resolve( cpsIds );
		            }
		        });

		        connection.end();

		    }).catch( reject );

    });

}

function removeAndUnsubscribeAllUsersForCpsStory( cpsId ) {

	return new Promise( ( resolve, reject ) => {

		getUsersSubscribedToCpsId( cpsId ).then( ( userIds ) => {

			getSecrets( "messenger" ).then ( ( messengerSecrets ) => {

				userIds.forEach( ( userId ) => {

					let messengerClient = new MessengerClient( messengerSecrets );

					removeSubscriber( userId, cpsId, messengerClient ).catch( console.log );

				});

				resolve();

			});

		}).catch( console.log );

	});

}

function removeUserEntries ( cpsIds ) {

	return Promise.all( cpsIds.map( removeAndUnsubscribeAllUsersForCpsStory ) )
		.then( () => {
			return cpsIds;
		});

}

exports.handler = function removeOldBreakingNews( {}, context ) {

    getOldBreakingNewsStories()
    	.then( removeUserEntries )
    	.then( removeNewsStories )
    	.then( context.done )
    	.catch( console.log )

}