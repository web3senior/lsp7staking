// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.30;

import "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/presets/LSP7Mintable.sol";
import "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/extensions/LSP7Burnable.sol";

contract Fabs is LSP7Mintable, LSP7Burnable {
    uint256 public immutable tokenSupplyCap;

    // Error
    error SupplyCapExceeded(uint256 currentSupply, uint256 attemptedMintAmount);

    constructor() LSP7Mintable("Fabs", "FABS", msg.sender, 0, false) {
        tokenSupplyCap = 50_000_000 * 10**18;
        mint(msg.sender, tokenSupplyCap, true, "");
    }

    function _mint(
        address to,
        uint256 amount,
        bool force,
        bytes memory data
    ) internal virtual override {
        uint256 newSupply = totalSupply() + amount;

        if (newSupply > tokenSupplyCap) {
            revert SupplyCapExceeded(totalSupply(), amount);
        }

        super._mint(to, amount, force, data);
    }
}