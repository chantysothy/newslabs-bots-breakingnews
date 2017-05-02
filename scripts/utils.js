const fs              = require( "fs" );
const archiver        = require( "archiver" );
const request         = require( "request" );
const path            = require( "path" );
const fse             = require( "fs-extra" );
const cmd             = require( "node-cmd" );
const commandLineArgs = require( "command-line-args" );

const toolsConfig     = require( `${process.cwd()}/toolsConfig.json` );

function setRegion( AWS ) {
    const toolsConfig = require( `${process.cwd()}/toolsConfig.json` );
    AWS.config.region = toolsConfig.region;
}

function getCliOptions() {
    var optionDefinitions = [
        { "name": "aws_profile", "type": String },
        { "name": "bbc_bastion", "type": Boolean, "default": false },
        { "name": "lambda_name", "type": String, "default": false }
    ];
    return commandLineArgs( optionDefinitions );
}

function authenticate() {

    return new Promise( ( resolve, reject ) => {

        function addOptionsToEnvVars( options ) {
            process.env.LAMBDA_NAME = options.lambda_name;
        }

        const options = getCliOptions();

        if ( options.bbc_bastion ) {

            authenticateAgainstBastionService()
                .then( () => {
                    addOptionsToEnvVars( options );
                    resolve();
                });
            return;

        }

        if ( options.aws_profile ) {

            process.env.AWS_PROFILE = options.aws_profile;
            addOptionsToEnvVars( options );
            resolve();
            return;

        }

        reject( "No login credentials supplied" );

    });

}

function authenticateAgainstBastionService() {

    return new Promise( ( resolve, reject ) => {

        const certPath = path.resolve( toolsConfig.bastionService.certPath );
        const requestOptions = {
            url: toolsConfig.bastionService.endpoint,
            agentOptions: {
                cert: fs.readFileSync( certPath ),
                key:  fs.readFileSync( certPath ),
                ca:   fs.readFileSync( toolsConfig.bastionService.cloudServicesRoot )
            }
        };

        request.get( requestOptions, function ( error, response, body ) {

            if ( error || ( response && response.statusCode !== 200 ) ) {
            
                const statusCode = ( response && response.statusCode ) ? response.statusCode : 'no code';
                const errorMessage = `Unable to authenticate to AWS using the wormhole (Code: ${statusCode})`;

                reject( errorMessage );
            
            } else {
            
                const credentials = JSON.parse(body);

                process.env.AWS_ACCESS_KEY_ID     = credentials.accessKeyId;
                process.env.AWS_SECRET_ACCESS_KEY = credentials.secretAccessKey;
                process.env.AWS_SESSION_TOKEN     = credentials.sessionToken;

                resolve();

            }

        });

    });

}

function copy( src, dest ) {

    return new Promise( ( resolve, reject ) => {

        console.log( "Copying " + src + " to " + dest );

        fse.copy( src, dest, ( err ) => {
            if ( err ) {
                reject ( err );
            } else {
                resolve();
            }
        });

    });

}

function copyAllFilesInTmpDir() {
    return new Promise( ( resolve, reject ) => {
        fse.remove( "./tmp", ( err ) => {

            fse.ensureDir( "./tmp", ( err ) => {

                const config = getLambdaConfigFile();

                const stuffToCopy = [
                    "node_modules",
                    "package.json"
                ].concat( config.userDefinedCodeToDeploy );

                Promise.all(
                    stuffToCopy.map( ( item ) => copy( `./${item}`, `./tmp/${item}` ) )
                )
                    .then( resolve )
                    .catch( reject );

            });

        });

    });
}

function pruneNpmModules() {

    return new Promise( ( resolve, reject ) => {

        console.log( "Pruning the node_modules..." );

        cmd.get( "cd tmp && npm prune --production && npm list", ( stdout ) => {

            console.log( stdout );

            resolve();

        });

    });
}

function zipFiles() {

    return new Promise( ( resolve, reject ) => {

        console.log( "Creating the zip file..." );

        const zipFilePath = `./tmp/bot${Date.now()}.zip`

        var output = fs.createWriteStream( zipFilePath );
        var archive = archiver( "zip", {
            "store": true 
        });
     
        output.on( "close", () => {
            console.log( `Upload size: ${formatBytes( archive.pointer() )} / 50 MB (max)` );
            resolve( zipFilePath )
        });
     
        archive.on( "error", ( err ) => {
            console.log( "Deploy didn't work :-(" );
            reject( err );
        });
     
        archive.pipe( output );
     
        const config = getLambdaConfigFile();

        const stuffToZip = [
            "node_modules"
        ].concat( config.userDefinedCodeToDeploy );

        stuffToZip.forEach( ( item ) => {
            console.log( `adding ${item}` );
            if ( fs.lstatSync( item ).isDirectory() ) {
                archive.directory( `./tmp/${item}`, item )
            } else {
                archive.file( `${__dirname}/../tmp/${item}`, { name: item } );
            }
        });

        archive.finalize();

    });

}

function formatBytes(bytes,decimals) {
   if(bytes == 0) return '0 Bytes';
   var k = 1000,
       dm = decimals + 1 || 3,
       sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
       i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function addValueToLambdaConfig ( property, value ) {

    const config = getLambdaConfigFile( process.env.LAMBDA_NAME );
    config[ property ] = value;
    fs.writeFileSync( getLambdaFilePath( process.env.LAMBDA_NAME ), JSON.stringify( config, null, " " ) );

}

function getLambdaConfigFile() {

    return JSON.parse( fs.readFileSync( getLambdaFilePath( process.env.LAMBDA_NAME ) ) );

}

function getLambdaFilePath( lambdaName ) {

    return `${process.cwd()}/${lambdaName}.lambdaConfig.json`;

}

module.exports = {
    "addValueToLambdaConfig": addValueToLambdaConfig,
    "authenticate": authenticate,
    "copyAllFilesInTmpDir": copyAllFilesInTmpDir,
    "getLambdaConfigFile": getLambdaConfigFile,
    "getLambdaFilePath": getLambdaFilePath,
    "pruneNpmModules": pruneNpmModules,
    "setRegion": setRegion,
    "zipFiles": zipFiles
}