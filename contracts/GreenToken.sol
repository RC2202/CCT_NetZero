// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
// ERC20 for token
// ERC721 will be required for nft receipt
// Burnable is required for yearly burning
// Access control for assigning responsibilities

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "../node_modules/@openzeppelin/contracts/security/Pausable.sol";
import "../node_modules/@openzeppelin/contracts/access/AccessControl.sol";
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";

contract GreenToken is ERC20, ERC20Burnable, Pausable, AccessControl {
    using SafeMath for uint256;
    //Create roles
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant GOVERNER_ROLE = keccak256("GOVERNER_ROLE");
    bytes32 public constant COMPANY_ROLE = keccak256("COMPANY_ROLE");
    bytes32 public constant PROJECT_ROLE = keccak256("PROJECT_ROLE");

    //token = tco2_multiplier*tCO2
    uint private tco2_multiplier = 2.0;
    //token = Rate*Ether
    uint256 private Rate =5.0;
    // uint256 public INITIAL_SUPPLY = 1000*(10 ** uint256(decimals));
    enum Roles{ GOV, VALIDATOR, COMPANY, PROJECT }
    //enum ApplicationStatus{}
    //list of addresses requesting verification
    //Should be poped out once they are analysed
    // address[] private addressesRequestingVerifierRole;
    mapping(address => bool) private addressesRequestingVerifierRole;
    address owner;


    struct KYC_Company {
        string registrationID;
        uint256 tco2Emission;
        uint256 gntTokenBalance;
        string document_uri;
        bool appliedForVerification;
    }

    
    struct KYC_Project {
        string registrationID;
        uint256 tco2Reduction;
        uint256 gntTokenBalance;
        string document_uri;
        bool appliedForVerification;
    }
    //mappings

    mapping(address => KYC_Company) private addressesRequestingCompanyVerification;
    mapping(address => KYC_Project) private addressesRequestingProjectVerification;
    mapping(address => KYC_Company) public verifiedCompanies;
    mapping(address => KYC_Project) public verifiedProjects;


    //arrays (fifo) keeps the list of addresses requesting specific roles
    address[] public verifier_request_address;
    address[] public company_request_address;
    address[] public project_request_address;

    //Events
    //V,C,P are FIFO type array
    // event VERIFIER_REQUEST(address);
    // event COMPANY_REQUEST();
    // event PROJECT_REQUEST();
    // event COMPANY_DETAIL();
    // event PROJECT_DETAIL();
    // event VERIFIER_DETAIL();
    event STATUS(bool, address);

    IERC20 public tokenContract;

    //--need to add mint amount in the constructor for initial tokens qty to mint
    constructor(uint256 tokenQty) ERC20("GreenToken", "GNT")  {
        //assign all initial roles to contract creator
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(GOVERNER_ROLE, msg.sender);
        _grantRole(COMPANY_ROLE, msg.sender);
        _grantRole(PROJECT_ROLE, msg.sender);

        _setRoleAdmin(PROJECT_ROLE,VERIFIER_ROLE);
        _setRoleAdmin(COMPANY_ROLE,VERIFIER_ROLE);
        _setRoleAdmin(VERIFIER_ROLE,GOVERNER_ROLE);
        _setRoleAdmin(GOVERNER_ROLE,DEFAULT_ADMIN_ROLE);

        //mint init token
        // uint256 totalSupply = 10000 * (10 ** uint256(decimals));
        // _mint(msg.sender, 10000 * (10 **uint256(decimals)));
        _mint(address(this), tokenQty * (10 **18));
        // uint256 totalSupply = 10000 * (10 ** uint256(decimals));
         owner = msg.sender;
         tokenContract = IERC20(address(this));
        
    }
    //frontend request 1st address in the list of verifier


    function requestFirstAddressInVerifierList() public view onlyRole(getRoleAdmin(VERIFIER_ROLE))  returns(address){
        return verifier_request_address[verifier_request_address.length-1];
    }
    function requestFirstAddressInCompanyList() public view onlyRole(getRoleAdmin(COMPANY_ROLE))  returns(address, KYC_Company memory){
        return( company_request_address[company_request_address.length-1], addressesRequestingCompanyVerification[company_request_address[company_request_address.length-1]]);
    }
    function requestFirstAddressInProjectList() public view onlyRole(getRoleAdmin(PROJECT_ROLE))  returns(address, KYC_Project memory){
        return (project_request_address[project_request_address.length-1], addressesRequestingProjectVerification[project_request_address[project_request_address.length-1]]);
    }

    //request verifier role
    function requestVerifierRole() public{
        emit RequestVerifierEvent(msg.sender);
        addressesRequestingVerifierRole[msg.sender]=true;
        verifier_request_address.push(msg.sender);
    }

    //grant verifier  role
    function grantVerifierRole(address applicantAddress) public onlyRole(getRoleAdmin(VERIFIER_ROLE)){
        require(addressesRequestingVerifierRole[applicantAddress],"Account did not request verification"); //--added this line to prevent non request address.
        require(verifier_request_address[verifier_request_address.length-1] == applicantAddress, "Not the top");
        addressesRequestingVerifierRole[applicantAddress] =false;
        _grantRole(VERIFIER_ROLE,applicantAddress);
        delete addressesRequestingVerifierRole[applicantAddress];
        verifier_request_address.pop();
        emit STATUS(true, applicantAddress);
    }

    //Reject verifier application
    function rejectVerifierApplication(address applicantAddress) public onlyRole(getRoleAdmin(VERIFIER_ROLE)){
        require(addressesRequestingVerifierRole[applicantAddress],"Account did not request verification"); //--added this line to prevent non request address.      
        require(verifier_request_address[verifier_request_address.length-1] == applicantAddress, "Not the top");
        delete addressesRequestingVerifierRole[applicantAddress];
        verifier_request_address.pop();
        emit STATUS(false, applicantAddress);
    }


    //Company request to review their CO2 emission
    //change memory to calldata?
    function requestCompanyVerification( string calldata _registrationID, uint256 _tco2Emission, uint256 _gntTokenBalance, string calldata _document_uri) public{
        //save in addressesRequestingCompanyVerification
        addressesRequestingCompanyVerification[msg.sender]= KYC_Company(_registrationID, _tco2Emission, _gntTokenBalance, _document_uri, true);
        company_request_address.push(msg.sender);
    }
                
    //Accept company request

    function companyApplicationVerified(address _companyAddress) public onlyRole(getRoleAdmin(COMPANY_ROLE)){
        //--added this line to prevent non request address.
        require(addressesRequestingCompanyVerification[_companyAddress].appliedForVerification,"Account did not request company verification");
        require(company_request_address[company_request_address.length-1] == _companyAddress, "Not the top");
        addressesRequestingCompanyVerification[_companyAddress].appliedForVerification = false;
        _grantRole(COMPANY_ROLE,_companyAddress);
        //add to verified company list
        verifiedCompanies[_companyAddress] = addressesRequestingCompanyVerification[_companyAddress];
        //verify if it is a copy or just referncing otherwise after delete phase, the data will be removed from verified compan yas ell
        delete addressesRequestingCompanyVerification[_companyAddress];
        company_request_address.pop();
        //emit event to be done
        emit STATUS(true, _companyAddress);
    }

    //Reject company request
    function companyApplicationRejected(address _companyAddress) public onlyRole(getRoleAdmin(COMPANY_ROLE)){
        require(addressesRequestingCompanyVerification[_companyAddress].appliedForVerification,"Account did not request company verification");
        require(company_request_address[company_request_address.length-1] == _companyAddress, "Not the top");
        delete addressesRequestingCompanyVerification[_companyAddress];
        company_request_address.pop();
            //emit event to be done
        emit STATUS(false, _companyAddress);

    }


    //Project request to review their CO2 offset

     function requestProjectVerification ( string calldata _registrationID, uint256 _tco2Reduction, uint256 _gntTokenBalance, string calldata _document_uri) public{
        //save in addressesRequestingProjectVerification
        addressesRequestingProjectVerification[msg.sender]= KYC_Project(_registrationID, _tco2Reduction, _gntTokenBalance, _document_uri, true);
        project_request_address.push(msg.sender);
    }
    
    //Accept project requet
    function projectApplicationVerified(address _projectAddress) public onlyRole(getRoleAdmin(PROJECT_ROLE)){

        require(addressesRequestingProjectVerification[_projectAddress].appliedForVerification,"Account did not request project verification");
        require(project_request_address[project_request_address.length-1] == _projectAddress, "Not the top");
        addressesRequestingProjectVerification[_projectAddress].appliedForVerification = false;
        _grantRole(PROJECT_ROLE,_projectAddress);
        //add to verified project list
        verifiedProjects[_projectAddress] = addressesRequestingProjectVerification[_projectAddress];
        //verify if it is a copy or just referncing otherwise after delete phase, the data will be removed from verified compan yas ell
        delete addressesRequestingProjectVerification[_projectAddress];
        project_request_address.pop();

        //mint equivalent tokens
        // mint(_projectAddress, (verifiedProjects[_projectAddress].tco2Reduction).mul(Rate));
        //Should be transfer token instead of mint
        // (payable address(this)).transfer(_projectAddress, (verifiedProjects[_projectAddress].tco2Reduction).mul(Rate));
        // IERC20 tokenContract = IERC20(_tokenAddress);

        tokenContract.transfer(_projectAddress, ((verifiedProjects[_projectAddress].tco2Reduction).mul(tco2_multiplier* (10 **18))));
        //emit event to be done
        emit STATUS(true, _projectAddress);

    }

    //Reject proejct request
    function projectApplicationRejected(address _projectAddress) public onlyRole(getRoleAdmin(PROJECT_ROLE)){
        require(addressesRequestingProjectVerification[_projectAddress].appliedForVerification,"Account did not request project verification");
        require(project_request_address[project_request_address.length-1] == _projectAddress, "Not the top");
        delete addressesRequestingProjectVerification[_projectAddress];
        project_request_address.pop();
            //emit event to be done
        emit STATUS(false, _projectAddress);
    }



    function pause() public onlyRole(GOVERNER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(GOVERNER_ROLE) {
        _unpause();
    }


    /*
    ERC20 methods
    */

    // Mint function is private since, it will be called by another func
    function mint(address to, uint256 amount) public onlyRole(GOVERNER_ROLE) {
        // Pop out the specific address
        
        // require(hasRole(PROJECT_ROLE,to), "address is not a verified project");
        _mint(to, amount*(10**18));
        //Emit event (to be done)
    }


    /*Function for buying token by sending equivalent ether to contract
        Buying token by company means:
        1. Company request to buy XX GNT 
        2. Check if sufficient GNT/ETH in the account
        3. Payable Eth receive, and then send equivalent token to the account
        4. Emit event 
        5. Issue NFT for the transaction
        
        

        Function to sell token to contract
        1. Check sufficient balance in contract account
        2. Rate decided by the contract
        3. Add the asked token to the pool, and pay to the requesting amount in ETH equivalent
        4. Emit event
        5. Issue NFT for the transaction
    */

    //Implementation
    //removed addressparam 
    function buyToken() public payable { //onlyRole(COMPANY_ROLE)
        // verifiedCompanies[msg.sender].gntTokenBalance.add(msg.value);
        // approve(address(this),msg.value);
        require(hasRole(COMPANY_ROLE,msg.sender) || hasRole(PROJECT_ROLE, msg.sender), "Not allowed");
        //IERC20 tokenContract = IERC20(_tokenAddress);
        // transferFrom(owner,msg.sender,msg.value*(10**18)); //to transfer in max token unit
        tokenContract.transfer(msg.sender, msg.value*Rate);
        // address(this).send()
        emit STATUS(true, msg.sender);

    }

    function sellToken(  uint256 token) public{ //address _tokenAddress
        // require(hasRole(COMPANY_ROLE,msg.sender) || hasRole(PROJECT_ROLE, msg.sender), "Not allowed");
        // IERC20 tokenContract = IERC20(_tokenAddress);
        //address(this) take this-> msg sender i guess
        payable(msg.sender).transfer( token*(10**18)/Rate);
        transfer(address(this), token*(10**18));
        emit STATUS(true, msg.sender);
    }





    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}
