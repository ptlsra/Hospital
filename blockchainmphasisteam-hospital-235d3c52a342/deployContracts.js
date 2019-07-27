


//***** contract deployment code *****//


/**
 * required modules
 */

const Web3 = require('web3');
var fs = require('fs');
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var log4js = require('log4js');
var logger = log4js.getLogger('deployContract.js');



/**
 * read configuration from config file
 */
let configRawData = fs.readFileSync('./config.json');  
let configData = JSON.parse(configRawData);
var mongoUrl = "mongodb://"+configData.mongoIp+":"+configData.mongoPort+"/";
var web3Url = configData.web3Url;
logger.level = configData.logLevel;

// connecting to web3 provider
const web3 = new Web3(new Web3.providers.HttpProvider(web3Url));
logger.debug("mongoUrl : "+mongoUrl);


//Note -> order or all threee matters so be careful while changing the order -_-

var solidityFileList        = ["Policy.sol","Hospital.sol","ClaimManagement.sol","Insurance.sol"];
var solidityJsonFileList    = ["Policy.json","Hospital.json","ClaimManagement.json","Insurance.json"];
var contractNameList        = ["Policy","Hospital","ClaimManagement","Insurance"];
var contractAddresses=[];

/**
 * program starts here. 
 */
function deployContract(solidityFileName, solidityJsonfileName, contractName, requiredGas){
        logger.info("deployContract");
        logger.debug("deploying ...");
        logger.debug(solidityFileName);
        logger.debug(solidityJsonfileName);
        logger.debug(contractName);

        var exec = require('child_process').exec, child;
        logger.debug('Going to Execute solidity compile command in terminal');
        child = exec('/tmp/solc --optimize --combined-json abi,bin,interface '+solidityFileName+' > '+solidityJsonfileName,
            function (error, stdout, stderr) {
                logger.debug('Command Executed successfully!');
                // logger.debug('stdout: ' + stdout);
                // logger.debug('stderr: ' + stderr);
                if (error !== null) {
                    logger.debug('exec error: ' + error);
                }
            });
        child;



        logger.debug('Smart Contract Compiled and Saved the output in JSON file!');
        //BELOW setTimeout is to wait for the compiled json file to be created. second argument "time" is in milliseconds, may need to increase this number in case of a big smart contract to compile.
        setTimeout(readF, 10000);

        function readF(){
            var fileData = fs.readFileSync(solidityJsonfileName);
            logger.debug("Data inside just created JSON file is: "+fileData);
            var content = JSON.parse(fileData);
            //logger.debug(content);
            var abi = content.contracts[solidityFileName+":"+contractName].abi;
            logger.debug("ABI is: "+abi);

            var binary = content.contracts[solidityFileName+":"+contractName].bin;
            //logger.debug("Parsed binary is: "+binary);
            var bin = '0x'+binary;
            logger.debug("Required BINARY is: "+bin);

            //////////////////////
            var contractDeployedAt = web3.eth.accounts[0];
            logger.debug("Contract is going to be deployed at: " + contractDeployedAt);
            var password1stAccount = "";
            //logger.debug("First account password is : " + password1stAccount);
            var accountUnlocked = web3.personal.unlockAccount(contractDeployedAt, password1stAccount);
            //logger.debug("Contract account unlocked: " + accountUnlocked);
            const Contract = web3.eth.contract(JSON.parse(abi));

            Contract.new({
                from: web3.eth.accounts[0],
                data:bin,
                gas: requiredGas
            },function(err, contract){
                if(err) logger.debug(err);    
                    if(typeof contract.address !== 'undefined'){
                        logger.debug('Contract mined! address: ' + contract.address + ' transactionHash: ' + contract.transactionHash)
                        //return contract.address;
                        //push contractAddress and abi into mongodb
                        var MongoClient = require('mongodb').MongoClient;
                        var url = mongoUrl+"blockchaindb";
                    
                        MongoClient.connect(url, function(err, db) {
                            if (err) throw err;
                            logger.debug("************ connected to mongodb client at localhost *************");
                            logger.debug("************ storing record **********");
                            let myobj = {contractAddress:contract.address, contractName:contractName, abi:abi}; 
                            var collectionName = "contracts";
                            db.collection(collectionName).insertOne(myobj, function(err, res) {
                                if (err) throw err;
                                logger.debug("contract abi pushed to mongodb ....");
                                //logger.debug(res);
                                db.close();
                            });
                        });

                        contractAddresses.push(contract.address);
                }
            })
        }
    }


logger.debug("**************************** deploying Policy contract *********************");
    
deployContract(solidityFileList[0], solidityJsonFileList[0], contractNameList[0], "5000000");
//}


setTimeout(function(){
    logger.debug("**************************** deploying hospital contract *********************");
    
    deployContract(solidityFileList[1], solidityJsonFileList[1], contractNameList[1], "5000000");
    
},35000);

setTimeout(function(){
    logger.debug("**************************** deploying claim contract *********************");
    
        deployContract(solidityFileList[2], solidityJsonFileList[2], contractNameList[2], "5000000");
        
},70000);


setTimeout(function(){
    logger.debug("**************************** deploying insurance contract *********************");
    
        deployContract(solidityFileList[3], solidityJsonFileList[3], contractNameList[3], "5000000");
        
},100000);

//setTimeout
setTimeout(function(){
    logger.debug("**************************** saving cotractsConfig.json ************************");
    logger.debug("printing contractAddresses list : "+JSON.stringify(contractAddresses));
    let contractObject = {
        policyContract      : contractAddresses[0],
        hospitalContract    : contractAddresses[1],
        claimContract       : contractAddresses[2],
        insuranceContract   : contractAddresses[3]
    }

    let data = JSON.stringify(contractObject);
    fs.writeFileSync('./contractConfig.json', data);



    let rawdata = fs.readFileSync('./contractConfig.json');  
    let contractsData = JSON.parse(rawdata);
    logger.debug(JSON.stringify(contractsData));
},130000);
