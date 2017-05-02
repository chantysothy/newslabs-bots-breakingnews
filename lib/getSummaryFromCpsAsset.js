const xmlStringToJson = require( "xml2js" ).parseString;

module.exports = function getParagraphs ( cpsStory ) {
				
	let content;
	
	xmlStringToJson( cpsStory.body, ( err, result ) => {
		
		content = [ cpsStory.title, cpsStory.summary].concat( result.body.paragraph.splice( 1, 4 ) );
	
	} );

	return {
		"content": content,
		"type": "PARAGRAPHS"
	};

}