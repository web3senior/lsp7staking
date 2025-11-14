// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

// Import necessary LUKSO LSP and OpenZeppelin contracts
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/ILSP7DigitalAsset.sol";

/// @title BanditStakingPool
/// @author Aratta Labs
/// @notice A staking pool contract for $BANDIT (LSP7) tokens that rewards in $BANDIT and $FABS (LSP7). It uses a simple, per-user Annual Percentage Rate (APR) model.
/// @custom:version 1
/// @custom:emoji 💸
/// @custom:security-contact atenyun@gmail.com
contract BanditStakingPool is Ownable, Pausable, ReentrancyGuard {
    // --- STATE VARIABLES & CONSTANTS ---

    // The staking token: $BANDIT (LSP7)
    ILSP7DigitalAsset public immutable BANDIT_TOKEN;
    // The reward token: $FABS (LSP7)
    ILSP7DigitalAsset public immutable FABS_TOKEN;

    // Fixed APR and reward split parameters
    uint256 private constant APR_RATE_BP = 4200; // 42% in basis points (4200 / 10000)
    uint256 private constant BASIS_POINTS_DENOMINATOR = 10000;
    uint256 private constant SECONDS_PER_YEAR = 31536000; // ~365.25 days
    uint256 private constant SECONDS_PER_DAY = 86400; // 24 hours
    uint256 private constant RATE_PRECISION = 1e18; // Multiplier for fixed-point math

    // Reward split (70% BANDIT, 30% FABS)
    uint256 private constant BANDIT_REWARD_PERCENT = 70;
    uint256 private constant FABS_REWARD_PERCENT = 30;

    // Staking limits and cooldown
    // 5,000,000 BANDIT limit (assuming 18 decimals for BANDIT)
    uint256 public constant MAX_STAKE_LIMIT = 5_000_000 ether;
    // 7 days cooldown (7 * 24 * 60 * 60) = 604800
    uint256 public constant COOLDOWN_PERIOD = 7 minutes;

    // Total staked $BANDIT in the pool
    uint256 public totalStaked;

    // User information structure
    struct UserInfo {
        uint256 stakedAmount; // Amount of $BANDIT staked
        uint256 lastInteractionTime; // Timestamp when the user last staked/claimed, used for APR calculation
        uint256 unstakeRequestAmount; // Amount requested to withdraw (during cooldown)
        uint256 unstakeAvailableTimestamp; // Timestamp when withdrawal becomes available
    }

    // Mapping from staker address to their staking information
    mapping(address => UserInfo) public userInfo;

    // --- EVENTS ---

    event Staked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 banditAmount, uint256 fabsAmount);
    event UnstakeRequested(address indexed user, uint256 amount, uint256 availableAt);
    event StakedWithdrawn(address indexed user, uint256 amount);
    event RewardsFunded(uint256 banditAmount, uint256 fabsAmount);

    // --- CONSTRUCTOR & INITIALIZATION ---

    constructor(address _banditToken, address _fabsToken) Ownable(msg.sender) {
        require(_banditToken != address(0) && _fabsToken != address(0), "Invalid token addresses");
        BANDIT_TOKEN = ILSP7DigitalAsset(_banditToken);
        FABS_TOKEN = ILSP7DigitalAsset(_fabsToken);
    }

    // --- INTERNAL REWARD LOGIC ---

    /**
     * @dev Calculates the pending reward for a user in $BANDIT and $FABS amounts using simple APR.
     * Rewards are calculated linearly based on time elapsed since the last interaction.
     * @param _user The address of the user.
     * @return banditReward The pending $BANDIT reward amount.
     * @return fabsReward The pending $FABS reward amount.
     * @return timeElapsed The duration used for the calculation.
     */
    function pendingRewards(address _user) public view returns (uint256 banditReward, uint256 fabsReward, uint256 timeElapsed) {
        UserInfo storage user = userInfo[_user];
        if (user.stakedAmount == 0) {
            return (0, 0, 0);
        }

        timeElapsed = block.timestamp - user.lastInteractionTime;

        if (timeElapsed == 0) {
            return (0, 0, 0);
        }

        // Simple APR Formula:
        // accruedRewardUnits = Staked * APR * Time Elapsed / SECONDS_PER_YEAR
        uint256 accruedRewardUnits = (user.stakedAmount * APR_RATE_BP * timeElapsed * RATE_PRECISION) / (BASIS_POINTS_DENOMINATOR * SECONDS_PER_YEAR);

        // Divide by RATE_PRECISION (1e18) to bring the result back to 1e18 scale (token units).
        accruedRewardUnits /= RATE_PRECISION;

        // Split the accrued reward units 70/30
        banditReward = (accruedRewardUnits * BANDIT_REWARD_PERCENT) / 100;
        fabsReward = (accruedRewardUnits * FABS_REWARD_PERCENT) / 100;

        // Explicit return added for clarity and to ensure correct return behavior.
        return (banditReward, fabsReward, timeElapsed);
    }

    /**
     * @dev Calculates the total rewards the entire pool generates in a 24-hour period (daily rewards).
     * This uses the pool's current totalStaked amount and the fixed APR rate.
     * @return totalBanditReward The potential total $BANDIT reward amount over one day.
     * @return totalFabsReward The potential total $FABS reward amount over one day.
     */
    function getTotalDailyRewards() public view returns (uint256 totalBanditReward, uint256 totalFabsReward) {
        if (totalStaked == 0) {
            return (0, 0);
        }

        // Daily Reward Formula (using total staked amount):
        // accruedRewardUnits = Total Staked * APR * SECONDS_PER_DAY / SECONDS_PER_YEAR
        uint256 accruedRewardUnits = (totalStaked * APR_RATE_BP * SECONDS_PER_DAY * RATE_PRECISION) / (BASIS_POINTS_DENOMINATOR * SECONDS_PER_YEAR);

        // Divide by RATE_PRECISION (1e18) to bring the result back to token units.
        accruedRewardUnits /= RATE_PRECISION;

        // Split the accrued reward units 70/30
        totalBanditReward = (accruedRewardUnits * BANDIT_REWARD_PERCENT) / 100;
        totalFabsReward = (accruedRewardUnits * FABS_REWARD_PERCENT) / 100;

        return (totalBanditReward, totalFabsReward);
    }

    /**
     * @dev Returns the current available reward pool balances for $BANDIT and $FABS.
     * For $BANDIT, this excludes the staked principal. For $FABS, it is the full balance.
     * @return banditRewardReserve The available $BANDIT reward reserve (contract balance - totalStaked).
     * @return fabsRewardReserve The available $FABS reward reserve (contract balance).
     */
    function getRewardPoolBalances() public view returns (uint256 banditRewardReserve, uint256 fabsRewardReserve) {
        // $BANDIT Reserve = Contract Balance - Staked Principal
        uint256 banditBalance = BANDIT_TOKEN.balanceOf(address(this));

        // Safety check to ensure the balance is not less than the staked amount (should never happen, but good practice)
        if (banditBalance >= totalStaked) {
            banditRewardReserve = banditBalance - totalStaked;
        } else {
            // This indicates a severe logic error or external malicious token transfer
            banditRewardReserve = 0;
        }

        // $FABS Reserve = Contract Balance (since FABS is only a reward token, not staked principal)
        fabsRewardReserve = FABS_TOKEN.balanceOf(address(this));

        return (banditRewardReserve, fabsRewardReserve);
    }

    // --- CORE USER FUNCTIONS ---

    /**
     * @dev Allows users to stake $BANDIT tokens.
     * Claim pending rewards first to finalize the last staking period.
     * @param _amount The amount of $BANDIT to stake.
     */
    function stake(uint256 _amount) public whenNotPaused nonReentrant {
        require(_amount > 0, "Stake amount must be greater than zero");

        // 1. Claim any pending rewards before changing the stake amount
        if (userInfo[msg.sender].stakedAmount > 0) {
            _claimAndResetTime(msg.sender);
        }

        // 2. Check total stake limit
        require(totalStaked + _amount <= MAX_STAKE_LIMIT, "Exceeds maximum staking capacity");

        // 3. Update user and total state
        userInfo[msg.sender].stakedAmount += _amount;
        totalStaked += _amount;
        userInfo[msg.sender].lastInteractionTime = block.timestamp;

        // 4. Transfer $BANDIT tokens from user to contract
        BANDIT_TOKEN.transfer(msg.sender, address(this), _amount, true, "0x");

        emit Staked(msg.sender, _amount);
    }

    /**
     * @dev Internal helper to claim rewards and reset the interaction time.
     */
    function _claimAndResetTime(address _user) internal {
        UserInfo storage user = userInfo[_user];

        // 1. Calculate rewards and capture time elapsed
        (uint256 banditReward, uint256 fabsReward, uint256 timeElapsed) = pendingRewards(_user);

        if (banditReward > 0 || fabsReward > 0) {
            // 2. Transfer rewards

            // Check contract balance before transfer
            uint256 banditBalance = BANDIT_TOKEN.balanceOf(address(this));
            uint256 fabsBalance = FABS_TOKEN.balanceOf(address(this));

            // Security Implementation: Revert if the pool cannot cover the calculated reward.
            // This ensures the fixed APR guarantee is upheld and forces the owner to replenish the pool.
            require(banditReward <= banditBalance - totalStaked, "Bandit pool insufficient for calculated reward");
            require(fabsReward <= fabsBalance, "FABS pool insufficient for calculated reward");

            // Since the require checks passed, the actual reward is the full calculated reward.
            uint256 actualBanditReward = banditReward;
            uint256 actualFabsReward = fabsReward;

            if (actualBanditReward > 0) {
                // Transfer from contract to user
                BANDIT_TOKEN.transfer(address(this), _user, actualBanditReward, true, "0x");
            }

            if (actualFabsReward > 0) {
                // Transfer from contract to user
                FABS_TOKEN.transfer(address(this), _user, actualFabsReward, true, "0x");
            }

            emit RewardsClaimed(_user, actualBanditReward, actualFabsReward);
        }

        // 3. Reset the timer only if time has elapsed.
        if (timeElapsed > 0) {
            user.lastInteractionTime = block.timestamp;
        }
    }

    /**
     * @dev Claims the accumulated $BANDIT and $FABS rewards.
     */
    function claimRewards() public whenNotPaused nonReentrant {
        _claimAndResetTime(msg.sender);
    }

    /**
     * @dev Initiates the unstaking process, which starts the 7-day cooldown.
     * Claims pending rewards first to finalize the last staking period.
     * @param _amount The amount of $BANDIT to prepare for withdrawal.
     */
    function requestUnstake(uint256 _amount) public whenNotPaused nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        require(_amount > 0, "Unstake amount must be greater than zero");
        require(_amount <= user.stakedAmount, "Amount exceeds staked balance");
        require(user.unstakeRequestAmount == 0, "Existing unstake request is pending");

        // Claim pending rewards first (standard practice)
        _claimAndResetTime(msg.sender);

        // Decrease staked amount immediately, but tokens remain locked in contract
        user.stakedAmount -= _amount;

        // Update totalStaked to reflect the reduction in the active stake
        totalStaked -= _amount;

        // Set up the cooldown request
        user.unstakeRequestAmount = _amount;
        user.unstakeAvailableTimestamp = block.timestamp + COOLDOWN_PERIOD;

        emit UnstakeRequested(msg.sender, _amount, user.unstakeAvailableTimestamp);
    }

    /**
     * @dev Finalizes the withdrawal of staked tokens after the 7-day cooldown has passed.
     */
    function withdrawStaked() public nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        uint256 amount = user.unstakeRequestAmount;

        require(amount > 0, "No pending unstake request");
        require(block.timestamp >= user.unstakeAvailableTimestamp, "Cool-down period not over yet");

        // Since the stake amount was already reduced, we claim rewards one last time
        // to finalize any rewards accrued on the remaining *active* stake.
        // The withdrawn amount has already stopped accruing rewards since requestUnstake.
        _claimAndResetTime(msg.sender);

        // Reset the request state
        user.unstakeRequestAmount = 0;
        user.unstakeAvailableTimestamp = 0;

        // Transfer $BANDIT tokens back to user
        BANDIT_TOKEN.transfer(address(this), msg.sender, amount, true, "0x");

        emit StakedWithdrawn(msg.sender, amount);
    }

    // --- ADMIN/OWNER FUNCTIONS ---

    /**
     * @dev Allows the owner to pre-fund the reward pool with $BANDIT and $FABS.
     * This must be called after contract deployment and token addresses are set.
     * NOTE: Tokens must be approved to this contract address before calling this.
     * @param _banditAmount The amount of $BANDIT to transfer from owner to contract.
     * @param _fabsAmount The amount of $FABS to transfer from owner to contract.
     */
    function fundRewardPool(uint256 _banditAmount, uint256 _fabsAmount) external onlyOwner {
        if (_banditAmount > 0) {
            // Transfer from owner (msg.sender) to contract (address(this))
            BANDIT_TOKEN.transfer(msg.sender, address(this), _banditAmount, true, "0x");
        }
        if (_fabsAmount > 0) {
            // Transfer from owner (msg.sender) to contract (address(this))
            FABS_TOKEN.transfer(msg.sender, address(this), _fabsAmount, true, "0x");
        }
        emit RewardsFunded(_banditAmount, _fabsAmount);
    }

    /**
     * @dev Emergency withdrawal of remaining reward tokens by the owner.
     * The staked $BANDIT principal is protected and cannot be withdrawn using this function.
     * @param _token The address of the token to withdraw (BANDIT or FABS).
     * @param _amount The amount to withdraw.
     */
    function ownerWithdrawRewards(address _token, uint256 _amount) external onlyOwner {
        if (_token == address(BANDIT_TOKEN)) {
            // Get the total BANDIT balance of the contract
            uint256 availableBalance = BANDIT_TOKEN.balanceOf(address(this));

            // The amount that can be withdrawn must not exceed (Total Balance - totalStaked).
            // This ensures that the staked principal is always protected.
            require(availableBalance >= totalStaked, "Logic Error: Staked amount exceeds balance"); // Safety check
            uint256 excessBandit = availableBalance - totalStaked;

            require(_amount <= excessBandit, "Withdrawal amount exceeds available reward reserve for BANDIT");

            // Transfer from contract (address(this)) to owner (msg.sender)
            BANDIT_TOKEN.transfer(address(this), msg.sender, _amount, true, "0x");
        } else if (_token == address(FABS_TOKEN)) {
            // Transfer from contract (address(this)) to owner (msg.sender)
            FABS_TOKEN.transfer(address(this), msg.sender, _amount, true, "0x");
        } else {
            revert("Unknown token address");
        }
    }

    /**
     * @dev Toggles the paused state of the contract, preventing staking actions.
     */
    function togglePause() external onlyOwner {
        if (paused()) {
            _unpause();
        } else {
            _pause();
        }
    }
}
