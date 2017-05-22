var AWS      = require( "aws-sdk" );
const fs     = require( "fs" );
const _      = require( "lodash" );
const chalk  = require( "chalk" );
const moment = require( "moment" );
var os       = require( "os");

const utils = require( "./utils" );

const toolsConfig = require( `${process.cwd()}/toolsConfig.json` );

AWS.config.region = toolsConfig.region;

function getLogName() {

	if ( process.env.LAMBDA_NAME !== "null" ) {
		const config = utils.getLambdaConfigFile();
		return `/aws/lambda/${config.name}`;
	}

	const options = utils.getOptions();

	if ( options.group_name ) {
		return `/aws/lambda/${options.group_name}`
	}

	throw new Error("Unable to determine which log group name to use.");
}

function getLogs() {

	return new Promise( ( resolve, reject ) => {

		const cloudwatchlogs = new AWS.CloudWatchLogs();

		const params = {
			"logGroupName": getLogName(),
			"descending":   true,
			"limit":        50,
			"orderBy":      "LastEventTime"
		};

		cloudwatchlogs.describeLogStreams( params, function( err, data ) {

			if ( err )  {

				reject( err );

			} else {

				resolve(
					_.chain( data.logStreams )
						.filter( stream => stream.logStreamName.includes( "[$LATEST]" ) )
						.map( "logStreamName" )
						.value()
				);

			}

		});

	});

}

function formatLogEvent( msg ) {

	const dateFormat = "YYYY-MM-DD HH:mm:ss.SSS (Z)";

	if ( msg.startsWith( "REPORT" ) ) {
		msg += os.EOL;
	}

	if ( msg.startsWith( "START" ) || msg.startsWith( "END" ) || msg.startsWith( "REPORT" ) ) {

		return chalk.gray( msg );

	} else if ( msg.trim() === "Process exited before completing request" ) {

		return chalk.red(msg);

	}

	const splitted = msg.split( "\t" );

	if ( splitted.length < 3 || new Date( splitted[ 0 ] ) === "Invalid Date" ) {
		return msg;
	}

	const reqId = splitted[ 1 ];
	const time = chalk.green( moment( splitted[ 0 ] ).format( dateFormat ) );
	const text = msg.split( `${reqId}\t` )[ 1 ];

	return `${time}\t${chalk.yellow(reqId)}\t${text}`;

};

function showLogs( logStreamNames ) {
    
    return new Promise( ( resolve, reject ) => {

    	console.log( "Requesting logs..." );

    	const options = utils.getOptions();

		const cloudwatchlogs = new AWS.CloudWatchLogs();
		
		const params = {
			"logGroupName":   getLogName(),
			"interleaved":    true,
			"logStreamNames": logStreamNames
		};

		if ( options.search ) {
			params.filterPattern = options.search;
		}

		if ( options.start_time ) {

			const since = ( [ "m", "h", "d" ].indexOf( options.start_time[ options.start_time.length - 1 ] ) !== -1 );

			if ( since ) {

				params.startTime = moment().subtract(
					options.start_time.replace( /\D/g, ""),
					options.start_time.replace( /\d/g, "")
				).valueOf();

			} else {

				params.startTime = moment.utc( options.start_time ).valueOf();

			}

		}

		cloudwatchlogs.filterLogEvents( params, function( err, data ) {

			if ( err ) {
				reject( err );
			}
			if ( data.events ) {
	        	data.events.forEach( ( e ) => {

	            	process.stdout.write( formatLogEvent( e.message ) );

	          	});
	        }

	        // If we tail the logs then we need to set the
	        // start time from the last possible event
	        if ( options.tail && ( data.events.length > 0) ) {

	        	options.start_time = data.events.pop().timestamp + 1;

	        }

	        // If we are tailing the logs, or there is another
	        // page of logs then recurse back into the function
	        if ( options.tail || data.nextToken ) {

	        	setTimeout( () => {
	        		showLogs( logStreamNames, ( data.nextToken || null ) );
	        	}, 1000);
	        }

	        resolve();

		});

	});

}

utils.authenticate()
    .then( getLogs )
    .then( showLogs )
    .catch( console.log );