import Web3 from 'web3'
import ABI from '@/abi/lsp7staking.json'
import LSP7ABI from '@/abi/lsp7.json'

/**
 * Initialize staking contract
 */
export function initStakingContract() {
  const rpcUrl = process.env.NEXT_PUBLIC_LUKSO_PROVIDER

  if (!rpcUrl) throw new Error('WEB3_RPC_URL is not defined in environment variables.')

  // 1. Initialize Web3 with an HttpProvider for server-side connection
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl))

  // Create a Contract instance
  const contract = new web3.eth.Contract(ABI, process.env.NEXT_PUBLIC_STAKING_CONTRACT)
  return { web3, contract }
}

/**
 * Initialize $BANDIT token
 */
export function initBanditContract() {
  const rpcUrl = process.env.NEXT_PUBLIC_LUKSO_PROVIDER

  if (!rpcUrl) throw new Error('WEB3_RPC_URL is not defined in environment variables.')

  // 1. Initialize Web3 with an HttpProvider for server-side connection
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl))

  // Create a Contract instance
  const contract = new web3.eth.Contract(LSP7ABI, process.env.NEXT_PUBLIC_BANDIT_CONTRACT)
  return { web3, contract }
}

/**
 * Initialize $FABS token
 */
export function initFabsContract() {
  const rpcUrl = process.env.NEXT_PUBLIC_LUKSO_PROVIDER

  if (!rpcUrl) throw new Error('WEB3_RPC_URL is not defined in environment variables.')

  // 1. Initialize Web3 with an HttpProvider for server-side connection
  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl))

  // Create a Contract instance
  const contract = new web3.eth.Contract(LSP7ABI, process.env.NEXT_PUBLIC_FABS_CONTRACT)
  return { web3, contract }
}

/**
 * Get balance of BANDIT token
 * @param {string} addr 
 * @returns {bigint}
 */
export async function getBalanceOfBandit(addr) {
  const { web3, contract } = initBanditContract()

  try {
    const result = await contract.methods.balanceOf(addr).call()
    return result
  } catch (error) {
    console.error('Error fetching contract data with Web3.js:', error)
    return { error }
  }
}

export async function getStakedBalance(addr) {
  const { web3, contract } = initStakingContract()

  try {
    const result = await contract.methods.userInfo(addr).call()
    return result
  } catch (error) {
    console.error('Error fetching contract data with Web3.js:', error)
    return { error }
  }
}
export async function getTotalDailyRewards() {
  const { web3, contract } = initStakingContract()

  try {
    const result = await contract.methods.getTotalDailyRewards().call()
    return result
  } catch (error) {
    console.error('Error fetching contract data with Web3.js:', error)
    return { error }
  }
}
export async function getTotalStaked() {
  const { web3, contract } = initStakingContract()

  try {
    const result = await contract.methods.totalStaked().call()
    return result
  } catch (error) {
    console.error('Error fetching contract data with Web3.js:', error)
    return { error }
  }
}

export async function getPendingRewards(addr) {
  const { web3, contract } = initStakingContract()

  try {
    const result = await contract.methods.pendingRewards(addr).call()
    return result
  } catch (error) {
    console.error('Error fetching contract data with Web3.js:', error)
    return { error }
  }
}

export async function getReactionCounter() {
  const { web3, contract } = initStakingContract()

  try {
    const result = await contract.methods._reactionCounter().call()
    return result
  } catch (error) {
    console.error('Error fetching contract data with Web3.js:', error)
    return { error }
  }
}

export async function getAllEvents() {
  const { web3, contract } = initStakingContract()

  try {
    // Get the latest block number (optional, but good for defining a range)
    const latestBlock = await web3.eth.getBlockNumber()
    console.log(`Latest block: ${latestBlock}`)

    // Fetch all events from the contract
    const allEvents = await contract.getPastEvents('allEvents', {
      fromBlock: 0, // Start from block 0 or a specific block number
      toBlock: 'latest', // Go up to the latest block or a specific block number
    })

    console.log(`All historical events: count(${allEvents.length})`)
    allEvents.forEach((event) => {
      console.log('---')
      console.log(`Event Name: ${event.event}`)
      console.log(`Block Number: ${event.blockNumber}`)
      console.log(`Transaction Hash: ${event.transactionHash}`)
      console.log('Return Values:', event.returnValues)
    })
    return allEvents
  } catch (error) {
    console.error('Error fetching past events:', error)
  }
}
export async function getAllReacted() {
  const { web3, contract } = initStakingContract()

  try {
    // Get the latest block number (optional, but good for defining a range)
    const latestBlock = await web3.eth.getBlockNumber()

    // Fetch specific events (e.g., 'Transfer' events)
    const reactEvents = await contract.getPastEvents('Reacted', {
      fromBlock: 0, // Example: fetch events from the last 1000 blocks
      toBlock: 'latest',
    })

    // reactEvents.forEach(event => {
    //     console.log('---');
    //     console.log(`Block Number: ${event.blockNumber}`);
    //     console.log(`From: ${event.returnValues.from}`);
    //     console.log(`To: ${event.returnValues.to}`);
    //     console.log(`Value: ${event.returnValues.value}`);
    // });
    return reactEvents
  } catch (error) {
    console.error('Error fetching past events:', error)
    return error
  }
}
export async function getLastGift() {
  const { web3, contract } = initStakingContract()

  try {
    // Get the latest block number (optional, but good for defining a range)
    const latestBlock = await web3.eth.getBlockNumber()

    // Fetch specific events (e.g., 'Transfer' events)
    const reactEvents = await contract.getPastEvents('Reacted', {
      fromBlock: 0, // Example: fetch events from the last 1000 blocks
      toBlock: 'latest',
    })

    // reactEvents.forEach(event => {
    //     console.log('---');
    //     console.log(`Block Number: ${event.blockNumber}`);
    //     console.log(`From: ${event.returnValues.from}`);
    //     console.log(`To: ${event.returnValues.to}`);
    //     console.log(`Value: ${event.returnValues.value}`);
    // });
    return reactEvents
  } catch (error) {
    console.error('Error fetching past events:', error)
    return error
  }
}
