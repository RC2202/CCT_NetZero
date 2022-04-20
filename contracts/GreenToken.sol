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

    uint256 Rate =1;
    // uint256 public INITIAL_SUPPLY = 1000*(10 ** uint256(decimals));
    enum Roles{ GOV, VALIDATOR, COMPANY, PROJECT }

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
    }

    
    struct KYC_Project {
        string registrationID;
        uint256 tco2Reduction;
        uint256 gntTokenBalance;
        string document_uri;
    }
    mapping(address => KYC_Company) private addressesRequestingCompanyVerification;
    mapping(address => KYC_Project) private addressesRequestingProjectVerification;

    mapping(address => KYC_Company) public verifiedCompanies;
    mapping(address => KYC_Project) public verifiedProjects;

    constructor() ERC20("GreenToken", "GNT") {
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
        _mint(address(this), 9000 * (10 **18));
        // uint256 totalSupply = 10000 * (10 ** uint256(decimals));
        //  owner = msg.sender;
        
    }
    //Declare an Event
    event RequestVerifierEvent(address indexed _from);

    //request verifier role
    function requestVerifierRole() public{
        emit RequestVerifierEvent(msg.sender);
        addressesRequestingVerifierRole[msg.sender]=true;
    }

    //grant verifier  role
    function grantVerifierRole(address applicantAddress) public onlyRole(getRoleAdmin(VERIFIER_ROLE)){
        _grantRole(VERIFIER_ROLE,applicantAddress);
        delete addressesRequestingVerifierRole[applicantAddress];
    }

    //Reject verifier application
    function rejectVerifierApplication(address applicantAddress) public onlyRole(getRoleAdmin(VERIFIER_ROLE)){
        delete addressesRequestingVerifierRole[applicantAddress];
    }


    //Company request to review their CO2 emission
    //change memory to calldata?
    function requestCompanyVerification( string calldata _registrationID, uint256 _tco2Emission, uint256 _gntTokenBalance, string calldata _document_uri) public{
        //save in addressesRequestingCompanyVerification
        addressesRequestingCompanyVerification[msg.sender]= KYC_Company(_registrationID, _tco2Emission, _gntTokenBalance, _document_uri);
    }
                
    //Accept company request

    function companyApplicationVerified(address _companyAddress) public onlyRole(getRoleAdmin(COMPANY_ROLE)){
        _grantRole(COMPANY_ROLE,_companyAddress);
        //add to verified company list
        verifiedCompanies[_companyAddress] = addressesRequestingCompanyVerification[_companyAddress];
        //verify if it is a copy or just referncing otherwise after delete phase, the data will be removed from verified compan yas ell
        delete addressesRequestingCompanyVerification[_companyAddress];

        //emit event to be done
    }

    //Reject company request
    function companyApplicationRejected(address _companyAddress) public onlyRole(getRoleAdmin(COMPANY_ROLE)){
        delete addressesRequestingCompanyVerification[_companyAddress];
            //emit event to be done

    }


    //Project request to review their CO2 offset

     function requestProjectVerification( string calldata _registrationID, uint256 _tco2Reduction, uint256 _gntTokenBalance, string calldata _document_uri) public{
        //save in addressesRequestingProjectVerification
        addressesRequestingProjectVerification[msg.sender]= KYC_Project(_registrationID, _tco2Reduction, _gntTokenBalance, _document_uri);
    }
    
    //Accept project requet
    function projectApplicationVerified(address _projectAddress) public onlyRole(getRoleAdmin(PROJECT_ROLE)){
        _grantRole(PROJECT_ROLE,_projectAddress);
        //add to verified project list
        verifiedProjects[_projectAddress] = addressesRequestingProjectVerification[_projectAddress];
        //verify if it is a copy or just referncing otherwise after delete phase, the data will be removed from verified compan yas ell
        delete addressesRequestingProjectVerification[_projectAddress];

        //mint equivalent tokens
        mint(_projectAddress, (verifiedProjects[_projectAddress].tco2Reduction).mul(Rate));
        //emit event to be done
    }

    //Reject proejct request
    function projectApplicationRejected(address _projectAddress) public onlyRole(getRoleAdmin(PROJECT_ROLE)){
        delete addressesRequestingProjectVerification[_projectAddress];
            //emit event to be done

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
    function mint(address to, uint256 amount) public onlyRole(VERIFIER_ROLE) {
        // Pop out the specific address
        
        require(hasRole(PROJECT_ROLE,to), "address is not a verified project");
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
    function buyToken(address _tokenAddress) public payable { //onlyRole(COMPANY_ROLE)
        // verifiedCompanies[msg.sender].gntTokenBalance.add(msg.value);
        // approve(address(this),msg.value);
        require(hasRole(COMPANY_ROLE,msg.sender) || hasRole(PROJECT_ROLE, msg.sender), "Not allowed");
        IERC20 tokenContract = IERC20(_tokenAddress);
        // transferFrom(owner,msg.sender,msg.value*(10**18)); //to transfer in max token unit
        tokenContract.transfer(msg.sender, msg.value);
        // address(this).send()

    }

    function sellToken(  uint256 amount) public{ //address _tokenAddress
        // require(hasRole(COMPANY_ROLE,msg.sender) || hasRole(PROJECT_ROLE, msg.sender), "Not allowed");
        // IERC20 tokenContract = IERC20(_tokenAddress);
        payable(msg.sender).transfer( amount*(10**18));
        transfer(address(this), amount*(10**18));
    }





    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}