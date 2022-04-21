App = {
  web3Provider: null,
  contracts: {},
  verifier_request: null,
  company_request: null,
  project_request: null,

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
      App.updateVerifications();
    });
    console.log("Initiating Contract");
    return App.bindEvents();
  },

  bindEvents: function() {
    console.log("Binding Events");
    $(document).on('submit', '.verifier_registration_form', App.handleVerifierRoleRequest);
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
    const verifier_id = event.target.verifier_id.value;
    
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        alert("Error! Couldn't connect to your account!");
        console.log(error);
      }

      var account = accounts[0];
      
      App.contracts.GreenToken.deployed().then(function(instance) {
          GreenTokenInstance = instance;

          // Execute adopt as a transaction by sending account
          return GreenTokenInstance.requestVerifierRole(verifier_id, {from: account});
      }).then(function(result) {
        alert("Verifier Request Completed!");
        console.log("Verifier Request Completed", result);
        App.updateVerifications();
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
        console.log("Company Request Completed", result);
        App.updateVerifications();
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
        console.log("Project Request Completed", result);
        App.updateVerifications();
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
    App.handleVerifierDecision(false);
  },

  handleVerificationAccept: function(event) {
    console.log("Verifier Acceptance");
    event.preventDefault();
    App.handleVerifierDecision(true);
  },

  handleVerifierDecision: function(accept) {
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
            return GreenTokenInstance.grantVerifierRole(App.verifier_request, {from: account});
          } else {
            return GreenTokenInstance.rejectVerifierApplication(App.verifier_request, {from: account});
          }
      }).then(function(result) {
        alert("Verification Decision Processed!");
        console.log("Verification Decision Processed", result)
        
        App.updateVerifications();
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
    App.handleCompanyDecision(false);
  },

  handleCompanyAccept: function(event) {
    console.log("Company Acceptance");
    event.preventDefault();
    App.handleCompanyDecision(true);
  },

  handleCompanyDecision: function(accept) {
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
            return GreenTokenInstance.companyApplicationVerified(App.company_request, {from: account});
          } else {
            return GreenTokenInstance.companyApplicationRejected(App.company_request, {from: account});
          }
      }).then(function(result) {
        alert("Company Decision Processed!");
        console.log("Company Decision Processed", result);
        App.updateVerifications();
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
    App.handleProjectDecision(false);
  },

  handleProjectAccept: function(event) {
    console.log("Project Acceptance");
    event.preventDefault();
    App.handleProjectDecision(true);
  },

  handleProjectDecision: function(accept) {
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
            return GreenTokenInstance.projectApplicationVerified(App.project_request, {from: account});
          } else {
            return GreenTokenInstance.projectApplicationRejected(App.project_request, {from: account});
          }
      }).then(function(result) {
        alert("Project Decision Processed!");
        console.log("Project Decision Processed", result);
        App.updateVerifications();
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

    const token_amount = parseInt(event.target.buy_tokens.value, 10);

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        alert("Error! Couldn't connect to your account!");
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.GreenToken.deployed().then(function(instance) {
          GreenTokenInstance = instance;
          // const transaction = await contract.deposit({ value: ethers.utils.parseEther("0.1") })
          // //sends 0.1 eth
          // await transaction.wait()

          // const transaction = await contract.deposit({ value: ethers.utils.parseEther("0.1") })
          //sends 0.1 eth
          // await transaction.wait()

          // Execute adopt as a transaction by sending account
          return GreenTokenInstance.buyToken({from: account, value: token_amount * (10 ** 18)});
      }).then(function(result) {
        alert("Bought Token!");
        console.log("Buy Processed", result);
        App.updateVerifications();
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
        console.log("Sell Processed", result);
        App.updateVerifications();
      }).catch(function(err) {
        alert("Error! Request didn't go through!");
        console.log(err.message);
      });
    });
  },

  updateVerifications: function() {
    console.log("Update values");
    if($('#verifier_decision').length) {
      document.getElementById('verifier_decision').remove();
    }
    if($('#company_decision').length) {
      document.getElementById('company_decision').remove();
    }
    if($('#project_decision').length) {
      document.getElementById('project_decision').remove();
    }
    if($('#balanceResult').length) {
      document.getElementById('balanceResult').remove();
    }
    if($('#supplyResult').length) {
      document.getElementById('supplyResult').remove();
    }

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        alert("Error! Couldn't connect to your account!");
        console.log(error);
      }
      var account = accounts[0];

      App.contracts.GreenToken.deployed().then(function(instance) {
        GreenTokenInstance = instance;
    
        // Execute adopt as a transaction by sending account
        return GreenTokenInstance.requestFirstAddressInVerifierList.call({from: account});
        }).then(function(result) {
          console.log("Update Verifier", result);
          App.verifier_request = result[0];
          $('#verifier_approval').append(`
          <form id="verifier_decision" class="contact__form admin_verifier_decision">
            <div  class="row">
          <div id="verifier_form" class="col-md-12 form-group" style="text-align:center">
            <p>Address: <b>${result[0]}</b></p>
            </div>
            <div class="col-md-12 form-group" style="text-align:center">
            <p>Verifier ID: <b>${result[1]}</b></p>
            </div>
            <div class="flex-container col-md-12">
            <div class="form-group">
                <input id="verifier_accept" name="accept" type="submit" class="btn btn-circled btn-success" value="Accept">
            </div>
            <div class="form-group">
                <input id="verifier_reject" name="reject" type="reset" class="btn btn-circled btn-danger" value="Reject">
            </div>
            </div>
            </div>
            </form>`
            );
        }).catch(function(err) {
          console.log(err.message);
        });
  });

  web3.eth.getAccounts(async function(error, accounts) {
    if (error) {
      alert("Error! Couldn't connect to your account!");
      console.log(error);
    }
    var account = accounts[0];

    App.contracts.GreenToken.deployed().then(function(instance) {
      GreenTokenInstance = instance;
  
      // Execute adopt as a transaction by sending account
      return GreenTokenInstance.requestFirstAddressInCompanyList.call({from: account});
      }).then(function(result) {
        console.log("Update Company", result);
        App.company_request = result[0];
          $('#company_approval').append(`
          <form id="company_decision" class="contact__form admin_company_decision">
            <div  class="row">
          <div id="company_form" class="col-md-12 form-group" style="text-align:center">
            <p>Address: <b>${result[0]}</b></p>
            </div>

            <div class="col-md-12 form-group" style="text-align:center">
            <p>Company ID: <b>${result[1]}</b></p>
            </div>

            <div class="col-md-6 form-group" style="text-align:center">
            <p>Tons of CO2 Emissions: <b>${result[2]}</b></p>
            </div>
            <div class="col-md-6 form-group" style="text-align:center">
            <p>Grant Token Balance: <b>${result[3]}</b></p>
            </div>

            <div class="col-md-12 form-group" style="text-align:center">
            <p>Document URI: <b>${result[4]}</b></p>
            </div>
            <div class="flex-container col-md-12">
            <div class="form-group">
                <input id="verifier_accept" name="accept" type="submit" class="btn btn-circled btn-success" value="Accept">
            </div>
            <div class="form-group">
                <input id="verifier_reject" name="reject" type="reset" class="btn btn-circled btn-danger" value="Reject">
            </div>
            </div>
            </div>
            </form>`
            );
      }).catch(function(err) {
        console.log(err.message);
      });
});

