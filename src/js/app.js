App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    console.log("Initing");
    return await App.initWeb3();
  },
  
  /* INITIALIZE WEB3 APPLICATION */
  initWeb3: async function() {
    console.log("Initing Web 3");
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });;
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('GreenToken.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var GreenTokenArtifact = data;
      App.contracts.GreenToken = TruffleContract(GreenTokenArtifact);
    
      // Set the provider for our contract
      App.contracts.GreenToken.setProvider(App.web3Provider);
    });
    console.log("Initing Contract");
    return App.bindEvents();
  },

  bindEvents: function() {
    console.log("Binding Events");
    $(document).on('click', '.btn-verifier-register', App.handleVerifierRoleRequest);
    $(document).on('submit', '.company_verifier', App.handleCompanyVerificationRequest);
    $(document).on('submit', '.project_verifier', App.handleProjectVerificationRequest);
    $(document).on('reset', '.admin_verifier_decision', App.handleVerificationRejection);
    $(document).on('submit', '.admin_verifier_decision', App.handleVerificationAccept);
    $(document).on('reset', '.admin_company_decision', App.handleCompanyRejection);
    $(document).on('submit', '.admin_company_decision', App.handleCompanyAccept);
    $(document).on('reset', '.admin_project_decision', App.handleProjectRejection);
    $(document).on('submit', '.admin_project_decision', App.handleProjectAccept);
    $(document).on('submit', '.buy_token_form', App.handleBuyToken);
    $(document).on('submit', '.sell_token_form', App.handleSellToken);
  },


  /* REQUESTING VERIFIER ROLE */
  handleVerifierRoleRequest: function(event) {
    console.log("Handling Verifier Role Request");
    event.preventDefault();

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        alert("Error! Couldn't connect to your account!");
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.GreenToken.deployed().then(function(instance) {
          GreenTokenInstance = instance;

          // Execute adopt as a transaction by sending account
          return GreenTokenInstance.requestVerifierRole({from: account});
      }).then(function(result) {
        alert("Verifier Request Completed!");
        console.log("Verifier Request Completed", result);
      }).catch(function(err) {
        alert("Error! Request didn't go through!");
        console.log(err.message);
      });
    });
  },

  /* REQUESTING COMPANY VERIFICATIOON */
  handleCompanyVerificationRequest: function(event) {
    console.log("Handling Company Request");
    event.preventDefault();

    const requestID = event.target.registrationID.value;
    const tco2Emission = parseInt(event.target.tco2Emission.value, 10);
    const gntTokenBalance = parseInt(event.target.gntTokenBalance.value, 10);
    const document_uri = event.target.document_uri.value;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        alert("Error! Couldn't connect to your account!");
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.GreenToken.deployed().then(function(instance) {
          GreenTokenInstance = instance;

          // Execute adopt as a transaction by sending account
          return GreenTokenInstance.requestCompanyVerification(requestID, tco2Emission, gntTokenBalance, document_uri, {from: account});
      }).then(function(result) {
        alert("Company Verification Request Complete!");
        console.log("Company Request Completed", result)
      }).catch(function(err) {
        alert("Error! Request didn't go through!");
        console.log(err.message);
      });
    });
  },

  /* REQUESTING PROJECT VERIFICATION */
  handleProjectVerificationRequest: function(event) {
    console.log("Handling Project Request");
    event.preventDefault();

    const requestID = event.target.registrationID.value;
    const tco2Reduction = parseInt(event.target.tco2Reduction.value, 10);
    const gntTokenBalance = parseInt(event.target.gntTokenBalance.value, 10);
    const document_uri = event.target.document_uri.value;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        alert("Error! Couldn't connect to your account!");
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.GreenToken.deployed().then(function(instance) {
          GreenTokenInstance = instance;

          // Execute adopt as a transaction by sending account
          return GreenTokenInstance.requestProjectVerification(requestID, tco2Reduction, gntTokenBalance, document_uri, {from: account});
      }).then(function(result) {
        alert("Project Verification Request Complete!");
        console.log("Project Request Completed", result)
      }).catch(function(err) {
        alert("Error! Request didn't go through!");
        console.log(err.message);
      });
    });
  },

  /* ADMIN VERIFIER DECISION */
  handleVerificationRejection: function(event) {
    console.log("Verifier Rejection");
    event.preventDefault();
    App.handleVerifierDecision(false, event.target.verifier_decision.value);
  },

  handleVerificationAccept: function(event) {
    console.log("Verifier Acceptance");
    event.preventDefault();
    App.handleVerifierDecision(true, event.target.verifier_decision.value);
  },

  handleVerifierDecision: function(accept, verifier_address) {
    console.log("Handling Verifier Decision");

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        alert("Error! Couldn't connect to your account!");
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.GreenToken.deployed().then(function(instance) {
          GreenTokenInstance = instance;

          // Execute adopt as a transaction by sending account
          if (accept) {
            return GreenTokenInstance.grantVerifierRole(verifier_address, {from: account});
          } else {
            return GreenTokenInstance.rejectVerifierApplication(verifier_address, {from: account});
          }
      }).then(function(result) {
        alert("Verification Decision Processed!");
        console.log("Verification Decision Processed", result)
      }).catch(function(err) {
        alert("Error! Request didn't go through!");
        console.log(err.message);
      });
    });
  },

  /* COMPANY VERIFIER DECISION */
  handleCompanyRejection: function(event) {
    console.log("Company Rejection");
    event.preventDefault();
    App.handleCompanyDecision(false, event.target.company_decision.value);
  },

  handleCompanyAccept: function(event) {
    console.log("Company Acceptance");
    event.preventDefault();
    App.handleCompanyDecision(true, event.target.company_decision.value);
  },

  handleCompanyDecision: function(accept, company_address) {
    console.log("Handling Company Decision");

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        alert("Error! Couldn't connect to your account!");
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.GreenToken.deployed().then(function(instance) {
          GreenTokenInstance = instance;

          // Execute adopt as a transaction by sending account
          if (accept) {
            return GreenTokenInstance.companyApplicationVerified(company_address, {from: account});
          } else {
            return GreenTokenInstance.companyApplicationRejected(company_address, {from: account});
          }
      }).then(function(result) {
        alert("Company Decision Processed!");
        console.log("Company Decision Processed", result)
      }).catch(function(err) {
        alert("Error! Request didn't go through!");
        console.log(err.message);
      });
    });
  },

  /* PROJECT VERIFIER DECISION */
  handleProjectRejection: function(event) {
    console.log("Project Rejection");
    event.preventDefault();
    App.handleProjectDecision(false, event.target.project_decision.value);
  },

  handleProjectAccept: function(event) {
    console.log("Project Acceptance");
    event.preventDefault();
    App.handleProjectDecision(true, event.target.project_decision.value);
  },

  handleProjectDecision: function(accept, project_address) {
    console.log("Handling Project Decision");

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        alert("Error! Couldn't connect to your account!");
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.GreenToken.deployed().then(function(instance) {
          GreenTokenInstance = instance;

          // Execute adopt as a transaction by sending account
          if (accept) {
            return GreenTokenInstance.projectApplicationVerified(project_address, {from: account});
          } else {
            return GreenTokenInstance.projectApplicationRejected(project_address, {from: account});
          }
      }).then(function(result) {
        alert("Project Decision Processed!");
        console.log("Project Decision Processed", result)
      }).catch(function(err) {
        alert("Error! Request didn't go through!");
        console.log(err.message);
      });
    });
  },

  /* MARKET BUYING AND SELLING TOKENS */
  handleBuyToken: function(event) {
    console.log("Handling Buy Token");

    event.preventDefault();

    const token_address = event.target.buy_tokens.value;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        alert("Error! Couldn't connect to your account!");
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.GreenToken.deployed().then(function(instance) {
          GreenTokenInstance = instance;

          // Execute adopt as a transaction by sending account
          return GreenTokenInstance.buyToken(token_address, {from: account});
      }).then(function(result) {
        alert("Bought Token!");
        console.log("Buy Processed", result)
      }).catch(function(err) {
        alert("Error! Request didn't go through!");
        console.log(err.message);
      });
    });
  },

  handleSellToken: function(event) {
    console.log("Handling Sell Token");

    event.preventDefault();

    const token_amount = parseInt(event.target.sell_tokens.value, 10);

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        alert("Error! Couldn't connect to your account!");
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.GreenToken.deployed().then(function(instance) {
          GreenTokenInstance = instance;

          // Execute adopt as a transaction by sending account
          return GreenTokenInstance.sellToken(token_amount, {from: account});
      }).then(function(result) {
        alert("Sold Tokens!");
        console.log("Sell Processed", result)
      }).catch(function(err) {
        alert("Error! Request didn't go through!");
        console.log(err.message);
      });
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
