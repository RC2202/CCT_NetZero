App = {
  web3Provider: null,
  contracts: {},
  verifier_request: [],
  company_request: [],
  project_request: [],

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
    let idx = parseInt(event.target.getAttribute('id').split('_')[2]);
    App.handleVerifierDecision(false, idx);
  },

  handleVerificationAccept: function(event) {
    console.log("Verifier Acceptance");
    event.preventDefault();
    let idx = parseInt(event.target.getAttribute('id').split('_')[2]);
    App.handleVerifierDecision(true, idx);
  },

  handleVerifierDecision: function(accept, idx) {
    console.log("Handling Verifier Decision");
    
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        alert("Error! Couldn't connect to your account!");
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.GreenToken.deployed().then(function(instance) {
          GreenTokenInstance = instance;
          console.log(App.verifier_request[idx]);
          console.log(typeof App.verifier_request[idx]);
          console.log(typeof account);
          // Execute adopt as a transaction by sending account
          if (accept) {
            return GreenTokenInstance.grantVerifierRole(App.verifier_request[idx], {from: account});
          } else {
            return GreenTokenInstance.rejectVerifierApplication(App.verifier_request[idx], {from: account});
          }
      }).then(function(result) {
        alert("Verification Decision Processed!");
        console.log("Verification Decision Processed", result)
        document.getElementById('verifier_decision_' + idx).remove();
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
    let idx = parseInt(event.target.getAttribute('id').split('_')[2]);
    App.handleCompanyDecision(false, idx);
  },

  handleCompanyAccept: function(event) {
    console.log("Company Acceptance");
    event.preventDefault();
    let idx = parseInt(event.target.getAttribute('id').split('_')[2]);
    App.handleCompanyDecision(true, idx);
  },

  handleCompanyDecision: function(accept, idx) {
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
            return GreenTokenInstance.companyApplicationVerified(App.company_request[idx], {from: account});
          } else {
            return GreenTokenInstance.companyApplicationRejected(App.company_request[idx], {from: account});
          }
      }).then(function(result) {
        alert("Company Decision Processed!");
        console.log("Company Decision Processed", result);
        $('company_decision_' + idx).remove();
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
    let idx = parseInt(event.target.getAttribute('id').split('_')[2]);
    App.handleProjectDecision(false);
  },

  handleProjectAccept: function(event) {
    console.log("Project Acceptance");
    event.preventDefault();
    let idx = parseInt(event.target.getAttribute('id').split('_')[2]);
    App.handleProjectDecision(true);
  },

  handleProjectDecision: function(accept, idx) {
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
            return GreenTokenInstance.projectApplicationVerified(App.project_request[idx], {from: account});
          } else {
            return GreenTokenInstance.projectApplicationRejected(App.project_request[idx], {from: account});
          }
      }).then(function(result) {
        alert("Project Decision Processed!");
        console.log("Project Decision Processed", result);
        $('project_decision_' + idx).remove();
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
          return GreenTokenInstance.buyToken.call({from: account, value: token_amount });
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
          return GreenTokenInstance.sellToken.call(token_amount, {from: account});
      }).then(function(result) {
        alert("Sold Tokens!");
        console.log("Sell Processed", result)
      }).catch(function(err) {
        alert("Error! Request didn't go through!");
        console.log(err.message);
      });
    });
  },

  updateVerifications: function() {
    console.log("Update values");

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        alert("Error! Couldn't connect to your account!");
        console.log(error);
      }
      var account = accounts[0];

      App.contracts.GreenToken.deployed().then(function(instance) {
        GreenTokenInstance = instance;
    
        // Execute adopt as a transaction by sending account
        return GreenTokenInstance.getVerifierRequests.call({from: account});
        }).then(function(result) {
          console.log("Update Verifier", result);
          let curr_array_size = App.verifier_request.length;
          for (i = 0; i < result.length; i++) {
            if (!App.verifier_request.includes(result[i]) && result[i] !== '0x0000000000000000000000000000000000000000') {
              App.verifier_request.push(result[i]);
            }
          }
          for (i = curr_array_size; i < App.verifier_request.length; i++) {
            $('#verifier_approval').append(`
            <form id="verifier_decision_${i}" class="contact__form admin_verifier_decision">
              <div  class="row">
            <div id="verifier_form_${i}" class="col-md-8 form-group">
              <p>${result[i]}</p>
              </div>
              <div class="col-md-2 form-group">
                  <input id="verifier_accept_${i}" name="accept" type="submit" class="btn btn-circled btn-success" value="Accept">
              </div>
              <div class="col-md-2 form-group">
                  <input id="verifier_reject_${i}" name="reject" type="reset" class="btn btn-circled btn-danger" value="Reject">
              </div>
              </div>
              </form>`
              );
          }
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
      return GreenTokenInstance.getCompanyRequests.call({from: account});
      }).then(function(result) {
        console.log("Update Company", result);
        let curr_array_size = App.company_request.length;
          for (i = 0; i < result.length; i++) {
            if (!App.company_request.includes(result[i]) && result[i] !== '0x0000000000000000000000000000000000000000') {
              App.company_request.push(result[i]);
            }
          }
          for (i = curr_array_size; i < App.company_request.length; i++) {
            $('#company_approval').append(`
            <form id="company_decision_${i}" class="contact__form admin_company_decision">
              <div  class="row">
            <div id="company_form_${i}" class="col-md-8 form-group">
              <p>${result[i]}</p>
              </div>
              <div class="col-md-2 form-group">
                  <input id="company_accept_${i}" name="accept" type="submit" class="btn btn-circled btn-success" value="Accept">
              </div>
              <div class="col-md-2 form-group">
                  <input id="company_reject_${i}" name="reject" type="reset" class="btn btn-circled btn-danger" value="Reject">
              </div>
              </div>
              </form>`
              );
          }
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
    return GreenTokenInstance.getProjectRequests.call({from: account});
    }).then(function(result) {
      console.log("Update Project", result);
      let curr_array_size = App.project_request.length;
          for (i = 0; i < result.length; i++) {
            if (!App.project_request.includes(result[i]) && result[i] !== '0x0000000000000000000000000000000000000000') {
              App.project_request.push(result[i]);
            }
          }
          for (i = curr_array_size; i < App.project_request.length; i++) {
            $('#project_approval').append(`
            <form id="project_decision_${i}" class="contact__form admin_project_decision">
              <div  class="row">
            <div id="project_form_${i}" class="col-md-8 form-group">
              <p>${result[i]}</p>
              </div>
              <div class="col-md-2 form-group">
                  <input id="project_accept_${i}" name="accept" type="submit" class="btn btn-circled btn-success" value="Accept">
              </div>
              <div class="col-md-2 form-group">
                  <input id="project_reject_${i}" name="reject" type="reset" class="btn btn-circled btn-danger" value="Reject">
              </div>
              </div>
              </form>`
              );
          }
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
      console.log("BalanceOf", result);
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
