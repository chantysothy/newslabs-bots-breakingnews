const getContentStoreAsset = require( "./getContentStoreAsset" );
const getDataToDetermineHowToUpdateUsers = require( "./getDataToDetermineHowToUpdateUsers" );
const getLatestUpdate = require( "./getLatestUpdate" );
const storeNewVersionOfContent = require( "./storeNewVersionOfContent" );
const sendUpdateViaWorkerLambda = require( "./sendUpdateViaWorkerLambda" );

function messageIsFromCps ( msg ) {
	return msg.uri && msg.asset_type;
}

function getCpsIdFromUri ( uri ) {
	return uri.split( "/" ).slice( -2 ).join( "/" );
}

function getMessageFromEvent ( event ) {
	return JSON.parse( event.Records[0].Sns.Message );
}

function anyNewContent ( content ) {
	return content.length > 0;
}

function init ( event, done ) {

	const msg = getMessageFromEvent( event );

	if ( messageIsFromCps( msg ) ) {

    	const cpsId = getCpsIdFromUri( msg.uri );

    	getDataToDetermineHowToUpdateUsers( cpsId ).then( ( results ) => {

    		const subscribers = results[ 0 ];
    		const previousVersionOfContent = JSON.parse( results[ 1 ] );

    		if ( subscribers.length > 0 ) {
    		 	getContentStoreAsset( cpsId )
	    		 	.then( ( newVersionOfContent ) => {

	    		 		getLatestUpdate( newVersionOfContent, previousVersionOfContent )
			        		.then( ( latestUpdate ) => {

			        			if ( anyNewContent( latestUpdate.content ) ) {

			        				console.log( "sending the following to all subscribers..." );
			        				console.log( JSON.stringify( latestUpdate ) );

					        		subscribers.forEach( ( subscriber ) => {
					        			sendUpdateViaWorkerLambda( subscriber, cpsId, latestUpdate );
					        		});

					        		storeNewVersionOfContent( cpsId, latestUpdate )
					        			.then( done )
					        			.catch( console.log );

					        	} else {

					        		console.log( "Determined there is no need to send more content from this update" );
					        		done();

					        	}

			        		})
			        		.catch( console.log );


	    		 	})
	    		 	.catch( console.log );
    		}

    	}).catch( console.log );

    }

}

module.exports = {
	"init": init
}