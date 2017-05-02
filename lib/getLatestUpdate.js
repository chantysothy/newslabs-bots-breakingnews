const xmlStringToJson = require( "xml2js" ).parseString;

module.exports = function getLatestUpdate( newVersionOfContent, previousVersionOfContent ) {

	return new Promise( ( resolve, reject ) => {

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
			resolve( whatToDoBasedOnWhatsBeenSent[ "NO_CONTENT" ]() );
		}
		
		resolve( whatToDoBasedOnWhatsBeenSent[ previousVersionOfContent.type ]() );

	});

}