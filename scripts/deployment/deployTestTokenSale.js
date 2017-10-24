var config = require('./config')
var Web3 = require('web3')
var web3 = new Web3(new Web3.providers.HttpProvider(config.get('web3Provider')))
var solc = require('solc')
var async = require('async')
var fs = require('fs')
var argv = require('yargs').argv

var args = require('./TestTokenSale.json')
var owner = args.owner
var fundingRecipient = args.fundingRecipient
var communityPoolAddress = args.communityPoolAddress
var futureDevelopmentPoolAddress = args.futureDevelopmentPoolAddress
var teamPoolAddress = args.teamPoolAddress
var startTime

var input = {
  'BasicToken.sol': fs.readFileSync(__dirname + '/../../contracts/BasicToken.sol', 'utf8'),
  'ERC20.sol': fs.readFileSync(__dirname + '/../../contracts/ERC20.sol', 'utf8'),
  'Ownable.sol': fs.readFileSync(__dirname + '/../../contracts/Ownable.sol', 'utf8'),
  'SafeMath.sol': fs.readFileSync(__dirname + '/../../contracts/SafeMath.sol', 'utf8'),
  'TestToken.sol': fs.readFileSync(__dirname + '/../../contracts/TestToken.sol', 'utf8'),
  'TokenHolder.sol': fs.readFileSync(__dirname + '/../../contracts/TokenHolder.sol', 'utf8'),
  'VestingTrustee.sol': fs.readFileSync(__dirname + '/../../contracts/VestingTrustee.sol', 'utf8'),
  'TestTokenSale.sol': fs.readFileSync(__dirname + '/../../contracts/TestTokenSale.sol', 'utf8'),
}

var deployTransactionObj
var data
var myContract
async.auto({
  getBlockNumber: web3.eth.getBlockNumber,
  getBlock: ['getBlockNumber', function(results, cb) {
    web3.eth.getBlock(results.getBlockNumber, cb)
  }],
  getFromAddress: function (cb) {
    if (argv.from) return cb(null, argv.from)
    web3.eth.getCoinbase(cb)
  },
  loadCompilerVersion: function (cb) {
    solc.loadRemoteVersion(config.get('compilerVersion'), cb)
  },
  getGasPrice: web3.eth.getGasPrice,
  estimateGas: ['loadCompilerVersion', 'getBlock', function (results, cb) {
    var now = results.getBlock.timestamp
    startTime = args.startTime || (now + 3600)
    var constructorArguments = [owner, fundingRecipient, communityPoolAddress, futureDevelopmentPoolAddress, teamPoolAddress, startTime]
    var solcSnapshot = results.loadCompilerVersion
    var contractCompiled = solc.compile({sources: input}, 1)
    var contractObj = contractCompiled.contracts['TestTokenSale.sol:TestTokenSale']
    var jsonInterface = JSON.parse(contractObj.interface)
    myContract = new web3.eth.Contract(jsonInterface);
    data = '0x' + contractObj.bytecode
    var deployObj = {
      data: data,
      arguments: constructorArguments
    }
    deployTransactionObj = myContract.deploy(deployObj)
    deployTransactionObj.estimateGas(cb)
  }],
  sendTransaction: ['getFromAddress', 'getGasPrice', 'estimateGas', function (results, cb) {
    var from = results.getFromAddress
    var gas = results.estimateGas
    var gasPrice = results.getGasPrice
    deployTransactionObj.send({
      from,
      gas,
      gasPrice
    }, cb)
  }],
}, function (err, results) {
  if (err) return console.error('err =', err)
  console.log('Success! transactionHash =', results.sendTransaction)
})
