const getContentStoreAsset = require( "./lib/getContentStoreAsset" );
const getDataToDetermineHowToUpdateUsers = require( "./lib/getDataToDetermineHowToUpdateUsers" );
const getLatestUpdate = require( "./lib/getLatestUpdate" );
const storeNewVersionOfContent = require( "./lib/storeNewVersionOfContent" );
const sendUpdateViaWorkerLambda = require( "./lib/sendUpdateViaWorkerLambda" );

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

exports.handler = function ( event, context, callback ) {
    
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
					        			.then( context.done )
					        			.catch( console.log );

					        	} else {

					        		console.log( "Determined there is no need to send more content from this update" );
					        		context.done();

					        	}

			        		})
			        		.catch( console.log );


	    		 	})
	    		 	.catch( console.log );
    		}

    	});

    }


}
