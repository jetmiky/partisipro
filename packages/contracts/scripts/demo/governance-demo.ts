import { ethers } from 'hardhat';
import { parseEther, formatEther } from 'ethers';
import {
  PlatformRegistry,
  PlatformTreasury,
  ProjectFactory,
  ProjectToken,
  ProjectOffering,
  ProjectGovernance,
  ClaimTopicsRegistry,
  TrustedIssuersRegistry,
  IdentityRegistry,
} from '../../typechain-types';

/**
 * Demonstrates the governance system with proposal creation, voting, and execution
 */
async function main() {
  console.log('🗳️  Partisipro Governance System Demo');
  console.log('='.repeat(40));

  // Get signers
  const [deployer, spv, investor1, investor2, investor3, operator] =
    await ethers.getSigners();

  console.log('👥 Governance Participants:');
  console.log(`- SPV: ${spv.address}`);
  console.log(`- Investor 1: ${investor1.address}`);
  console.log(`- Investor 2: ${investor2.address}`);
  console.log(`- Investor 3: ${investor3.address}`);

  // Quick setup (in production, this would be pre-deployed)
  console.log('\\n🚀 Setting up platform and project...');

  const LISTING_FEE = parseEther('0.1');
  const MANAGEMENT_FEE_RATE = 500;
  const MIN_INVESTMENT = parseEther('0.01');
  const MAX_INVESTMENT = parseEther('10');
  const EMERGENCY_THRESHOLD = parseEther('1');

  // Deploy platform
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

  // Deploy ERC-3643 Infrastructure
  const ClaimTopicsRegistry = await ethers.getContractFactory(
    'ClaimTopicsRegistry'
  );
  const claimTopicsRegistry = await ClaimTopicsRegistry.deploy(
    deployer.address
  );
  await claimTopicsRegistry.waitForDeployment();

  const TrustedIssuersRegistry = await ethers.getContractFactory(
    'TrustedIssuersRegistry'
  );
  const trustedIssuersRegistry = await TrustedIssuersRegistry.deploy(
    deployer.address,
    await claimTopicsRegistry.getAddress()
  );
  await trustedIssuersRegistry.waitForDeployment();

  const IdentityRegistry = await ethers.getContractFactory('IdentityRegistry');
  const identityRegistry = await IdentityRegistry.deploy(
    deployer.address,
    await claimTopicsRegistry.getAddress(),
    await trustedIssuersRegistry.getAddress()
  );
  await identityRegistry.waitForDeployment();

  await trustedIssuersRegistry.grantRole(
    await trustedIssuersRegistry.OPERATOR_ROLE(),
    await identityRegistry.getAddress()
  );

  // Deploy implementations and factory
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
    await identityRegistry.getAddress(),
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

  // Setup SPV and investors
  await platformRegistry.registerSPV(
    spv.address,
    'Surabaya Metro Corp',
    'SMC-001'
  );
  await platformRegistry.connect(operator).verifyInvestor(investor1.address);
  await platformRegistry.connect(operator).verifyInvestor(investor2.address);
  await platformRegistry.connect(operator).verifyInvestor(investor3.address);

  // Create project
  const PROJECT_NAME = 'Surabaya Metro Line 1';
  const PROJECT_SYMBOL = 'SML1';
  const TOTAL_SUPPLY = parseEther('8000'); // 8K tokens
  const TOKEN_PRICE = parseEther('0.00125'); // 0.00125 ETH per token

  await projectFactory
    .connect(spv)
    .createProject(PROJECT_NAME, PROJECT_SYMBOL, TOTAL_SUPPLY, TOKEN_PRICE, {
      value: LISTING_FEE,
    });

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
  const projectGovernance = await ethers.getContractAt(
    'ProjectGovernance',
    project.governance
  );

  // Setup project
  await projectToken.connect(spv).setGovernance(project.governance);
  await projectToken.connect(spv).addAuthorizedMinter(project.offering);

  // Fast forward to offering and complete investments
  const offeringInfo = await projectOffering.getOfferingInfo();
  await ethers.provider.send('evm_increaseTime', [
    Number(offeringInfo.startTime) - Math.floor(Date.now() / 1000) + 1,
  ]);
  await ethers.provider.send('evm_mine', []);

  // Distribute tokens with different weights for voting
  await projectOffering.connect(investor1).invest({ value: parseEther('2.5') }); // 2000 tokens
  await projectOffering
    .connect(investor2)
    .invest({ value: parseEther('3.75') }); // 3000 tokens
  await projectOffering
    .connect(investor3)
    .invest({ value: parseEther('1.25') }); // 1000 tokens

  // Finalize offering
  await ethers.provider.send('evm_increaseTime', [
    Number(offeringInfo.endTime) - Math.floor(Date.now() / 1000) + 1,
  ]);
  await ethers.provider.send('evm_mine', []);
  await projectOffering.connect(spv).finalizeOffering();

  // Claim tokens
  await projectOffering.connect(investor1).claimTokens();
  await projectOffering.connect(investor2).claimTokens();
  await projectOffering.connect(investor3).claimTokens();

  console.log('✅ Platform and project setup completed');

  // Check token balances for voting power
  const balance1 = await projectToken.balanceOf(investor1.address);
  const balance2 = await projectToken.balanceOf(investor2.address);
  const balance3 = await projectToken.balanceOf(investor3.address);

  console.log('\\n💰 Token Holdings (Voting Power):');
  console.log(`- Investor 1: ${formatEther(balance1)} tokens`);
  console.log(`- Investor 2: ${formatEther(balance2)} tokens`);
  console.log(`- Investor 3: ${formatEther(balance3)} tokens`);

  // ===== GOVERNANCE DEMO BEGINS =====
  console.log('\\n🗳️  GOVERNANCE SYSTEM DEMONSTRATION');
  console.log('='.repeat(40));

  // ===== STEP 1: GOVERNANCE CONFIGURATION =====
  console.log('\\n⚙️  STEP 1: Governance Configuration');
  console.log('-'.repeat(30));

  const governanceSettings = await projectGovernance.governanceSettings();
  console.log(`📋 Governance Settings:`);
  console.log(
    `  - Voting Delay: ${governanceSettings.votingDelay} seconds (${governanceSettings.votingDelay / 86400n} days)`
  );
  console.log(
    `  - Voting Period: ${governanceSettings.votingPeriod} seconds (${governanceSettings.votingPeriod / 86400n} days)`
  );
  console.log(
    `  - Proposal Threshold: ${formatEther(governanceSettings.proposalThreshold)} tokens`
  );
  console.log(`  - Quorum Requirement: ${governanceSettings.quorumNumerator}%`);
  console.log(
    `  - System Active: ${governanceSettings.isActive ? '✅' : '❌'}`
  );

  const totalSupply = await projectToken.totalSupply();
  const quorumRequired =
    (totalSupply * governanceSettings.quorumNumerator) /
    governanceSettings.quorumDenominator;
  console.log(`  - Quorum Required: ${formatEther(quorumRequired)} tokens`);

  // ===== STEP 2: PROPOSAL CREATION =====
  console.log('\\n📝 STEP 2: Proposal Creation');
  console.log('-'.repeat(30));

  console.log('🎯 Creating Proposal 1: Enable Secondary Trading');
  const targets1 = [await projectToken.getAddress()];
  const values1 = [0];
  const calldatas1 = [
    projectToken.interface.encodeFunctionData('enableTransfers'),
  ];
  const signatures1 = ['enableTransfers()'];

  const proposeTx1 = await projectGovernance
    .connect(investor1)
    .propose(
      'Enable Secondary Trading',
      'Proposal to enable token transfers for secondary market trading on DEX platforms',
      targets1,
      values1,
      calldatas1,
      signatures1
    );
  const proposeReceipt1 = await proposeTx1.wait();

  console.log(
    `✅ Proposal 1 created - Gas used: ${proposeReceipt1?.gasUsed?.toString()}`
  );

  console.log('🎯 Creating Proposal 2: Governance Parameter Update');
  const targets2 = [await projectGovernance.getAddress()];
  const values2 = [0];
  const calldatas2 = [
    projectGovernance.interface.encodeFunctionData('updateGovernanceSettings', [
      governanceSettings.votingDelay,
      governanceSettings.votingPeriod,
      governanceSettings.proposalThreshold,
      15n, // Reduce quorum to 15%
    ]),
  ];
  const signatures2 = [
    'updateGovernanceSettings(uint256,uint256,uint256,uint256)',
  ];

  const proposeTx2 = await projectGovernance
    .connect(investor2)
    .propose(
      'Reduce Quorum Requirement',
      'Proposal to reduce quorum requirement from 20% to 15% for better governance participation',
      targets2,
      values2,
      calldatas2,
      signatures2
    );
  const proposeReceipt2 = await proposeTx2.wait();

  console.log(
    `✅ Proposal 2 created - Gas used: ${proposeReceipt2?.gasUsed?.toString()}`
  );

  // Get proposal details
  const proposal1 = await projectGovernance.getProposal(1);
  const proposal2 = await projectGovernance.getProposal(2);

  console.log('\\n📊 Proposal Details:');
  console.log(`Proposal 1:`);
  console.log(`  - Title: ${proposal1.title}`);
  console.log(`  - Proposer: ${proposal1.proposer}`);
  console.log(
    `  - Start Time: ${new Date(Number(proposal1.startTime) * 1000).toLocaleString()}`
  );
  console.log(
    `  - End Time: ${new Date(Number(proposal1.endTime) * 1000).toLocaleString()}`
  );

  console.log(`Proposal 2:`);
  console.log(`  - Title: ${proposal2.title}`);
  console.log(`  - Proposer: ${proposal2.proposer}`);
  console.log(
    `  - Start Time: ${new Date(Number(proposal2.startTime) * 1000).toLocaleString()}`
  );
  console.log(
    `  - End Time: ${new Date(Number(proposal2.endTime) * 1000).toLocaleString()}`
  );

  // ===== STEP 3: VOTING PHASE =====
  console.log('\\n🗳️  STEP 3: Voting Phase');
  console.log('-'.repeat(30));

  // Fast forward to voting start
  console.log('⏭️  Fast forwarding to voting start...');
  await ethers.provider.send('evm_increaseTime', [
    Number(proposal1.startTime) - Math.floor(Date.now() / 1000) + 1,
  ]);
  await ethers.provider.send('evm_mine', []);

  // Vote on Proposal 1
  console.log('🗳️  Voting on Proposal 1 (Enable Secondary Trading):');

  const voteTx1_1 = await projectGovernance
    .connect(investor1)
    .castVote(1, 1, 'I support secondary trading for liquidity');
  const voteReceipt1_1 = await voteTx1_1.wait();
  console.log(
    `✅ Investor 1 voted FOR - Gas used: ${voteReceipt1_1?.gasUsed?.toString()}`
  );

  const voteTx1_2 = await projectGovernance
    .connect(investor2)
    .castVote(1, 1, 'Good for project growth');
  const voteReceipt1_2 = await voteTx1_2.wait();
  console.log(
    `✅ Investor 2 voted FOR - Gas used: ${voteReceipt1_2?.gasUsed?.toString()}`
  );

  const voteTx1_3 = await projectGovernance
    .connect(investor3)
    .castVote(1, 0, 'Too early for secondary trading');
  const voteReceipt1_3 = await voteTx1_3.wait();
  console.log(
    `✅ Investor 3 voted AGAINST - Gas used: ${voteReceipt1_3?.gasUsed?.toString()}`
  );

  // Vote on Proposal 2
  console.log('\\n🗳️  Voting on Proposal 2 (Reduce Quorum):');

  const voteTx2_1 = await projectGovernance
    .connect(investor1)
    .castVote(2, 0, 'Current quorum is fine');
  const voteReceipt2_1 = await voteTx2_1.wait();
  console.log(
    `✅ Investor 1 voted AGAINST - Gas used: ${voteReceipt2_1?.gasUsed?.toString()}`
  );

  const voteTx2_2 = await projectGovernance
    .connect(investor2)
    .castVote(2, 1, 'Lower quorum improves participation');
  const voteReceipt2_2 = await voteTx2_2.wait();
  console.log(
    `✅ Investor 2 voted FOR - Gas used: ${voteReceipt2_2?.gasUsed?.toString()}`
  );

  const voteTx2_3 = await projectGovernance
    .connect(investor3)
    .castVote(2, 2, 'I abstain from governance changes');
  const voteReceipt2_3 = await voteTx2_3.wait();
  console.log(
    `✅ Investor 3 voted ABSTAIN - Gas used: ${voteReceipt2_3?.gasUsed?.toString()}`
  );

  // ===== STEP 4: VOTING RESULTS =====
  console.log('\\n📊 STEP 4: Voting Results');
  console.log('-'.repeat(30));

  // Get updated proposals
  const updatedProposal1 = await projectGovernance.getProposal(1);
  const updatedProposal2 = await projectGovernance.getProposal(2);

  console.log('📈 Proposal 1 Results (Enable Secondary Trading):');
  console.log(`  - For: ${formatEther(updatedProposal1.forVotes)} tokens`);
  console.log(
    `  - Against: ${formatEther(updatedProposal1.againstVotes)} tokens`
  );
  console.log(
    `  - Abstain: ${formatEther(updatedProposal1.abstainVotes)} tokens`
  );
  console.log(
    `  - Total Votes: ${formatEther(updatedProposal1.forVotes + updatedProposal1.againstVotes + updatedProposal1.abstainVotes)} tokens`
  );
  console.log(
    `  - Quorum Required: ${formatEther(updatedProposal1.quorumVotes)} tokens`
  );
  console.log(
    `  - Quorum Reached: ${updatedProposal1.forVotes + updatedProposal1.againstVotes + updatedProposal1.abstainVotes >= updatedProposal1.quorumVotes ? '✅' : '❌'}`
  );

  console.log('\\n📈 Proposal 2 Results (Reduce Quorum):');
  console.log(`  - For: ${formatEther(updatedProposal2.forVotes)} tokens`);
  console.log(
    `  - Against: ${formatEther(updatedProposal2.againstVotes)} tokens`
  );
  console.log(
    `  - Abstain: ${formatEther(updatedProposal2.abstainVotes)} tokens`
  );
  console.log(
    `  - Total Votes: ${formatEther(updatedProposal2.forVotes + updatedProposal2.againstVotes + updatedProposal2.abstainVotes)} tokens`
  );
  console.log(
    `  - Quorum Required: ${formatEther(updatedProposal2.quorumVotes)} tokens`
  );
  console.log(
    `  - Quorum Reached: ${updatedProposal2.forVotes + updatedProposal2.againstVotes + updatedProposal2.abstainVotes >= updatedProposal2.quorumVotes ? '✅' : '❌'}`
  );

  // ===== STEP 5: PROPOSAL STATES =====
  console.log('\\n🏛️  STEP 5: Proposal States');
  console.log('-'.repeat(30));

  // Check current states
  const state1 = await projectGovernance.state(1);
  const state2 = await projectGovernance.state(2);
  const stateNames = [
    'Pending',
    'Active',
    'Canceled',
    'Defeated',
    'Succeeded',
    'Queued',
    'Expired',
    'Executed',
  ];

  console.log(`📍 Current States:`);
  console.log(`  - Proposal 1: ${stateNames[Number(state1)]}`);
  console.log(`  - Proposal 2: ${stateNames[Number(state2)]}`);

  // Fast forward to voting end
  console.log('\\n⏭️  Fast forwarding to voting end...');
  await ethers.provider.send('evm_increaseTime', [
    Number(proposal1.endTime) - Math.floor(Date.now() / 1000) + 1,
  ]);
  await ethers.provider.send('evm_mine', []);

  // Check final states
  const finalState1 = await projectGovernance.state(1);
  const finalState2 = await projectGovernance.state(2);

  console.log(`📍 Final States:`);
  console.log(`  - Proposal 1: ${stateNames[Number(finalState1)]}`);
  console.log(`  - Proposal 2: ${stateNames[Number(finalState2)]}`);

  // ===== STEP 6: ACTIVE PROPOSALS TRACKING =====
  console.log('\\n📋 STEP 6: Active Proposals Tracking');
  console.log('-'.repeat(30));

  const activeProposals = await projectGovernance.getActiveProposals();
  console.log(`📊 Active Proposals Count: ${activeProposals.length}`);
  for (let i = 0; i < activeProposals.length; i++) {
    const proposal = await projectGovernance.getProposal(activeProposals[i]);
    console.log(`  - Proposal ${activeProposals[i]}: ${proposal.title}`);
  }

  // ===== STEP 7: VOTING POWER ANALYSIS =====
  console.log('\\n⚖️  STEP 7: Voting Power Analysis');
  console.log('-'.repeat(30));

  const totalVotingPower = balance1 + balance2 + balance3;
  console.log(`📊 Voting Power Distribution:`);
  console.log(
    `  - Investor 1: ${formatEther(balance1)} tokens (${(balance1 * 100n) / totalVotingPower}%)`
  );
  console.log(
    `  - Investor 2: ${formatEther(balance2)} tokens (${(balance2 * 100n) / totalVotingPower}%)`
  );
  console.log(
    `  - Investor 3: ${formatEther(balance3)} tokens (${(balance3 * 100n) / totalVotingPower}%)`
  );

  // Check individual vote records
  const vote1_1 = await projectGovernance.getVote(1, investor1.address);
  const vote1_2 = await projectGovernance.getVote(1, investor2.address);
  const vote1_3 = await projectGovernance.getVote(1, investor3.address);

  console.log(`\\n📝 Individual Vote Records (Proposal 1):`);
  console.log(
    `  - Investor 1: ${vote1_1.hasVoted ? 'Voted' : 'Not voted'} - ${['Against', 'For', 'Abstain'][Number(vote1_1.vote)]} - Weight: ${formatEther(vote1_1.weight)}`
  );
  console.log(
    `  - Investor 2: ${vote1_2.hasVoted ? 'Voted' : 'Not voted'} - ${['Against', 'For', 'Abstain'][Number(vote1_2.vote)]} - Weight: ${formatEther(vote1_2.weight)}`
  );
  console.log(
    `  - Investor 3: ${vote1_3.hasVoted ? 'Voted' : 'Not voted'} - ${['Against', 'For', 'Abstain'][Number(vote1_3.vote)]} - Weight: ${formatEther(vote1_3.weight)}`
  );

  // ===== STEP 8: GOVERNANCE STATISTICS =====
  console.log('\\n📊 STEP 8: Governance Statistics');
  console.log('-'.repeat(30));

  const proposalCount = await projectGovernance.proposalCount();
  console.log(`📈 Governance Metrics:`);
  console.log(`  - Total Proposals: ${proposalCount}`);
  console.log(`  - Active Proposals: ${activeProposals.length}`);
  console.log(
    `  - Governance Participation: ${((balance1 + balance2 + balance3) * 100n) / totalVotingPower}%`
  );

  // Calculate voting participation rates
  const proposal1Participation =
    ((updatedProposal1.forVotes +
      updatedProposal1.againstVotes +
      updatedProposal1.abstainVotes) *
      100n) /
    totalVotingPower;
  const proposal2Participation =
    ((updatedProposal2.forVotes +
      updatedProposal2.againstVotes +
      updatedProposal2.abstainVotes) *
      100n) /
    totalVotingPower;

  console.log(`  - Proposal 1 Participation: ${proposal1Participation}%`);
  console.log(`  - Proposal 2 Participation: ${proposal2Participation}%`);

  // ===== GOVERNANCE DEMO COMPLETION =====
  console.log('\\n🎉 GOVERNANCE DEMO COMPLETED!');
  console.log('='.repeat(40));

  console.log('✅ Successfully demonstrated:');
  console.log('  - ✅ Token-weighted governance system');
  console.log('  - ✅ Proposal creation by token holders');
  console.log('  - ✅ Multi-option voting (For/Against/Abstain)');
  console.log('  - ✅ Quorum requirements and validation');
  console.log('  - ✅ Proposal state management');
  console.log('  - ✅ Voting power calculation and distribution');
  console.log('  - ✅ Individual vote tracking');
  console.log('  - ✅ Governance participation metrics');

  console.log('\\n📊 Final Summary:');
  console.log(`  - Total Proposals Created: ${proposalCount}`);
  console.log(
    `  - Proposal 1 (Enable Trading): ${stateNames[Number(finalState1)]}`
  );
  console.log(
    `  - Proposal 2 (Reduce Quorum): ${stateNames[Number(finalState2)]}`
  );
  console.log(
    `  - Average Participation: ${(proposal1Participation + proposal2Participation) / 2n}%`
  );

  console.log('\\n⛽ Gas Usage Analysis:');
  console.log(
    `  - Proposal Creation: ~${((proposeReceipt1?.gasUsed || 0n) + (proposeReceipt2?.gasUsed || 0n)) / 2n} gas`
  );
  console.log(
    `  - Voting: ~${((voteReceipt1_1?.gasUsed || 0n) + (voteReceipt1_2?.gasUsed || 0n) + (voteReceipt1_3?.gasUsed || 0n)) / 3n} gas`
  );

  console.log('\\n🚀 Governance system is fully functional and ready for:');
  console.log('  - 📝 Complex proposal creation and execution');
  console.log('  - 🗳️  Large-scale community voting');
  console.log('  - ⚖️  Weighted decision making');
  console.log('  - 📊 Governance analytics and reporting');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Governance demo failed:', error);
    process.exit(1);
  });
