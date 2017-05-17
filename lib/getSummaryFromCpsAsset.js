const xmlStringToJson = require( "xml2js" ).parseString;

function removeParasFromCpsTemplate ( paras ) {

	cpsTemplateParas = [
		"This breaking news story is being updated and more details will be published shortly. Please refresh the page for the fullest version.",
		"If you want to receive Breaking News alerts via email, or on a smartphone or tablet via the BBC News App then details on how to do so are available on this help page. You can also follow @BBCBreaking on Twitter to get the latest alerts."
	];

	return paras.map( ( para ) => {
		if ( cpsTemplateParas.indexOf( para ) > -1 ) {
			return "";
		} else {
			return para;
		}
	});

}

module.exports = function getParagraphs ( cpsStory ) {
				
	let content;
	
	xmlStringToJson( cpsStory.body, ( err, result ) => {
		
		const paras = result.body.paragraph.splice( 1, 4 );
		content = [ cpsStory.title, cpsStory.summary].concat( removeParasFromCpsTemplate( paras ) );
	
	} );

	return {
		"content": content,
		"type": "PARAGRAPHS"
	};

}