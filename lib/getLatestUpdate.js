const xmlStringToJson = require( "xml2js" ).parseString;

const getSummary = require( "./getSummaryFromCpsAsset" );

module.exports = function getLatestUpdate( newVersionOfContent, previousVersionOfContent ) {

	return new Promise( ( resolve, reject ) => {

		const whatToDoBasedOnWhatsBeenSent = {
			"NO_CONTENT": getSummary,
			"PARAGRAPHS": function getImages ( newVersionOfContent, previousVersionOfContent ) {
				console.log( "send images" );

				const bodyImages = newVersionOfContent.media.images.body;

				let content = [];

				xmlStringToJson( newVersionOfContent.body, ( err, result ) => {

					result.body.image && result.body.image.forEach( ( imageRef ) => {

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
			"IMAGES": function getLatestImages ( newVersionOfContent, previousVersionOfContent ) {

				console.log( "send new images" );

				const bodyImages = newVersionOfContent.media.images.body;

				let content = [];

				xmlStringToJson( newVersionOfContent.body, ( err, result ) => {
					
					const prevSentImageIds = previousVersionOfContent.content.map( ( image ) => image.id );
					
					result.body.image && result.body.image.forEach( ( imageRef ) => {

						const imageId = imageRef.$.id;

						const imageObj = bodyImages[ imageId ];

						function imageIsNotAHrTag ( imageObj ) {
							let imageIsAHrTag = ( ( imageObj.altText === "line" ) && ( imageObj.positionHint === "body-width" ) );
							return !imageIsAHrTag;
						}

						if ( 
							( prevSentImageIds.indexOf( imageId ) === -1 ) &&
							imageIsNotAHrTag( imageObj )
						) {

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
			resolve( whatToDoBasedOnWhatsBeenSent[ "NO_CONTENT" ]( newVersionOfContent ) );
		}
		
		resolve( whatToDoBasedOnWhatsBeenSent[ previousVersionOfContent.type ]( newVersionOfContent, previousVersionOfContent ) );

	});

}