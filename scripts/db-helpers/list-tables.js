const mysql = require( "mysql" );
const _     = require( "lodash" );

const utils      = require( "../utils" );
const getDbCreds = require( "../../lib/getDbCreds" );

function listUsers() {

	return new Promise( ( resolve, reject ) => {

		getDbCreds()
    		.then( ( dbCreds ) => {

		        var connection = mysql.createConnection( dbCreds );
		     
		        connection.connect();

		        const h = "SELECT * FROM usersFollowingBreakingNewsStories"

		        connection.query(h, function (error, results, fields) {

		            if (error) {
		                reject( error );
		            } else {
		            	process.stdout.write(`\n\n| ${_.padEnd( '', 119, '-' )} |\n`);
		            	process.stdout.write(`| ${_.padEnd( 'usersFollowingBreakingNewsStories', 119 )} |\n`);
		            	process.stdout.write(`| ${_.padEnd( '', 119, '-' )} |\n`);
		            	process.stdout.write(`| ${_.padEnd( 'cpsId', 0 )} | ${_.padEnd( 'userId', 16 )} |\n`);
		            	process.stdout.write(`| ${_.padEnd( '', 100, '-' )} | ${_.padEnd( '', 16, '-' )} |\n`);
		                results.forEach( ( result ) => {
		                	process.stdout.write(`| ${_.padEnd( result.cpsId, 100 )} | ${_.padEnd( result.userId, 16 )} |\n`);
		                });
		            	process.stdout.write(`| ${_.padEnd( '', 119, '-' )} |\n`);

		            }
		            
		            resolve();

		        });

		        connection.end();

		    })
		    .catch( reject );

    });

}

function listStories() {

	return new Promise( ( resolve ) => {

		getDbCreds()
    		.then( ( dbCreds ) => {

		        var connection = mysql.createConnection( dbCreds );
		     
		        connection.connect();

		        const h = "SELECT * FROM breakingNewsStoryContentSentToUser"

		        connection.query(h, function (error, results, fields) {

		            if (error) {
		                console.log( error );
		            } else {
		            	process.stdout.write(`\n\n| ${_.padEnd( '', 195, '-' )} |\n`);
		            	process.stdout.write(`| ${_.padEnd( 'breakingNewsStoryContentSentToUser', 195 )} |\n`);
		            	process.stdout.write(`| ${_.padEnd( '', 195, '-' )} |\n`);
		            	process.stdout.write(`| ${_.padEnd( 'cpsId', 50 )} | ${_.padEnd( 'created', 39 )} | ${_.padEnd( 'content', 100 )} |\n`);
		            	process.stdout.write(`| ${_.padEnd( '', 50, '-' )} | ${_.padEnd( '', 39, '-' )} | ${_.padEnd( '', 100, '-' )} |\n`);
		                results.forEach( ( result ) => {
		                	process.stdout.write(`| ${_.padEnd( result.cpsId, 50 )} | ${_.padEnd( result.created, 39 )} | ${_.padEnd( result.content, 100 )} |\n`);
		                });
		            	process.stdout.write(`| ${_.padEnd( '', 195, '-' )} |\n`);
		            }

		            resolve();

		        });

		        connection.end();

		    });

    });

}

utils.authenticate()
	.then( utils.createFakeRunTimeRequirements )
    .then( listUsers )
    .then( listStories )
    .catch( console.log );