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

exports.handler = function ( event, context, callback ) {
    
	const msg = getMessageFromEvent( event );

	if ( messageIsFromCps( msg ) ) {

    	const cpsId = getCpsIdFromUri( msg.uri );

    	getDataToDetermineHowToUpdateUsers( cpsId ).then( ( results ) => {

    		const subscribers = results[ 0 ];
    		const previousVersionOfContent = JSON.parse( results[ 1 ] );

    			// 		{
    			// 			"content": [{
    			// 				id: '95273937',
							//     href: 'http://c.files.bbci.co.uk/120D1/production/_95273937_attacker_ap.jpg',
							//     desc: 'A man believed to be the suspect received medical treatment'
							// }, {
							// 	id: '95273935',
							//     href: 'http://c.files.bbci.co.uk/D2B1/production/_95273935_line976.jpg',
							//     desc: 'line'
							// }],
							// "type": "IMAGES"
    			// 		}

    		// 			{
	    	// 	 			"content": [
	    	// 				   "BBC News - London attack: Two killed in Westminster 'terror' incident",
						// 		  "Police officer is stabbed in Parliament and a women among several people struck by car on nearby bridge.",
						// 		  "The woman was among several pedestrians struck by a car on Westminster bridge, before it crashed into railings.",
						// 		  "An officer was stabbed in the Houses of Parliament by an attacker, who was shot by police.",
						// 		  "Police said there were \"a number of casualties\" and a \"full counter-terrorism inquiry\" was under way.",
						// 		  "Prime Minister Theresa May is to chair a meeting of the government's emergency Cobra committee later." ],
						// 	"type": "PARAGRAPHS"
						// };


    		if ( subscribers.length > 0 ) {
    		 	getContentStoreAsset( cpsId )
	    		 	.then( ( newVersionOfContent ) => {

		        		getLatestUpdate( newVersionOfContent, previousVersionOfContent )
			        		.then( ( latestUpdate ) => {

				        		console.log( latestUpdate );

				        		subscribers.forEach( ( subscriber ) => {
				        			sendUpdateViaWorkerLambda( subscriber, cpsId, latestUpdate );
				        		});

				        		storeNewVersionOfContent( cpsId, latestUpdate )
				        			.then( context.done )
				        			.catch( console.log );

			        		})
			        		.catch( console.log );


	    		 	})
	    		 	.catch( console.log );
    		}

    	});

    }


}
