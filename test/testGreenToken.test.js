const GreenToken = artifacts.require("GreenToken");

contract("GreenToken", (accounts) => {
    let tok;
    let expectedRequester;

  before(async () => {
      tok = await GreenToken.deployed();
  });

  describe("requesting verification and retrieving account addresses", async () => {
    before("request verification using accounts[0]", async () => {
      await tok.requestVerifierRole({ from: accounts[0] });
      expectedRequester = accounts[0];
    });
    it("can verfier", async () => {
        const requestedVerification = await tok.addressesRequestingVerifierRole(expectedRequester);
        assert.equal(requestedVerification, true, "account[0] should have requested verification");
      });
  });
});
