const getSecrets = require( "./getSecrets" );

module.exports = function getContentStoreAsset() {
	return new Promise( ( resolve, reject ) => {
		getSecrets( "DB_PASSWORD" ).then( ( dbPassword ) => {
			resolve({
	            host     : process.env.DB_HOST,
	            user     : "admin",
	            password : dbPassword,
	            database : "BreakingNewsBot"
	        });
		}).catch( reject );
	});
}