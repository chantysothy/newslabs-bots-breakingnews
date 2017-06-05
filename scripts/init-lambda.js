const fs = require( "fs" );

const utils = require( "./utils" );

const defaultLambdaTemplate = `
exports.handler = function ( event, context, callback ) {
	// Start here
}
`;

const defaultFunctionTemplate = `
{
	"memorySize": 128,
	"name": "",
	"description": "",
	"handler": "queueWorker/index.handler",
	"runtime": "nodejs6.10",
	"timeout": 3,
	"userDefinedCodeToDeploy": [],	
    "deployedAssets": {
 	    "live": {}
    }
}
`;

function createLambdaDirectory () {
	return new Promise( ( resolve ) => {
		const path = `${process.cwd()}/${process.env.LAMBDA_NAME}`;
		if ( !fs.existsSync( path ) ){
		    fs.mkdirSync( path );
		}
		resolve();
	});
}

function createFile ( fileName, template) {
	return new Promise( ( resolve ) => {
		const path = `${process.cwd()}/${process.env.LAMBDA_NAME}/${fileName}`;
		if ( !fs.existsSync( path ) ) {
			fs.writeFile( path, template );
			resolve();
		}
	});
}

createLambdaDirectory()
	.then( createFile( "index.js", defaultLambdaTemplate ) )
	.then( createFile( "function.json", defaultFunctionTemplate ) )
	.catch( console.log );