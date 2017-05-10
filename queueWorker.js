const MessengerClient = require( "./lib/MessengerClient" );
const getSecrets      = require( "./lib/getSecrets" );

var mc;

const sendOptions = {

	"IMAGES": function sendImages ( userId, cpsId, content ) {

		content.forEach( ( image ) => {

	        mc.sendImage({
				"userId": userId,
				"url":    image.href,
				"quickReplies": [{
					"text": "Unsubscribe",
					"payload": {
						"type": "UNSUBSCRIBE",
	                	"cpsId": cpsId
					}
				}]
			}).catch( console.log );

		});

	},

	"PARAGRAPHS": function sendParagraphs ( userId, cpsId, content ) {

		mc.sendMessage({
			"userId":       userId,
			"message":      content.join( "\n\n" ),
			"quickReplies": [{
				"text": "Unsubscribe",
				"payload": {
					"type": "UNSUBSCRIBE",
                	"cpsId": cpsId
				}
			}]
		}).catch( console.log );

	}

};

exports.handler = function ( event, context, callback ) {

	getSecrets( "messenger" ).then ( ( messengerSecrets ) => {

		mc = new MessengerClient( messengerSecrets );

		sendOptions[ event.message.type ]( event.subscriber, event.cpsId, event.message.content );

	}).catch( console.log );

}