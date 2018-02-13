module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 8000029
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01
    }
  },
  mocha: {
  	//grep: "presaleAllocation"
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
