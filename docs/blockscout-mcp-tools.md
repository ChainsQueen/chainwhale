# Blockscout MCP Available Tools

Complete list of all 18 tools available in Blockscout MCP and what they should return.

## ✅ Working Tools (Confirmed)

### 1. `get_token_transfers`
**Purpose:** Get ERC-20 token transfers for an address within a time range  
**Status:** ✅ **WORKS PERFECTLY**

**Parameters:**
- `chain_id` (required): Blockchain ID
- `address` (required): Wallet address
- `age_from` (optional): Start date/time (e.g., "24h", "7d")
- `age_to` (optional): End date/time (default: "now")
- `token` (optional): Filter by specific token address
- `cursor` (optional): Pagination cursor

**Returns:**
```typescript
{
  items: [
    {
      hash: string,
      from: string,
      to: string,
      value: string,
      token: {
        symbol: string,
        address: string,
        name: string,
        decimals: string
      },
      timestamp: number,
      valueUsd: number
    }
  ],
  nextCursor?: string
}
```

### 2. `get_transactions_by_address`
**Purpose:** Get native currency transfers and smart contract interactions  
**Status:** ✅ **WORKS**

**Parameters:**
- `chain_id` (required)
- `address` (required)
- `age_from` (optional)
- `age_to` (optional)
- `methods` (optional): Filter by method signature
- `cursor` (optional)

**Returns:** Transaction list with native transfers and contract calls

### 3. `get_transaction_info`
**Purpose:** Get comprehensive transaction information with decoded parameters  
**Status:** ✅ **WORKS**

**Parameters:**
- `chain_id` (required)
- `transaction_hash` (required)
- `include_raw_input` (optional, default: false)

**Returns:** Enriched transaction data with decoded inputs, token transfers, fee breakdown

### 4. `get_transaction_logs`
**Purpose:** Get transaction logs with decoded event parameters  
**Status:** ✅ **WORKS**

**Parameters:**
- `chain_id` (required)
- `transaction_hash` (required)
- `cursor` (optional)

**Returns:** Decoded event logs with types and values

### 5. `transaction_summary`
**Purpose:** Get human-readable transaction summaries  
**Status:** ✅ **WORKS**

**Parameters:**
- `chain_id` (required)
- `transaction_hash` (required)

**Returns:** Natural language description of transaction (transfers, swaps, NFT sales, etc.)

### 6. `get_chains_list`
**Purpose:** Get list of supported blockchain chains with IDs  
**Status:** ✅ **WORKS**

**Parameters:** None

**Returns:** List of chain IDs and names

### 7. `get_address_by_ens_name`
**Purpose:** Resolve ENS domain name to Ethereum address  
**Status:** ✅ **WORKS**

**Parameters:**
- `name` (required): ENS domain (e.g., "vitalik.eth")

**Returns:** Ethereum address

## ❌ Not Working Tools (Ethereum Mainnet)

### 8. `get_address_info`
**Purpose:** Get comprehensive address information  
**Status:** ❌ **RETURNS ZERO/EMPTY DATA**

**Parameters:**
- `chain_id` (required)
- `address` (required)

**Should Return:**
```typescript
{
  address: string,
  balance: string,        // ❌ Always returns "0"
  balanceUsd: number,     // ❌ Always undefined
  isContract: boolean,
  ensName?: string,
  // Token details if contract is a token
  // Proxy info if contract is a proxy
}
```

**Actual Returns:** Always `{ balance: "0", balanceUsd: undefined, isContract: false }`

### 9. `get_tokens_by_address`
**Purpose:** Get ERC-20 token holdings with market data  
**Status:** ❌ **RETURNS EMPTY ARRAY**

**Parameters:**
- `chain_id` (required)
- `address` (required)
- `cursor` (optional)

**Should Return:**
```typescript
{
  items: [
    {
      token: {
        symbol: string,
        name: string,
        decimals: string,
        address: string,
        exchange_rate: string
      },
      value: string,
      // Market data, holder count, etc.
    }
  ]
}
```

**Actual Returns:** Always `[]` (empty array)

## 🔍 Untested Tools

### 10. `get_block_info`
**Purpose:** Get block information (timestamp, gas, transaction count)  
**Parameters:**
- `chain_id` (required)
- `number_or_hash` (required): Block number or hash
- `include_transactions` (optional): Include tx hashes

### 11. `get_latest_block`
**Purpose:** Get latest indexed block number and timestamp  
**Parameters:**
- `chain_id` (required)

### 12. `nft_tokens_by_address`
**Purpose:** Get NFT tokens (ERC-721, ERC-404, ERC-1155) owned by address  
**Parameters:**
- `chain_id` (required)
- `address` (required)
- `cursor` (optional)

### 13. `get_contract_abi`
**Purpose:** Get smart contract ABI  
**Parameters:**
- `chain_id` (required)
- `address` (required): Smart contract address

### 14. `inspect_contract_code`
**Purpose:** Inspect verified contract source code or metadata  
**Parameters:**
- `chain_id` (required)
- `address` (required)
- `file_name` (optional): Specific source file

### 15. `read_contract`
**Purpose:** Call smart contract function (view/pure) and get decoded result  
**Parameters:**
- `chain_id` (required)
- `address` (required)
- `abi` (required): Function ABI
- `function_name` (required)
- `args` (optional): JSON array of arguments
- `block` (optional): Block number or tag

### 16. `lookup_token_by_symbol`
**Purpose:** Search for token addresses by symbol or name  
**Parameters:**
- `chain_id` (required)
- `symbol` (required): Token symbol or name

### 17. `direct_api_call`
**Purpose:** Call raw Blockscout API endpoint for advanced queries  
**Parameters:**
- `chain_id` (required)
- `endpoint_path` (required): API path (e.g., '/api/v2/stats')
- `query_params` (optional): Query parameters object
- `cursor` (optional)

## Summary

### ✅ Reliable for Production Use
1. Token transfers tracking
2. Transaction history
3. Transaction details & logs
4. Transaction summaries
5. ENS resolution
6. Chain list

### ❌ Not Working (Ethereum Mainnet)
1. Address balance info
2. Token holdings

### 🔍 Need Testing
1. Block info
2. NFT tokens
3. Contract ABI/code
4. Contract read calls
5. Token lookup

## Recommended Approach

**For Whale Detection:**
- ✅ Use `get_token_transfers` to track high-value transfers
- ✅ Use `get_transactions_by_address` for activity analysis
- ✅ Use `transaction_summary` for quick insights
- ❌ Don't rely on balance/holdings data

**For Wallet Analysis:**
- Focus on activity-based metrics (transfer volume, frequency)
- Track whale-to-whale interactions
- Monitor DeFi protocol usage
- Analyze gas spending patterns
