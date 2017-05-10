var AWS                    = require( "aws-sdk" );
const utils                = require( "./utils" );
const apiGateway           = require( "./lib/apigateway" );
var cloudformationTemplate = require( "./templates/api-gateway-for-lambda-based-messenger-service.json" );

utils.setRegion( AWS );

function updateApiGateway () {
	return new Promise( ( resolve, reject ) => {
		
		const config = utils.getLambdaConfigFile();

    	var cloudformation = new AWS.CloudFormation({apiVersion: '2010-05-15'});

        // Do something here if you want to edit cloudformation config

    	var params = {
    	    "StackName": config.name,
    	    "Capabilities": [ "CAPABILITY_IAM" ],
            "Parameters": [{
                "ParameterKey":     "LambdaARN",
                "ParameterValue":   config.lambdaArn,
                "UsePreviousValue": false
    	    },{
                "ParameterKey":     "ApiName",
                "ParameterValue":   config.name,
                "UsePreviousValue": false
            },{
                "ParameterKey":     "ApiDescription",
                "ParameterValue":   config.description,
                "UsePreviousValue": false
            }],
    	    "TemplateBody": JSON.stringify( cloudformationTemplate ),
    	};
    	cloudformation.updateStack(params, ( err, data ) => {
    	    if ( err ) {
                reject( err );
            } else {
                resolve();
            }
    	});

	});
}

utils.authenticate()
    // .then( updateApiGateway )
    .then( apiGateway.addConsoleOutputHeaders )
    .then( apiGateway.checkStackStatus )
    .then( apiGateway.displayStackOutputs )
    .catch( console.log );