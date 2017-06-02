var AWS = require( "aws-sdk" );

const utils = require( "./utils" );

const projectConfig = utils.getProjectConfig();

AWS.config.region = projectConfig.region;

function commandLineArgsAreValid () {

	let varName = process.env.VAR_NAME;
	return ( varName !== null ) && ( projectConfig.environmentVariables[ varName ] !== undefined );

}

function decrypt () {

	return new Promise( ( resolve, reject ) => {

		if ( commandLineArgsAreValid() ) {

			let varName = process.env.VAR_NAME;

			let kms = new AWS.KMS();

			const params = {
				"CiphertextBlob": new Buffer( projectConfig.environmentVariables[ varName ], "base64" )
			};

			kms.decrypt(params, function(err, data) {
				if (err) {
					reject( err );
				} else {
					console.log( data.Plaintext.toString() );
					resolve();
				}
			});

		} else {
			reject( "ERROR: no variable defined. Please use the `--var_name` option to state a var to decrypt" );
		}

	});

}

utils.authenticate()
	.then( decrypt )
	.catch( console.log );