// Get values from queue
// Loop through each CPS_ID (or use them all at once) to...
// Hit database, ask for any matches with CPS ID(s)
// If a match, get latest data from Content Store
// Diff the current version of the story to the previous one, find updates
// Batch process update push to each facebook userconst http  = require( "http" );

// arn:aws:lambda:eu-west-1:060170161162:function:breakingNewsSubscriber

let   AWS             = require( "aws-sdk" );
const xmlStringToJson = require( "xml2js" ).parseString;
const mysql           = require( "mysql" );

const getContentStoreAsset = require( "./lib/getContentStoreAsset" );
const getSubscribersAndPreviousVersionOfContentForCpsAsset = require( "./lib/getSubscribers" );
const getDbCreds = require( "./lib/getDbCreds" );


AWS.config.region = "eu-west-1";

const lambda = new AWS.Lambda();

function getLatestUpdate( newVersionOfContent, previousVersionOfContent ) {

	const whatToDoBasedOnWhatsBeenSent = {
		"NO_CONTENT": function getParagraphs () {
			
			let content;
			
			xmlStringToJson( newVersionOfContent.body, ( err, result ) => {
				
				content = [ newVersionOfContent.title, newVersionOfContent.summary].concat( result.body.paragraph.splice( 1, 4 ) );
			
			} );

			return {
				"content": content,
				"type": "PARAGRAPHS"
			};

		},
		"PARAGRAPHS": function getImages () {
			console.log( "send images" );

			const bodyImages = newVersionOfContent.media.images.body;

			let content = [];

			xmlStringToJson( newVersionOfContent.body, ( err, result ) => {
				
				result.body.image.forEach( ( imageRef ) => {

					const imageObj = bodyImages[ imageRef.$.id ];

					content.push({
						"id":   imageRef.$.id,
						"href": imageObj.href,
						"desc": imageObj.caption || imageObj.altText
					})

				});
			
			} );

			return {
				"content": content,
				"type": "IMAGES"
			};

		},
		"IMAGES": function getLatestImages () {

			console.log( "send new images" );

			const bodyImages = newVersionOfContent.media.images.body;

			let content = [];

			xmlStringToJson( newVersionOfContent.body, ( err, result ) => {
				
				const prevSentImageIds = previousVersionOfContent.content.map( ( image ) => image.id );
				
				result.body.image.forEach( ( imageRef ) => {

					const imageId = imageRef.$.id;

					const imageObj = bodyImages[ imageId ];

					if ( prevSentImageIds.indexOf( imageId ) === -1 ) {

						content.push({
							"id":   imageId,
							"href": imageObj.href,
							"desc": imageObj.caption || imageObj.altText
						});

					}

				});
			
			} );

			return {
				"content": content,
				"type": "IMAGES"
			};

		}
	};

	console.log( typeof previousVersionOfContent );

	if ( ( previousVersionOfContent === null ) || ( "type" in previousVersionOfContent === false ) ) {
		return whatToDoBasedOnWhatsBeenSent[ "NO_CONTENT" ]();
	}
	
	return whatToDoBasedOnWhatsBeenSent[ previousVersionOfContent.type ]();

}

function sendUpdateViaWorkerLambda ( subscriber, cpsId, message ) {
	const params = {
		"FunctionName": "breakingNewsQueueWorker",
		"InvocationType": "Event",
		"Payload": JSON.stringify({
			"subscriber": subscriber,
			"cpsId": cpsId,
			"message": message
		})
	};
	lambda.invoke(params, function(err, data) {
		if (err) {
			console.error(err, err.stack);
		} else {

			console.log( data );
		}
	});
}

function messageIsFromCps ( msg ) {
	return msg.uri && msg.asset_type;
}

function getCpsIdFromUri ( uri ) {
	return uri.split( "/" ).slice( -2 ).join( "/" );
}

function getMessageFromEvent ( event ) {
	return JSON.parse( event.Records[0].Sns.Message );
}

function storeNewVersionOfContent ( cpsId, latestUpdate ) {

	return new Promise( ( resolve, reject ) => {

		getDbCreds()
			.then( ( dbCreds ) => {

		        var connection = mysql.createConnection( dbCreds );
		     
		        connection.connect();

		        const safeLatestUpdate = connection.escape( JSON.stringify( latestUpdate ) );

		        const query = `INSERT INTO breakingNewsStoryContentSentToUser( cpsId, content, created ) VALUES ( '${cpsId}', ${safeLatestUpdate}, '2017-04-29' )
					ON DUPLICATE KEY UPDATE content = ${safeLatestUpdate}`;

		        console.log( query );

		        connection.query( query, function ( err, results, fields ) {
		            if ( err ) {
		                reject( err );
		            } else {
		            	resolve();
		            }
		        });

		        connection.end();

		    })
		    .catch( console.log );

	});

}

exports.handler = function ( event, context, callback ) {
    
	const msg = getMessageFromEvent( event );

	if ( messageIsFromCps( msg ) ) {

    	const cpsId = getCpsIdFromUri( msg.uri );

    	getSubscribersAndPreviousVersionOfContentForCpsAsset( cpsId ).then( ( results ) => {

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

		        		const latestUpdate = getLatestUpdate( newVersionOfContent, previousVersionOfContent );

		        		console.log( latestUpdate );

		        		subscribers.forEach( ( subscriber ) => {
		        			sendUpdateViaWorkerLambda( subscriber, cpsId, latestUpdate );
		        		});

		        		storeNewVersionOfContent( cpsId, latestUpdate )
		        			.then( context.done )
		        			.catch( console.log );

	    		 	})
	    		 	.catch( console.log );
    		}

    	});

    }


}
