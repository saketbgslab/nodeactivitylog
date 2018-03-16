//const Azure = require('azure');
const MsRest = require('ms-rest-azure');
const config = require('./azconfig');
const async  = require('async')
const ResourceManagementClient = require('azure-arm-resource').ResourceManagementClient;
var fs = require('fs');
var util = require('util');
var path = require('path');
var monitoring = require('azure-monitoring')
var SubscriptionManagementClient = require('azure-arm-resource').SubscriptionClient;


var resourceClient;
var subscriptionClient;
var resList;

//_________________CONFIG_______________________________________________
var clientId = config.loginConfig.clientId;
var domain  = config.loginConfig.domain;
var secret   = config.loginConfig.secret;
var subscriptionId  = config.loginConfig.subscriptionId;
var resourceGroupName = config.loginConfig.resourceGroupName;
var res = config.loginConfig.storageAccount ;
var deploymentName= 'saketClusterNodeApi';
var baseURI = config.baseURI;
//_________________CONFIG_______________________________________________


//________LOGIN SERVICE_________________________________________________
MsRest.loginWithServicePrincipalSecret(clientId, secret, domain, startExec );

function startExec(err, credentials) {
    if(err) return console.error(err)

    credentials.subscriptionId = subscriptionId;
    resourceClient = new ResourceManagementClient(credentials, subscriptionId);
    eventClient = monitoring.createEventsClient(credentials, baseURI);


    resourceClient.resources.listByResourceGroup(resourceGroupName, function(err, result, request, response){

        if(err) {return console.log()}
       // console.log('\n\n\t res ' + JSON.stringify(result, 0,4) );
        fs.writeFileSync('./imb-gsl/resList.json', JSON.stringify(result, 0,4), 'utf-8');
        resList = result;
        getResourceLogs(result);
        
    });


}

function getResourceLogs(resList){
    var params = {};
    var MS_PER_MINUTE = 60000;
    var durationInMinutes = 43200;
    var myStartDate = new Date(Date.now() - durationInMinutes * MS_PER_MINUTE);
    params.startTime = myStartDate;
        
    async.each(resList, function(item, callback){
                params.resourceUri = item['id'];
                eventClient.eventData.listEventsForResource(params, function(err, result){
                    if(err) return callback(err, null);
                    //console.log(result)
                    fs.writeFileSync('./imb-gsl/'+item['name']+'.json', JSON.stringify(result, 0,4), 'utf-8');
                    return callback(null, result)
                });

        }, function(err){
            if(err){return console.error('\n\n\t Resource Events have produced errors:' + err)}

            console.log('\n\n Event logs for all resources fetched successfully!!');
            parseAfile();
            
        })
}

function parseAfile(){

    resList.forEach(function(item){
        var eventLogs = JSON.parse(fs.readFileSync('./imb-gsl/'+ item['name'] +'.json', 'utf-8'));
        var resEventsArray = eventLogs['eventDataCollection']['value']
        resEventsArray = resEventsArray.reverse();
        var leng = resEventsArray.length;
        for(var i = 0; i < leng;i++){
            element = resEventsArray[i];
            if(element['operationName']['value'].endsWith("write")  && element['status']['value'] === 'Accepted'){
                var resURI = element['resourceUri'];
                var resName = resURI.substring(resURI.lastIndexOf('/') + 1);
                console.log('\n' + element['caller']+ ' | ' + element['correlationId'] + ' | ' + resName+' | ' + element['eventTimestamp']  )
                break;
            }
        }
    });
    
    
}

