const getSecrets = require( "./getSecrets" );

module.exports = function getContentStoreAsset() {
	return new Promise( ( resolve, reject ) => {
		getSecrets( "dbPassword" ).then( ( dbPassword ) => {
			resolve({
	            host     : "breakingnewsbot.c3yszev3wvsh.eu-west-1.rds.amazonaws.com",
	            user     : "admin",
	            password : dbPassword,
	            database : "BreakingNewsBot"
	        });
		}).catch( reject );
	});
}