var GreenToken = artifacts.require("GreenToken");
var initTokenQty = 5000;
module.exports=function(deployer, accounts){
    // if(accounts){
        //Deploy with 1 ether
        deployer.deploy(GreenToken, initTokenQty);
        // deployer.deploy(GreenToken, initTokenQty, { from: accounts[0], value: "1000000000000000000" });
    // }
}