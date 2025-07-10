import { ethers } from 'hardhat';
import { parseEther, formatEther } from 'ethers';
import {
  PlatformRegistry,
  PlatformTreasury,
  ProjectFactory,
  ProjectToken,
  ProjectOffering,
  ProjectTreasury,
  ProjectGovernance,
} from '../../typechain-types';

/**
 * Demonstrates the complete project lifecycle from creation to token distribution
 */
async function main() {
  console.log('🏗️  Partisipro Project Lifecycle Demo');
  console.log('='.repeat(40));

  // Assume platform is already deployed (run deploy-local.ts first)
  const [deployer, spv, investor1, investor2, operator] =
    await ethers.getSigners();

  // You would typically load these addresses from a deployment file
  // For demo purposes, we'll deploy minimal setup
  const LISTING_FEE = parseEther('0.1');
  const MANAGEMENT_FEE_RATE = 500; // 5%
  const MIN_INVESTMENT = parseEther('0.01');
  const MAX_INVESTMENT = parseEther('10');
  const EMERGENCY_THRESHOLD = parseEther('1');

  // Quick platform setup
  console.log('🚀 Setting up platform...');
  const PlatformTreasury = await ethers.getContractFactory('PlatformTreasury');
  const platformTreasury = await PlatformTreasury.deploy(
    deployer.address,
    deployer.address,
    deployer.address,
    EMERGENCY_THRESHOLD
  );

  const PlatformRegistry = await ethers.getContractFactory('PlatformRegistry');
  const platformRegistry = await PlatformRegistry.deploy(
    deployer.address,
    await platformTreasury.getAddress(),
    LISTING_FEE,
    MANAGEMENT_FEE_RATE,
    MIN_INVESTMENT,
    MAX_INVESTMENT
  );

  await platformTreasury.updatePlatformRegistry(
    await platformRegistry.getAddress()
  );

  // Deploy implementations
  const ProjectToken = await ethers.getContractFactory('ProjectToken');
  const projectTokenImpl = await ProjectToken.deploy();

  const ProjectOffering = await ethers.getContractFactory('ProjectOffering');
  const projectOfferingImpl = await ProjectOffering.deploy();

  const ProjectTreasury = await ethers.getContractFactory('ProjectTreasury');
  const projectTreasuryImpl = await ProjectTreasury.deploy();

  const ProjectGovernance =
    await ethers.getContractFactory('ProjectGovernance');
  const projectGovernanceImpl = await ProjectGovernance.deploy();

  const ProjectFactory = await ethers.getContractFactory('ProjectFactory');
  const projectFactory = await ProjectFactory.deploy(
    deployer.address,
    await platformRegistry.getAddress(),
    await platformTreasury.getAddress(),
    await projectTokenImpl.getAddress(),
    await projectOfferingImpl.getAddress(),
    await projectTreasuryImpl.getAddress(),
    await projectGovernanceImpl.getAddress()
  );

  await platformRegistry.grantRole(
    await platformRegistry.OPERATOR_ROLE(),
    operator.address
  );
  await platformRegistry.authorizeFactory(await projectFactory.getAddress());
  console.log('✅ Platform ready');

  // ===== STEP 1: SPV REGISTRATION =====
  console.log('\\n📋 STEP 1: SPV Registration');
  console.log('-'.repeat(30));

  await platformRegistry.registerSPV(
    spv.address,
    'Bandung Smart City Corp',
    'BSC-001'
  );
  const spvInfo = await platformRegistry.getSPVInfo(spv.address);

  console.log(`✅ SPV Registered:`);
  console.log(`  - Address: ${spv.address}`);
  console.log(`  - Name: ${spvInfo.companyName}`);
  console.log(`  - Registration ID: ${spvInfo.registrationId}`);
  console.log(`  - Status: ${spvInfo.isActive ? 'Active' : 'Inactive'}`);

  // ===== STEP 2: PROJECT CREATION =====
  console.log('\\n🏗️  STEP 2: Project Creation');
  console.log('-'.repeat(30));

  const PROJECT_NAME = 'Bandung Light Rail Transit';
  const PROJECT_SYMBOL = 'BLRT';
  const TOTAL_SUPPLY = parseEther('5000'); // 5K tokens
  const TOKEN_PRICE = parseEther('0.002'); // 0.002 ETH per token

  console.log(`📊 Project Parameters:`);
  console.log(`  - Name: ${PROJECT_NAME}`);
  console.log(`  - Symbol: ${PROJECT_SYMBOL}`);
  console.log(`  - Total Supply: ${formatEther(TOTAL_SUPPLY)} tokens`);
  console.log(`  - Token Price: ${formatEther(TOKEN_PRICE)} ETH`);
  console.log(
    `  - Total Project Value: ${formatEther((TOTAL_SUPPLY * TOKEN_PRICE) / parseEther('1'))} ETH`
  );

  const spvBalanceBefore = await ethers.provider.getBalance(spv.address);
  console.log(`💰 SPV Balance Before: ${formatEther(spvBalanceBefore)} ETH`);

  // Create project
  console.log('🚀 Creating project...');
  const createTx = await projectFactory
    .connect(spv)
    .createProject(PROJECT_NAME, PROJECT_SYMBOL, TOTAL_SUPPLY, TOKEN_PRICE, {
      value: LISTING_FEE,
    });
  const createReceipt = await createTx.wait();

  console.log(
    `✅ Project created - Gas used: ${createReceipt?.gasUsed?.toString()}`
  );

  const spvBalanceAfter = await ethers.provider.getBalance(spv.address);
  console.log(`💰 SPV Balance After: ${formatEther(spvBalanceAfter)} ETH`);
  console.log(
    `💸 Listing Fee Paid: ${formatEther(spvBalanceBefore - spvBalanceAfter - (createReceipt?.gasUsed || 0n) * (createReceipt?.gasPrice || 0n))} ETH`
  );

  // Get project contracts
  const project = await projectFactory.getProject(1);
  const projectToken = await ethers.getContractAt(
    'ProjectToken',
    project.projectToken
  );
  const projectOffering = await ethers.getContractAt(
    'ProjectOffering',
    project.offering
  );
  const projectTreasuryContract = await ethers.getContractAt(
    'ProjectTreasury',
    project.treasury
  );
  const projectGovernance = await ethers.getContractAt(
    'ProjectGovernance',
    project.governance
  );

  console.log(`📍 Project Contracts:`);
  console.log(`  - Token: ${project.projectToken}`);
  console.log(`  - Offering: ${project.offering}`);
  console.log(`  - Treasury: ${project.treasury}`);
  console.log(`  - Governance: ${project.governance}`);

  // Finalize project setup
  console.log('🔧 Finalizing project setup...');
  await projectToken.connect(spv).setGovernance(project.governance);
  await projectToken.connect(spv).addAuthorizedMinter(project.offering);
  console.log('✅ Project setup completed');

  // ===== STEP 3: INVESTOR ONBOARDING =====
  console.log('\\n👥 STEP 3: Investor Onboarding');
  console.log('-'.repeat(30));

  // Verify investors
  console.log('🔍 Verifying investors...');
  await platformRegistry.connect(operator).verifyInvestor(investor1.address);
  await platformRegistry.connect(operator).verifyInvestor(investor2.address);

  const investor1Info = await platformRegistry.getInvestorInfo(
    investor1.address
  );
  const investor2Info = await platformRegistry.getInvestorInfo(
    investor2.address
  );

  console.log(
    `✅ Investor 1: ${investor1.address} - ${investor1Info.isVerified ? 'Verified' : 'Unverified'}`
  );
  console.log(
    `✅ Investor 2: ${investor2.address} - ${investor2Info.isVerified ? 'Verified' : 'Unverified'}`
  );

  // ===== STEP 4: OFFERING PERIOD =====
  console.log('\\n💰 STEP 4: Token Offering Period');
  console.log('-'.repeat(30));

  const offeringInfo = await projectOffering.getOfferingInfo();
  console.log(`📅 Offering Schedule:`);
  console.log(
    `  - Start: ${new Date(Number(offeringInfo.startTime) * 1000).toLocaleString()}`
  );
  console.log(
    `  - End: ${new Date(Number(offeringInfo.endTime) * 1000).toLocaleString()}`
  );
  console.log(`  - Soft Cap: ${formatEther(offeringInfo.softCap)} ETH`);
  console.log(`  - Hard Cap: ${formatEther(offeringInfo.hardCap)} ETH`);

  // Fast forward to offering start
  console.log('⏭️  Fast forwarding to offering start...');
  await ethers.provider.send('evm_increaseTime', [
    Number(offeringInfo.startTime) - Math.floor(Date.now() / 1000) + 1,
  ]);
  await ethers.provider.send('evm_mine', []);

  // Investments
  console.log('💸 Processing investments...');
  const investment1 = parseEther('1.5'); // 1.5 ETH
  const investment2 = parseEther('2.0'); // 2.0 ETH

  console.log(`👤 Investor 1 investing ${formatEther(investment1)} ETH...`);
  const investTx1 = await projectOffering
    .connect(investor1)
    .invest({ value: investment1 });
  const investReceipt1 = await investTx1.wait();
  console.log(
    `✅ Investment 1 processed - Gas used: ${investReceipt1?.gasUsed?.toString()}`
  );

  console.log(`👤 Investor 2 investing ${formatEther(investment2)} ETH...`);
  const investTx2 = await projectOffering
    .connect(investor2)
    .invest({ value: investment2 });
  const investReceipt2 = await investTx2.wait();
  console.log(
    `✅ Investment 2 processed - Gas used: ${investReceipt2?.gasUsed?.toString()}`
  );

  // Check progress
  const progress = await projectOffering.getOfferingProgress();
  console.log(`📊 Offering Progress:`);
  console.log(`  - Total Raised: ${formatEther(progress[0])} ETH`);
  console.log(`  - Total Investors: ${progress[1]}`);
  console.log(
    `  - Soft Cap Status: ${progress[0] >= offeringInfo.softCap ? '✅ Reached' : '❌ Not Reached'}`
  );

  // ===== STEP 5: OFFERING FINALIZATION =====
  console.log('\\n🎯 STEP 5: Offering Finalization');
  console.log('-'.repeat(30));

  // Fast forward to offering end
  console.log('⏭️  Fast forwarding to offering end...');
  await ethers.provider.send('evm_increaseTime', [
    Number(offeringInfo.endTime) - Math.floor(Date.now() / 1000) + 1,
  ]);
  await ethers.provider.send('evm_mine', []);

  // Finalize offering
  console.log('🏁 Finalizing offering...');
  const finalizeTx = await projectOffering.connect(spv).finalizeOffering();
  const finalizeReceipt = await finalizeTx.wait();
  console.log(
    `✅ Offering finalized - Gas used: ${finalizeReceipt?.gasUsed?.toString()}`
  );

  // Check if tokens can be claimed
  const finalizedInfo = await projectOffering.getOfferingInfo();
  console.log(`📋 Offering Status:`);
  console.log(`  - Finalized: ${finalizedInfo.isFinalized ? '✅' : '❌'}`);
  console.log(`  - Active: ${finalizedInfo.isActive ? '✅' : '❌'}`);

  // Check if transfers are enabled
  const transfersEnabled = await projectToken.transfersEnabled();
  console.log(`🔄 Token transfers enabled: ${transfersEnabled ? '✅' : '❌'}`);

  // ===== STEP 6: TOKEN CLAIMING =====
  console.log('\\n🎟️  STEP 6: Token Claiming');
  console.log('-'.repeat(30));

  // Get investor allocation before claiming
  const investor1Allocation = await projectOffering.getInvestorInfo(
    investor1.address
  );
  const investor2Allocation = await projectOffering.getInvestorInfo(
    investor2.address
  );

  console.log(`📊 Token Allocations:`);
  console.log(
    `  - Investor 1: ${formatEther(investor1Allocation.tokensAllocated)} tokens`
  );
  console.log(
    `  - Investor 2: ${formatEther(investor2Allocation.tokensAllocated)} tokens`
  );

  // Claim tokens
  console.log('🎟️  Claiming tokens...');
  const claimTx1 = await projectOffering.connect(investor1).claimTokens();
  const claimReceipt1 = await claimTx1.wait();
  console.log(
    `✅ Investor 1 claimed - Gas used: ${claimReceipt1?.gasUsed?.toString()}`
  );

  const claimTx2 = await projectOffering.connect(investor2).claimTokens();
  const claimReceipt2 = await claimTx2.wait();
  console.log(
    `✅ Investor 2 claimed - Gas used: ${claimReceipt2?.gasUsed?.toString()}`
  );

  // Check final token balances
  const balance1 = await projectToken.balanceOf(investor1.address);
  const balance2 = await projectToken.balanceOf(investor2.address);
  const totalDistributed = balance1 + balance2;

  console.log(`💰 Final Token Balances:`);
  console.log(`  - Investor 1: ${formatEther(balance1)} tokens`);
  console.log(`  - Investor 2: ${formatEther(balance2)} tokens`);
  console.log(`  - Total Distributed: ${formatEther(totalDistributed)} tokens`);

  // ===== STEP 7: TREASURY FUNDING =====
  console.log('\\n🏦 STEP 7: Treasury Funding');
  console.log('-'.repeat(30));

  const treasuryBalance = await ethers.provider.getBalance(
    await projectTreasuryContract.getAddress()
  );
  console.log(
    `💰 Project Treasury Balance: ${formatEther(treasuryBalance)} ETH`
  );

  // Check platform treasury (should have received listing fee)
  const platformTreasuryBalance = await ethers.provider.getBalance(
    await platformTreasury.getAddress()
  );
  console.log(
    `🏛️  Platform Treasury Balance: ${formatEther(platformTreasuryBalance)} ETH`
  );

  // ===== STEP 8: GOVERNANCE READINESS =====
  console.log('\\n🗳️  STEP 8: Governance System Ready');
  console.log('-'.repeat(30));

  const governanceSettings = await projectGovernance.governanceSettings();
  console.log(`⚙️  Governance Configuration:`);
  console.log(`  - Voting Delay: ${governanceSettings.votingDelay} seconds`);
  console.log(`  - Voting Period: ${governanceSettings.votingPeriod} seconds`);
  console.log(
    `  - Proposal Threshold: ${formatEther(governanceSettings.proposalThreshold)} tokens`
  );
  console.log(`  - Quorum: ${governanceSettings.quorumNumerator}%`);
  console.log(`  - Active: ${governanceSettings.isActive ? '✅' : '❌'}`);

  // ===== COMPLETION SUMMARY =====
  console.log('\\n🎉 PROJECT LIFECYCLE COMPLETED!');
  console.log('='.repeat(40));

  console.log(`✅ Successfully demonstrated:`);
  console.log(`  - ✅ SPV registration and authorization`);
  console.log(`  - ✅ Project creation with factory pattern`);
  console.log(`  - ✅ Investor KYC and verification`);
  console.log(`  - ✅ Token offering with caps and timing`);
  console.log(`  - ✅ Investment processing and validation`);
  console.log(`  - ✅ Offering finalization and fee collection`);
  console.log(`  - ✅ Token distribution to investors`);
  console.log(`  - ✅ Treasury funding and governance setup`);

  console.log(`\\n📊 Final Statistics:`);
  console.log(`  - Total Raised: ${formatEther(progress[0])} ETH`);
  console.log(
    `  - Tokens Distributed: ${formatEther(totalDistributed)} tokens`
  );
  console.log(
    `  - Platform Fee Collected: ${formatEther(platformTreasuryBalance)} ETH`
  );
  console.log(`  - Project Treasury: ${formatEther(treasuryBalance)} ETH`);
  console.log(`  - Total Participants: ${progress[1]} investors`);

  console.log(`\\n⛽ Gas Usage Summary:`);
  console.log(
    `  - Project Creation: ${createReceipt?.gasUsed?.toString()} gas`
  );
  console.log(
    `  - Investment (avg): ${((investReceipt1?.gasUsed || 0n) + (investReceipt2?.gasUsed || 0n)) / 2n} gas`
  );
  console.log(`  - Finalization: ${finalizeReceipt?.gasUsed?.toString()} gas`);
  console.log(
    `  - Token Claiming (avg): ${((claimReceipt1?.gasUsed || 0n) + (claimReceipt2?.gasUsed || 0n)) / 2n} gas`
  );

  console.log(`\\n🚀 Project is now ready for:`);
  console.log(`  - 🗳️  Governance proposals and voting`);
  console.log(`  - 💰 Profit distribution`);
  console.log(`  - 🔄 Secondary market trading`);
  console.log(`  - 📈 Performance tracking`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Project lifecycle demo failed:', error);
    process.exit(1);
  });