web3.eth.getAccounts(async function(error, accounts) {
  if (error) {
    alert("Error! Couldn't connect to your account!");
    console.log(error);
  }
  var account = accounts[0];

  App.contracts.GreenToken.deployed().then(function(instance) {
    GreenTokenInstance = instance;

    // Execute adopt as a transaction by sending account
    return GreenTokenInstance.requestFirstAddressInProjectList.call({from: account});
    }).then(function(result) {
      console.log("Update Project", result);
      App.project_request = result[0];
      $('#project_approval').append(`
        <form id="project_decision" class="contact__form admin_project_decision">
          <div  class="row">
          <div id="project_form" class="col-md-12 form-group" style="text-align:center">
          <p>Address: <b>${result[0]}</b></p>
          </div>

          <div class="col-md-12 form-group" style="text-align:center">
          <p>Project ID: <b>${result[1]}</b></p>
          </div>

          <div class="col-md-6 form-group" style="text-align:center">
          <p>Tons of CO2 Reduction:<b>${result[2]}</b></p>
          </div>
          <div class="col-md-6 form-group" style="text-align:center">
          <p>Grant Token Balance: <b>${result[3]}</b></p>
          </div>

          <div class="col-md-12 form-group" style="text-align:center">
          <p>Document URI: <b>${result[4]}</b></p>
          </div>
          <div class="flex-container col-md-12">
          <div class="form-group">
              <input id="verifier_accept" name="accept" type="submit" class="btn btn-circled btn-success" value="Accept">
          </div>
          <div class="form-group">
              <input id="verifier_reject" name="reject" type="reset" class="btn btn-circled btn-danger" value="Reject">
          </div>
          </div>
          </div>
          </form>`
          );
    }).catch(function(err) {
      console.log(err.message);
    });
});

web3.eth.getAccounts(async function(error, accounts) {
  if (error) {
    alert("Error! Couldn't connect to your account!");
    console.log(error);
  }
  var account = accounts[0];

  App.contracts.GreenToken.deployed().then(function(instance) {
    GreenTokenInstance = instance;

    // Execute adopt as a transaction by sending account
    return GreenTokenInstance.balanceOf.call(account, {from: account});
    }).then(function(result) {
      console.log("BalanceOf", parseInt(result));
      $('#balanceOf').append(`<p id="balanceResult">Total Balance: <b>${parseFloat(result)/(10**18)}</b></p>`)
    }).catch(function(err) {
      console.log(err.message);
    });
  });

  web3.eth.getAccounts(async function(error, accounts) {
    if (error) {
      alert("Error! Couldn't connect to your account!");
      console.log(error);
    }
    var account = accounts[0];
  
    App.contracts.GreenToken.deployed().then(function(instance) {
      GreenTokenInstance = instance;
  
      // Execute adopt as a transaction by sending account
      return GreenTokenInstance.totalSupply.call({from: account});
      }).then(function(result) {
        console.log("totalSupply", parseInt(result));
        $('#totalSupply').append(`<p id="supplyResult">Total Supply: <b>${parseFloat(result)/(10**18)}</b></p>`)
      }).catch(function(err) {
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
