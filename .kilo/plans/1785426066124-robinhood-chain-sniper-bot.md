# Robinhood Chain Token Sniper Bot - Implementation Plan

## Overview

A Python-based automated token sniper bot for **Robinhood Chain** (Arbitrum Orbit L2, Chain ID 4663). The bot monitors new token launches on the **Pons** launchpad (and similar factories), buys newly listed tokens before others, and manages exits via take-profit limits or time-based sells. Packaged as a single `.exe` file using PyInstaller.

> **Critical Disclaimer**: This bot interacts with smart contracts on Robinhood Chain via public RPC endpoints. You are responsible for your own funds. Memecoin trading is extremely high risk — tokens can go to zero instantly. Never invest more than you can afford to lose entirely.

---

## 1. What This Bot Actually Does

### The Problem
On Robinhood Chain, new tokens launch via launchpads like **Pons** (ponsfamily.com). When a new token launches, there's a brief window where early buyers can get in before the price moves up. This bot automates that process — it watches for new launches and buys instantly.

### The Solution
1. **Listen** for `TokenLaunched` events on the Pons factory contract in real-time via WebSocket RPC
2. **Filter** new launches based on configurable criteria (min liquidity, blacklist, etc.)
3. **Buy** the new token immediately via Uniswap V3 SwapRouter02
4. **Manage exits** — either sell when a take-profit % is hit, or sell after a configurable time duration
5. **All controlled** from a single config file and a simple CLI/TUI

### Key Parameters You Configure
| Parameter | What It Controls | Example |
|-----------|-----------------|---------|
| `buy_amount_eth` | How much ETH to spend per launch | `0.05` |
| `take_profit_pct` | Sell when price is up X% | `0.10` (10%) |
| `stop_loss_pct` | Sell when price is down X% | `0.05` (5%) |
| `sell_after_minutes` | Force-sell after X minutes | `60` |
| `max_positions` | Max tokens held at once | `5` |
| `min_liquidity_eth` | Minimum pool liquidity to consider | `0.5` |
| `sniper_mode` | Aggressive: buy on first block | `true` |
| `dry_run` | Simulate without real trades | `true` |

---

## 2. Robinhood Chain Ecosystem

### 2.1 Network Details
| Property | Value |
|----------|-------|
| Chain ID | 4663 |
| Native Asset | ETH |
| RPC (public) | `https://rpc.mainnet.chain.robinhood.com` |
| RPC (Alchemy) | `https://robinhood-mainnet.g.alchemy.com/v2/{API_KEY}` |
| WebSocket RPC | `wss://feed.mainnet.chain.robinhood.com` |
| Block Explorer | `robinhoodchain.blockscout.com` |
| Chain Type | Arbitrum Orbit (EVM-compatible) |

### 2.2 Pons Launchpad (ponsfamily.com)
- **Factory**: `0xA5aAb3F0c6EeadF30Ef1D3Eb997108E976351feB`
- **Active since**: Block 8,991,118
- **Token standard**: Fixed supply of 1,000,000,000 tokens
- **Pairing**: Every token trades against WETH in its own Uniswap V3 pool
- **Pool fee**: 1% (10000 basis points)
- **Launch fee**: 0.0005 ETH
- **Graduation threshold**: 4.2 ETH paired
- **Launch protection**: First 2 blocks — creator-only buy; then 5% max per wallet
- **No bonding curve** — price moves purely based on pool trades

### 2.3 Key Contracts
| Contract | Address | Purpose |
|----------|---------|---------|
| Pons Factory | `0xA5aAb3F0c6EeadF30Ef1D3Eb997108E976351feB` | Emits TokenLaunched events |
| WETH | `0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73` | Quote token for all pools |
| SwapRouter02 | `0xCaf681a66D020601342297493863E78C959E5cb2` | Executes swaps |
| Quoter V2 | `0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7` | Gets price quotes |
| Position Manager | `0x73991a25C818Bf1f1128dEAaB1492D45638DE0D3` | Manages LP positions |

### 2.4 On-Chain Events to Monitor
- **`TokenLaunched`** — emitted when a new token is created (this is the sniper trigger)
- **`Swap`** — emitted on every trade (for tracking fills and price)
- **`Transfer`** — emitted on token transfers (for tracking holder distribution)

---

## 3. Architecture

### 3.1 High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Sniper Bot (Single .exe)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   CLI / TUI   │  │   Config     │  │   Logger     │     │
│  │  (rich/typer) │  │  (Pydantic)  │  │  (structlog) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Event Monitor Layer                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  WebSocket RPC → TokenLaunched Listener     │   │   │
│  │  │  (viem / web3.py on Robinhood Chain)        │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Strategy Engine                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │  Filter     │  │  Sniper     │  │  Exit      │  │   │
│  │  │  (liquidity,│  │  Mode       │  │  Manager   │  │   │
│  │  │  blacklist, │  │  (buy fast) │  │  (TP/SL/   │  │   │
│  │  │  min cap)   │  │             │  │   timed)   │  │   │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Execution Layer                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │  Wallet     │  │  Swap       │  │  Order     │  │   │
│  │  │  Manager    │  │  Executor   │  │  Tracker   │  │   │
│  │  │  (private   │  │  (Uniswap   │  │  (fills,   │  │   │
│  │  │   key,      │  │   V3        │  │   P&L)     │  │   │
│  │  │   signing)  │  │   Router02) │  │            │  │   │
│  │  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Risk Manager │  │  State Store │  │  Alert/Notify│     │
│  │  (circuit     │  │  (SQLite/    │  │  (console +  │     │
│  │   breaker,    │  │   JSON file) │  │   file log)  │     │
│  │   limits)     │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Module Structure (Single Directory)

Since this is a single-file executable, the code will be organized as a single Python package that gets bundled:

```
sniper_bot/
├── __init__.py
├── main.py                  # Entry point: CLI parsing + bot startup
├── config.py                # Pydantic config model + YAML loader
├── constants.py             # Chain IDs, contract addresses, ABIs
├── monitor/
│   ├── __init__.py
│   ├── websocket_listener.py  # WebSocket RPC → TokenLaunched events
│   ├── event_parser.py        # Parse and decode event data
│   └── token_info.py          # Read token metadata from chain
├── strategy/
│   ├── __init__.py
│   ├── base.py                # Abstract strategy interface
│   ├── sniper.py              # Core sniper: buy on launch
│   └── exit_manager.py        # TP/SL/timed exit logic
├── execution/
│   ├── __init__.py
│   ├── wallet.py              # Private key management, signing
│   ├── swap_executor.py       # Uniswap V3 swap execution
│   ├── quote_fetcher.py       # Get current prices via Quoter V2
│   └── gas_estimator.py       # Estimate gas for swaps
├── risk/
│   ├── __init__.py
│   ├── manager.py             # Risk checks before every trade
│   ├── circuit_breaker.py     # Emergency stop conditions
│   └── limits.py              # Position limits, daily caps
├── state/
│   ├── __init__.py
│   ├── store.py               # SQLite/JSON state persistence
│   └── models.py              # Position, Trade, Launch data models
├── utils/
│   ├── __init__.py
│   ├── cli.py                 # Rich-based TUI
│   ├── formatters.py          # Number formatting, table display
│   └── helpers.py             # General utilities
├── requirements.txt
├── config.yaml                # Default configuration
├── .env.example               # Environment variable template
├── build.spec                 # PyInstaller spec file
└── build.bat                  # Build script for .exe
```

---

## 4. Technology Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Language | Python 3.11+ | Async support, easy packaging |
| Blockchain RPC | `web3.py` + `viem` (via subprocess) | Ethereum-compatible RPC calls |
| WebSocket | `websockets` async library | Real-time event listening |
| Config | Pydantic v2 + YAML | Type-safe, validated config |
| CLI/TUI | `rich` + `typer` | Beautiful terminal UI |
| State Storage | SQLite (via `sqlite3`) | No external DB needed, single file |
| Signing | `eth_account` (from web3.py) | ECDSA signing for transactions |
| Packaging | PyInstaller | Single .exe output |
| Logging | `structlog` + console output | Structured, colored terminal logs |
| Alerts | File-based + console | No external services needed |

### 4.1 requirements.txt
```txt
web3>=6.0.0
pyyaml>=6.0
pydantic>=2.6.0
pydantic-settings>=2.2.0
rich>=13.0.0
typer>=0.9.0
structlog>=24.0.0
websockets>=12.0
eth-account>=0.10.0
python-dotenv>=1.0.0
sqlite-utils>=3.35
click>=8.1.0
```

### 4.2 Why Not Electron?
- Electron produces a 100MB+ binary vs PyInstaller's ~50MB
- Python is more natural for blockchain/Web3 interactions
- `web3.py` and `eth-account` are mature Python libraries
- Single-file executable with PyInstaller is straightforward
- Less memory usage, faster startup

---

## 5. Core Module Specifications

### 5.1 Configuration (`config.py`)

```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import yaml
import os

class RiskConfig(BaseModel):
    max_daily_loss_usd: float = 200.0
    max_daily_trades: int = 20
    max_positions: int = 5
    max_position_pct: float = 0.20  # 20% of portfolio per token
    min_liquidity_eth: float = 0.3
    max_slippage_pct: float = 0.05  # 5%
    max_gas_gwei: float = 50.0
    stop_loss_pct: float = 0.05     # 5% default
    take_profit_pct: float = 0.10   # 10% default
    sell_after_minutes: float = 0   # 0 = disabled, use TP/SL only
    circuit_breaker_daily_loss: bool = True
    circuit_breaker_consecutive_fails: int = 5

class SniperConfig(BaseModel):
    enabled: bool = True
    sniper_mode: bool = False  # If true, buy on first block (aggressive)
    buy_amount_eth: float = 0.05
    buy_amount_pct_of_portfolio: float = 0.0  # 0 = use fixed amount
    min_liquidity_eth: float = 0.3
    max_positions: int = 5
    slippage_pct: float = 0.05
    priority_fee_gwei: float = 2.0
    max_base_fee_gwei: float = 50.0

class ExitConfig(BaseModel):
    take_profit_pct: float = 0.10
    stop_loss_pct: float = 0.05
    sell_after_minutes: float = 0  # 0 = disabled
    sell_on_circuit_breaker: bool = True
    trailing_stop_pct: float = 0.0  # 0 = disabled

class FilterConfig(BaseModel):
    min_market_cap_usd: float = 1000.0
    max_market_cap_usd: float = 10_000_000.0
    blacklist_symbols: list[str] = Field(default_factory=list)
    whitelist_symbols: list[str] = Field(default_factory=list)  # empty = all
    require_liquidity_lock: bool = True
    min_holders: int = 0
    max_holders: int = 10000

class ChainConfig(BaseModel):
    chain_id: int = 4663
    rpc_url: str = "https://rpc.mainnet.chain.robinhood.com"
    ws_url: str = "wss://feed.mainnet.chain.robinhood.com"
    factory_address: str = "0xA5aAb3F0c6EeadF30Ef1D3Eb997108E976351feB"
    weth_address: str = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73"
    router_address: str = "0xCaf681a66D020601342297493863E78C959E5cb2"
    quoter_address: str = "0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7"

class BotConfig(BaseModel):
    chain: ChainConfig = Field(default_factory=ChainConfig)
    risk: RiskConfig = Field(default_factory=RiskConfig)
    sniper: SniperConfig = Field(default_factory=SniperConfig)
    exit: ExitConfig = Field(default_factory=ExitConfig)
    filters: FilterConfig = Field(default_factory=FilterConfig)
    dry_run: bool = True
    state_db_path: str = "sniper_state.db"
    log_level: str = "INFO"
    log_file: str = "sniper_bot.log"

def load_config(path: str = "config.yaml") -> BotConfig:
    with open(path) as f:
        data = yaml.safe_load(f)
    # Environment variable overrides
    for key in ["ROBINHOOD_RPC_URL", "PRIVATE_KEY", "BUY_AMOUNT_ETH",
                "TAKE_PROFIT_PCT", "STOP_LOSS_PCT", "DRY_RUN"]:
        env_val = os.environ.get(key)
        if env_val:
            # Apply override (simplified - full implementation handles nested keys)
            pass
    return BotConfig(**data)
```

### 5.2 YAML Configuration (`config.yaml`)

```yaml
chain:
  chain_id: 4663
  rpc_url: "https://rpc.mainnet.chain.robinhood.com"
  ws_url: "wss://feed.mainnet.chain.robinhood.com"
  factory_address: "0xA5aAb3F0c6EeadF30Ef1D3Eb997108E976351feB"
  weth_address: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73"
  router_address: "0xCaf681a66D020601342297493863E78C959E5cb2"
  quoter_address: "0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7"

risk:
  max_daily_loss_usd: 200.0
  max_daily_trades: 20
  max_positions: 5
  max_position_pct: 0.20
  min_liquidity_eth: 0.3
  max_slippage_pct: 0.05
  max_gas_gwei: 50.0
  stop_loss_pct: 0.05
  take_profit_pct: 0.10
  sell_after_minutes: 0
  circuit_breaker_daily_loss: true
  circuit_breaker_consecutive_fails: 5

sniper:
  enabled: true
  sniper_mode: false
  buy_amount_eth: 0.05
  buy_amount_pct_of_portfolio: 0.0
  min_liquidity_eth: 0.3
  max_positions: 5
  slippage_pct: 0.05
  priority_fee_gwei: 2.0
  max_base_fee_gwei: 50.0

exit:
  take_profit_pct: 0.10
  stop_loss_pct: 0.05
  sell_after_minutes: 0
  sell_on_circuit_breaker: true
  trailing_stop_pct: 0.0

filters:
  min_market_cap_usd: 1000.0
  max_market_cap_usd: 10000000.0
  blacklist_symbols: []
  whitelist_symbols: []
  require_liquidity_lock: true
  min_holders: 0
  max_holders: 10000

dry_run: true
state_db_path: "sniper_state.db"
log_level: "INFO"
log_file: "sniper_bot.log"
```

### 5.3 Environment Variables (`.env.example`)

```bash
# Robinhood Chain RPC
ROBINHOOD_RPC_URL=https://rpc.mainnet.chain.robinhood.com

# Your wallet private key (NEVER commit this)
PRIVATE_KEY=your_private_key_here

# Trading parameters (override config.yaml)
BUY_AMOUNT_ETH=0.05
TAKE_PROFIT_PCT=0.10
STOP_LOSS_PCT=0.05
DRY_RUN=true

# Optional: Alchemy API key for better RPC reliability
ALCHEMY_API_KEY=your_alchemy_key_here
```

---

## 6. Event Monitoring (The "Sniper" Core)

### 6.1 WebSocket Listener (`monitor/websocket_listener.py`)

This is the heart of the sniper — it listens for new token launches in real-time.

```python
import asyncio
import structlog
from web3 import Web3
from web3.middleware import geth_poa_middleware

logger = structlog.get_logger()

TOKEN_LAUNCHED_EVENT_ABI = {
    "anonymous": False,
    "inputs": [
        {"indexed": True, "name": "token", "type": "address"},
        {"indexed": True, "name": "deployer", "type": "address"},
        {"indexed": True, "name": "dexFactory", "type": "address"},
        {"indexed": False, "name": "pairToken", "type": "address"},
        {"indexed": False, "name": "pool", "type": "address"},
        {"indexed": False, "name": "dexId", "type": "uint256"},
        {"indexed": False, "name": "launchConfigId", "type": "uint256"},
        {"indexed": False, "name": "positionId", "type": "uint256"},
        {"indexed": False, "name": "restrictionsEndBlock", "type": "uint256"},
        {"indexed": False, "name": "initialBuyAmount", "type": "uint256"},
    ],
    "name": "TokenLaunched",
    "type": "event",
}

TOKEN_LAUNCHED_TOPIC = Web3.keccak(text="TokenLaunched(address,address,address,address,address,uint256,uint256,uint256,uint256,uint256)").hex()

class LaunchMonitor:
    def __init__(self, config: BotConfig, on_launch_callback):
        self.config = config
        self.on_launch = on_launch_callback
        self.ws_url = config.chain.ws_url
        self.factory_address = Web3.to_checksum_address(config.chain.factory_address)
        self.running = False
        self.last_block = 0

    async def start(self):
        """Start listening for new token launches"""
        self.running = True
        logger.info("launch_monitor_starting", ws_url=self.ws_url)

        while self.running:
            try:
                async with websockets.connect(self.ws_url) as ws:
                    # Subscribe to new blocks
                    subscribe_payload = {
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "eth_subscribe",
                        "params": ["newHeads"],
                    }
                    await ws.send(json.dumps(subscribe_payload))
                    subscription_id = (await ws.recv())["result"]

                    # Get current block to catch up on missed launches
                    current_block = await self._get_latest_block()
                    self.last_block = current_block - 10  # Start from 10 blocks ago

                    logger.info("launch_monitor_connected", block=current_block)

                    async for message in ws:
                        data = json.loads(message)
                        if "params" in data and "result" in data["params"]:
                            block_header = data["params"]["result"]
                            await self._process_new_block(block_header, ws)

            except websockets.exceptions.ConnectionClosed:
                logger.warning("ws_connection_lost", retry_in=5)
                await asyncio.sleep(5)
            except Exception as e:
                logger.error("ws_error", error=str(e))
                await asyncio.sleep(10)

    async def _process_new_block(self, block_header, ws):
        """Process a new block for TokenLaunched events"""
        block_number = int(block_header["number"], 16)

        # Only process blocks we haven't seen
        if block_number <= self.last_block:
            return
        self.last_block = block_number

        # Fetch logs for TokenLaunched event in this block
        logs = await self._get_logs_for_block(block_number)

        for log in logs:
            try:
                launch_data = self._parse_launch_event(log)
                if launch_data:
                    logger.info("new_token_launch",
                        token=launch_data["token"],
                        deployer=launch_data["deployer"],
                        pool=launch_data["pool"],
                        block=block_number,
                    )
                    await self.on_launch(launch_data)
            except Exception as e:
                logger.error("failed_to_parse_launch", error=str(e))

    async def _get_logs_for_block(self, block_number: int) -> list:
        """Fetch TokenLaunched events for a specific block"""
        # Use HTTP RPC for log queries (WebSocket doesn't support eth_getLogs)
        http_provider = Web3.HTTPProvider(self.config.chain.rpc_url)
        w3 = Web3(http_provider)
        w3.middleware_onion.inject(geth_poa_middleware, layer=0)

        logs = w3.eth.get_logs({
            "fromBlock": hex(block_number),
            "toBlock": hex(block_number),
            "address": self.factory_address,
            "topics": [TOKEN_LAUNCHED_TOPIC],
        })
        return logs

    async def _get_latest_block(self) -> int:
        """Get the latest block number"""
        http_provider = Web3.HTTPProvider(self.config.chain.rpc_url)
        w3 = Web3(http_provider)
        return w3.eth.block_number

    def _parse_launch_event(self, log) -> dict | None:
        """Parse a TokenLaunched event log into structured data"""
        try:
            decoded = self.config.chain.w3.eth.contract(
                address=self.factory_address,
                abi=[TOKEN_LAUNCHED_EVENT_ABI],
            ).events.TokenLaunched().process_receipt({"logs": [log.as_dict()]})

            args = decoded["args"]
            return {
                "token": args["token"],
                "deployer": args["deployer"],
                "pool": args["pool"],
                "pair_token": args["pairToken"],
                "dex_factory": args["dexFactory"],
                "restrictions_end_block": args["restrictionsEndBlock"],
                "initial_buy_amount": args["initialBuyAmount"],
                "block_number": log["blockNumber"],
                "transaction_hash": log["transactionHash"].hex(),
            }
        except Exception as e:
            logger.error("event_parse_failed", error=str(e))
            return None

    def stop(self):
        self.running = False
```

### 6.2 Token Info Fetcher (`monitor/token_info.py`)

When a new token launches, we need to read its metadata from the token contract itself (Pons tokens are self-describing on-chain).

```python
import asyncio
from web3 import Web3

TOKEN_ABI = [
    {"inputs": [], "name": "name", "outputs": [{"type": "string"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "symbol", "outputs": [{"type": "string"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "decimals", "outputs": [{"type": "uint8"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "totalSupply", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "logo", "outputs": [{"type": "string"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "liquidityPool", "outputs": [{"type": "address"}], "stateMutability": "view", "type": "function"},
]

async def fetch_token_info(w3: Web3, token_address: str) -> dict:
    """Read token metadata from the on-chain contract"""
    checksum = Web3.to_checksum_address(token_address)
    contract = w3.eth.contract(address=checksum, abi=TOKEN_ABI)

    name, symbol, decimals, total_supply, logo, pool = await asyncio.gather(
        contract.functions.name().call(),
        contract.functions.symbol().call(),
        contract.functions.decimals().call(),
        contract.functions.totalSupply().call(),
        contract.functions.logo().call(),
        contract.functions.liquidityPool().call(),
    )

    return {
        "address": token_address,
        "name": name,
        "symbol": symbol,
        "decimals": decimals,
        "total_supply": total_supply,
        "logo": logo,
        "pool_address": pool,
    }
```

---

## 7. Strategy Engine

### 7.1 Sniper Strategy (`strategy/sniper.py`)

```python
import asyncio
import structlog
from dataclasses import dataclass, field
from typing import Optional

logger = structlog.get_logger()

@dataclass
class LaunchData:
    token: str
    deployer: str
    pool: str
    pair_token: str
    block_number: int
    transaction_hash: str
    name: str = ""
    symbol: str = ""
    liquidity_eth: float = 0.0

@dataclass
class TradeSignal:
    token_address: str
    symbol: str
    side: str  # "buy"
    amount_eth: float
    pool_address: str
    slippage_pct: float
    priority_fee_gwei: float

class SniperStrategy:
    def __init__(self, config: BotConfig, state_store):
        self.config = config
        self.state = state_store

    async def evaluate_launch(self, launch: LaunchData) -> TradeSignal | None:
        """Evaluate a new token launch and decide whether to buy"""

        # Step 1: Apply filters
        if not self._passes_filters(launch):
            logger.info("launch_filtered", symbol=launch.symbol, reason="filter")
            return None

        # Step 2: Check position limits
        if self.state.get_open_positions_count() >= self.config.risk.max_positions:
            logger.info("max_positions_reached", count=self.state.get_open_positions_count())
            return None

        # Step 3: Check if already bought this token
        if self.state.has_position(launch.token):
            logger.info("already_have_position", token=launch.token)
            return None

        # Step 4: Check if token is in whitelist (if whitelist is non-empty)
        if self.config.filters.whitelist_symbols and launch.symbol not in self.config.filters.whitelist_symbols:
            logger.info("not_in_whitelist", symbol=launch.symbol)
            return None

        # Step 5: Check if token is in blacklist
        if launch.symbol in self.config.filters.blacklist_symbols:
            logger.info("blacklisted", symbol=launch.symbol)
            return None

        # Step 6: Calculate buy amount
        amount_eth = self._calculate_buy_amount()

        # Step 7: Create trade signal
        signal = TradeSignal(
            token_address=launch.token,
            symbol=launch.symbol,
            side="buy",
            amount_eth=amount_eth,
            pool_address=launch.pool,
            slippage_pct=self.config.sniper.slippage_pct,
            priority_fee_gwei=self.config.sniper.priority_fee_gwei,
        )

        logger.info("sniper_signal_generated",
            symbol=launch.symbol,
            token=launch.token,
            amount_eth=amount_eth,
            pool=launch.pool,
        )

        return signal

    def _passes_filters(self, launch: LaunchData) -> bool:
        """Check if launch passes all filter criteria"""
        # Minimum liquidity check
        if launch.liquidity_eth < self.config.risk.min_liquidity_eth:
            return False

        # Market cap range check (if we can determine it)
        # This would require reading the pool price and calculating market cap

        return True

    def _calculate_buy_amount(self) -> float:
        """Calculate how much ETH to spend on this launch"""
        if self.config.sniper.buy_amount_pct_of_portfolio > 0:
            portfolio_value = self.state.get_portfolio_value_eth()
            return portfolio_value * self.config.sniper.buy_amount_pct_of_portfolio
        return self.config.sniper.buy_amount_eth
```

### 7.2 Exit Manager (`strategy/exit_manager.py`)

```python
import asyncio
import structlog
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

logger = structlog.get_logger()

@dataclass
class Position:
    token_address: str
    symbol: str
    amount_tokens: float
    entry_price_eth: float
    entry_time: datetime
    amount_eth_spent: float
    take_profit_pct: float
    stop_loss_pct: float
    sell_after_minutes: float
    last_price_eth: float = 0.0

@dataclass
class ExitSignal:
    token_address: str
    symbol: str
    side: str  # "sell"
    reason: str  # "take_profit", "stop_loss", "time_exit", "circuit_breaker"
    amount_tokens: float

class ExitManager:
    def __init__(self, config: BotConfig, state_store):
        self.config = config
        self.state = state_store

    async def check_exits(self, positions: list[Position]) -> list[ExitSignal]:
        """Check all open positions for exit conditions"""
        signals = []
        now = datetime.now(timezone.utc)

        for pos in positions:
            # Get current price
            current_price = await self._get_current_price(pos)
            pos.last_price_eth = current_price

            # Calculate P&L
            pnl_pct = (current_price - pos.entry_price_eth) / pos.entry_price_eth

            # Check take-profit
            if pos.take_profit_pct > 0 and pnl_pct >= pos.take_profit_pct:
                signals.append(ExitSignal(
                    token_address=pos.token_address,
                    symbol=pos.symbol,
                    side="sell",
                    reason="take_profit",
                    amount_tokens=pos.amount_tokens,
                ))
                logger.info("take_profit_triggered", symbol=pos.symbol, pnl_pct=pnl_pct)
                continue

            # Check stop-loss
            if pos.stop_loss_pct > 0 and pnl_pct <= -pos.stop_loss_pct:
                signals.append(ExitSignal(
                    token_address=pos.token_address,
                    symbol=pos.symbol,
                    side="sell",
                    reason="stop_loss",
                    amount_tokens=pos.amount_tokens,
                ))
                logger.info("stop_loss_triggered", symbol=pos.symbol, pnl_pct=pnl_pct)
                continue

            # Check time-based exit
            if pos.sell_after_minutes > 0:
                elapsed = (now - pos.entry_time).total_seconds() / 60
                if elapsed >= pos.sell_after_minutes:
                    signals.append(ExitSignal(
                        token_address=pos.token_address,
                        symbol=pos.symbol,
                        side="sell",
                        reason="time_exit",
                        amount_tokens=pos.amount_tokens,
                    ))
                    logger.info("time_exit_triggered", symbol=pos.symbol, elapsed_minutes=elapsed)
                    continue

        return signals

    async def _get_current_price(self, position: Position) -> float:
        """Get current token price in ETH from the pool"""
        # This would call the Quoter V2 contract or read pool slot0
        # Simplified for this plan
        return 0.0  # Placeholder
```

---

## 8. Execution Layer

### 8.1 Wallet Manager (`execution/wallet.py`)

```python
import os
from eth_account import Account
from web3 import Web3
import structlog

logger = structlog.get_logger()

class WalletManager:
    def __init__(self, private_key: str, config: BotConfig):
        self.account = Account.from_key(private_key)
        self.address = self.account.address
        self.w3 = Web3(Web3.HTTPProvider(config.chain.rpc_url))

    def get_nonce(self) -> int:
        return self.w3.eth.get_transaction_count(self.address)

    def get_balance_eth(self) -> float:
        balance_wei = self.w3.eth.get_balance(self.address)
        return self.w3.from_wei(balance_wei, 'ether')

    def sign_transaction(self, tx_dict: dict) -> dict:
        """Sign a transaction with the wallet's private key"""
        signed = self.account.sign_transaction(tx_dict)
        return signed.raw_transaction.hex()

    async def send_raw_transaction(self, signed_tx: str) -> str:
        """Send a signed transaction to the network"""
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx)
        return tx_hash.hex()
```

### 8.2 Swap Executor (`execution/swap_executor.py`)

```python
import asyncio
import structlog
from web3 import Web3
from eth_account import Account

logger = structlog.get_logger()

UNISWAP_V3_SWAP_ROUTER_ABI = [...]  # Full ABI from SwapRouter02

class SwapExecutor:
    def __init__(self, wallet: WalletManager, config: BotConfig):
        self.wallet = wallet
        self.config = config
        self.router = self.w3.eth.contract(
            address=Web3.to_checksum_address(config.chain.router_address),
            abi=UNISWAP_V3_SWAP_ROUTER_ABI,
        )

    async def buy_token(
        self,
        token_address: str,
        amount_eth: float,
        slippage_pct: float,
        pool_address: str,
    ) -> dict:
        """Execute a buy swap via Uniswap V3"""

        # Step 1: Get current price quote
        quote = await self._get_amount_out(token_address, amount_eth, pool_address)

        # Step 2: Apply slippage
        min_amount_out = int(quote["amount_out"] * (1 - slippage_pct))

        # Step 3: Build swap parameters
        deadline = int(self.w3.eth.get_block("latest")["timestamp"]) + 600  # 10 min

        params = {
            "tokenIn": self.config.chain.weth_address,
            "tokenOut": Web3.to_checksum_address(token_address),
            "fee": 3000,  # 0.3% fee tier (standard for new pools)
            "recipient": self.wallet.address,
            "deadline": deadline,
            "amountIn": self.w3.to_wei(amount_eth, 'ether'),
            "amountOutMinimum": min_amount_out,
            "sqrtPriceLimitX96": 0,
        }

        # Step 4: Build transaction
        tx = self.router.functions.exactInputSingle(params).build_transaction({
            "from": self.wallet.address,
            "nonce": self.wallet.get_nonce(),
            "maxFeePerGas": self.w3.to_wei(self.config.risk.max_gas_gwei, 'gwei'),
            "maxPriorityFeePerGas": self.w3.to_wei(2, 'gwei'),
            "value": 0,  # ETH is already in the router
        })

        # Step 5: Sign and send
        signed_tx = self.wallet.sign_transaction(tx)
        tx_hash = await self.wallet.send_raw_transaction(signed_tx)

        logger.info("swap_executed",
            token=token_address,
            amount_eth=amount_eth,
            min_amount_out=min_amount_out,
            tx_hash=tx_hash,
        )

        return {
            "tx_hash": tx_hash,
            "amount_in_eth": amount_eth,
            "min_amount_out": min_amount_out,
        }

    async def _get_amount_out(self, token_out: str, amount_in_eth: float, pool_address: str) -> dict:
        """Get the expected output amount from Quoter V2"""
        quoter = self.w3.eth.contract(
            address=Web3.to_checksum_address(self.config.chain.quoter_address),
            abi=QUOTER_V2_ABI,
        )

        amount_in_wei = self.w3.to_wei(amount_in_eth, 'ether')

        # Call quoteExactInputSingle
        amount_out = quoter.functions.quoteExactInputSingle(
            self.config.chain.weth_address,
            Web3.to_checksum_address(token_out),
            3000,  # fee tier
            amount_in_wei,
            0,  # sqrtPriceLimitX96
        ).call()

        return {"amount_out": amount_out}
```

---

## 9. Risk Manager

### 9.1 Risk Checks (`risk/manager.py`)

```python
import structlog
from datetime import datetime, timezone

logger = structlog.get_logger()

class RiskManager:
    def __init__(self, config: BotConfig, state_store):
        self.config = config
        self.state = state_store
        self.consecutive_failures = 0
        self.daily_loss = 0.0
        self.daily_trades = 0
        self.daily_trades_date = datetime.now(timezone.utc).date()

    def check_trade(self, signal) -> tuple[bool, str]:
        """Check if a trade signal passes all risk checks"""
        checks = [
            self._check_daily_loss_limit(),
            self._check_daily_trade_limit(),
            self._check_position_limit(signal),
            self._check_min_liquidity(signal),
            self._check_gas_price(),
            self._check_circuit_breaker(),
        ]

        for passed, reason in checks:
            if not passed:
                logger.warning("trade_blocked", reason=reason, signal=signal)
                return False, reason

        return True, "all_checks_passed"

    def _check_daily_loss_limit(self) -> tuple[bool, str]:
        if self.config.risk.circuit_breaker_daily_loss and self.daily_loss >= self.config.risk.max_daily_loss_usd:
            return False, f"daily_loss_exceeded: {self.daily_loss:.2f} >= {self.config.risk.max_daily_loss_usd}"
        return True, ""

    def _check_daily_trade_limit(self) -> tuple[bool, str]:
        if self.daily_trades >= self.config.risk.max_daily_trades:
            return False, f"daily_trade_limit: {self.daily_trades} >= {self.config.risk.max_daily_trades}"
        return True, ""

    def _check_position_limit(self, signal) -> tuple[bool, str]:
        if self.state.get_open_positions_count() >= self.config.risk.max_positions:
            return False, f"max_positions: {self.state.get_open_positions_count()}"
        return True, ""

    def _check_min_liquidity(self, signal) -> tuple[bool, str]:
        if signal.amount_eth < self.config.risk.min_liquidity_eth:
            return False, f"insufficient_liquidity: {signal.amount_eth} ETH"
        return True, ""

    def _check_gas_price(self) -> tuple[bool, str]:
        current_gas = self._get_current_gas()
        if current_gas > self.config.risk.max_gas_gwei:
            return False, f"gas_too_high: {current_gas} gwei > {self.config.risk.max_gas_gwei}"
        return True, ""

    def _check_circuit_breaker(self) -> tuple[bool, str]:
        if self.consecutive_failures >= self.config.risk.circuit_breaker_consecutive_fails:
            return False, f"circuit_breaker: {self.consecutive_failures} consecutive failures"
        return True, ""

    def record_success(self):
        self.consecutive_failures = 0
        self.daily_trades += 1

    def record_failure(self):
        self.consecutive_failures += 1

    def record_loss(self, amount_usd: float):
        self.daily_loss += amount_usd

    def reset_daily_counters(self):
        today = datetime.now(timezone.utc).date()
        if today > self.daily_trades_date:
            self.daily_trades = 0
            self.daily_loss = 0.0
            self.daily_trades_date = today
```

### 9.2 Circuit Breaker (`risk/circuit_breaker.py`)

```python
import structlog
from datetime import datetime, timezone

logger = structlog.get_logger()

class CircuitBreaker:
    def __init__(self, config: BotConfig):
        self.config = config
        self.is_triggered = False
        self.trigger_reason = ""
        self.trigger_time = None

    def check(self, state) -> bool:
        """Check if circuit breaker should be triggered"""
        if self.is_triggered:
            return False  # Already triggered

        # Check daily loss
        if state.daily_loss >= self.config.risk.max_daily_loss_usd:
            self._trigger("daily_loss_limit_exceeded")
            return False

        # Check consecutive failures
        if state.consecutive_failures >= self.config.risk.circuit_breaker_consecutive_fails:
            self._trigger("too_many_consecutive_failures")
            return False

        return True

    def _trigger(self, reason: str):
        self.is_triggered = True
        self.trigger_reason = reason
        self.trigger_time = datetime.now(timezone.utc)
        logger.critical("circuit_breaker_triggered", reason=reason)

    def reset(self):
        self.is_triggered = False
        self.trigger_reason = ""
        self.trigger_time = None
        logger.info("circuit_breaker_reset")
```

---

## 10. State Management

### 10.1 SQLite State Store (`state/store.py`)

```python
import sqlite3
import json
import structlog
from datetime import datetime, timezone
from pathlib import Path

logger = structlog.get_logger()

class StateStore:
    def __init__(self, db_path: str = "sniper_state.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS positions (
                token_address TEXT PRIMARY KEY,
                symbol TEXT,
                amount_tokens REAL,
                entry_price_eth REAL,
                entry_time TEXT,
                amount_eth_spent REAL,
                take_profit_pct REAL,
                stop_loss_pct REAL,
                sell_after_minutes REAL,
                last_price_eth REAL DEFAULT 0.0,
                status TEXT DEFAULT 'open'
            );
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token_address TEXT,
                symbol TEXT,
                side TEXT,
                amount_eth REAL,
                amount_tokens REAL,
                price_eth REAL,
                reason TEXT,
                tx_hash TEXT,
                pnl_eth REAL,
                executed_at TEXT
            );
            CREATE TABLE IF NOT EXISTS launches (
                token_address TEXT PRIMARY KEY,
                symbol TEXT,
                name TEXT,
                deployer TEXT,
                pool_address TEXT,
                block_number INTEGER,
                tx_hash TEXT,
                launched_at TEXT,
                bought INTEGER DEFAULT 0,
                bought_at TEXT
            );
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            );
        """)
        conn.commit()
        conn.close()

    def add_position(self, position: dict):
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            INSERT OR REPLACE INTO positions
            (token_address, symbol, amount_tokens, entry_price_eth, entry_time,
             amount_eth_spent, take_profit_pct, stop_loss_pct, sell_after_minutes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            position["token_address"],
            position["symbol"],
            position["amount_tokens"],
            position["entry_price_eth"],
            position["entry_time"].isoformat(),
            position["amount_eth_spent"],
            position["take_profit_pct"],
            position["stop_loss_pct"],
            position["sell_after_minutes"],
        ))
        conn.commit()
        conn.close()

    def get_open_positions(self) -> list[dict]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM positions WHERE status = 'open'").fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def get_open_positions_count(self) -> int:
        conn = sqlite3.connect(self.db_path)
        count = conn.execute("SELECT COUNT(*) FROM positions WHERE status = 'open'").fetchone()[0]
        conn.close()
        return count

    def has_position(self, token_address: str) -> bool:
        conn = sqlite3.connect(self.db_path)
        row = conn.execute(
            "SELECT 1 FROM positions WHERE token_address = ? AND status = 'open'",
            (token_address,)
        ).fetchone()
        conn.close()
        return row is not None

    def close_position(self, token_address: str, pnl_eth: float, reason: str, tx_hash: str):
        conn = sqlite3.connect(self.db_path)
        conn.execute("UPDATE positions SET status = 'closed' WHERE token_address = ?", (token_address,))
        conn.execute("""
            INSERT INTO trades (token_address, symbol, side, amount_eth, amount_tokens,
                price_eth, reason, tx_hash, pnl_eth, executed_at)
            SELECT token_address, symbol, 'sell', amount_eth_spent, amount_tokens,
                last_price_eth, ?, ?, ?, ?
            FROM positions WHERE token_address = ?
        """, (reason, tx_hash, pnl_eth, datetime.now(timezone.utc).isoformat(), token_address))
        conn.commit()
        conn.close()

    def record_launch(self, launch: dict):
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            INSERT OR IGNORE INTO launches
            (token_address, symbol, name, deployer, pool_address, block_number, tx_hash, launched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            launch["token"],
            launch.get("symbol", ""),
            launch.get("name", ""),
            launch["deployer"],
            launch["pool"],
            launch["block_number"],
            launch["transaction_hash"],
            datetime.now(timezone.utc).isoformat(),
        ))
        conn.commit()
        conn.close()

    def mark_launch_bought(self, token_address: str):
        conn = sqlite3.connect(self.db_path)
        conn.execute(
            "UPDATE launches SET bought = 1, bought_at = ? WHERE token_address = ?",
            (datetime.now(timezone.utc).isoformat(), token_address)
        )
        conn.commit()
        conn.close()
```

---

## 11. CLI / TUI Interface

### 11.1 Main CLI (`main.py`)

```python
import typer
from rich.console import Console
from rich.table import Table
from rich.live import Live
from rich.layout import Layout
from rich.panel import Panel

app = typer.Typer()
console = Console()

@app.command()
def start(
    config: str = typer.Option("config.yaml", "--config", "-c", help="Path to config file"),
    dry_run: bool = typer.Option(None, "--dry-run", "-d", help="Run in dry-run mode"),
    show_ui: bool = typer.Option(True, "--ui/--no-ui", help="Show terminal UI"),
):
    """Start the Robinhood Chain Token Sniper Bot"""
    from sniper_bot.config import load_config
    from sniper_bot.monitor.websocket_listener import LaunchMonitor
    from sniper_bot.strategy.sniper import SniperStrategy
    from sniper_bot.strategy.exit_manager import ExitManager
    from sniper_bot.execution.swap_executor import SwapExecutor
    from sniper_bot.execution.wallet import WalletManager
    from sniper_bot.risk.manager import RiskManager
    from sniper_bot.state.store import StateStore

    # Load configuration
    bot_config = load_config(config)
    if dry_run is not None:
        bot_config.dry_run = dry_run

    # Initialize components
    state = StateStore(bot_config.state_db_path)
    wallet = WalletManager(os.environ["PRIVATE_KEY"], bot_config)
    risk = RiskManager(bot_config, state)
    sniper = SniperStrategy(bot_config, state)
    exit_mgr = ExitManager(bot_config, state)
    executor = SwapExecutor(wallet, bot_config)

    # Display startup banner
    console.print(Panel.fit(
        "[bold green]Robinhood Chain Sniper Bot[/bold green]\n"
        f"Wallet: [cyan]{wallet.address}[/cyan]\n"
        f"Chain: Robinhood Chain (ID {bot_config.chain.chain_id})\n"
        f"Mode: {'[yellow]DRY RUN[/yellow]' if bot_config.dry_run else '[red]LIVE[/red]'}\n"
        f"Buy Amount: {bot_config.sniper.buy_amount_eth} ETH per launch\n"
        f"Take Profit: {bot_config.exit.take_profit_pct*100:.1f}% | "
        f"Stop Loss: {bot_config.exit.stop_loss_pct*100:.1f}%",
        title="Sniper Bot",
    ))

    # Start monitoring
    monitor = LaunchMonitor(bot_config, on_launch_callback=lambda launch: handle_launch(launch, sniper, risk, executor, state, bot_config))

    if show_ui:
        run_ui(monitor, state, bot_config)
    else:
        asyncio.run(monitor.start())

def handle_launch(launch, sniper, risk, executor, state, config):
    """Handle a new token launch"""
    # Record the launch
    state.record_launch(launch)

    # Generate trade signal
    signal = asyncio.run(sniper.evaluate_launch(launch))
    if signal is None:
        return

    # Check risk
    passed, reason = risk.check_trade(signal)
    if not passed:
        console.print(f"[red]Trade blocked: {reason}[/red]")
        return

    # Execute trade
    if config.dry_run:
        console.print(f"[yellow]DRY RUN: Would buy {signal.amount_eth} ETH of {signal.symbol}[/yellow]")
    else:
        result = asyncio.run(executor.buy_token(
            token_address=signal.token_address,
            amount_eth=signal.amount_eth,
            slippage_pct=signal.slippage_pct,
            pool_address=signal.pool_address,
        ))
        state.mark_launch_bought(signal.token_address)
        risk.record_success()
        console.print(f"[green]BOUGHT: {signal.symbol} — {signal.amount_eth} ETH[/green]")

def run_ui(monitor, state, config):
    """Run the terminal UI"""
    from rich.live import Live
    import asyncio

    async def ui_loop():
        layout = Layout()
        layout.split_column(
            Layout(name="header", size=3),
            Layout(name="body"),
            Layout(name="footer", size=3),
        )

        with Live(layout, refresh_per_second=1, screen=True):
            while True:
                # Update display
                positions = state.get_open_positions()
                # ... render tables and status
                await asyncio.sleep(1)

    asyncio.run(ui_loop())

if __name__ == "__main__":
    app()
```

---

## 12. Single-File Executable Build

### 12.1 PyInstaller Spec File (`build.spec`)

```python
# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['sniper_bot/main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('config.yaml', '.'),
        ('.env.example', '.'),
    ],
    hiddenimports=[
        'sniper_bot',
        'sniper_bot.config',
        'sniper_bot.constants',
        'sniper_bot.monitor',
        'sniper_bot.monitor.websocket_listener',
        'sniper_bot.monitor.event_parser',
        'sniper_bot.monitor.token_info',
        'sniper_bot.strategy',
        'sniper_bot.strategy.sniper',
        'sniper_bot.strategy.exit_manager',
        'sniper_bot.execution',
        'sniper_bot.execution.wallet',
        'sniper_bot.execution.swap_executor',
        'sniper_bot.execution.quote_fetcher',
        'sniper_bot.execution.gas_estimator',
        'sniper_bot.risk',
        'sniper_bot.risk.manager',
        'sniper_bot.risk.circuit_breaker',
        'sniper_bot.risk.limits',
        'sniper_bot.state',
        'sniper_bot.state.store',
        'sniper_bot.state.models',
        'sniper_bot.utils',
        'sniper_bot.utils.cli',
        'sniper_bot.utils.formatters',
        'sniper_bot.utils.helpers',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter',
        'PyQt5',
        'PyQt6',
        'PySide2',
        'PySide6',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='sniper_bot',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
```

### 12.2 Build Script (`build.bat`)

```batch
@echo off
echo Building Sniper Bot...
echo.

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Installing PyInstaller...
pip install pyinstaller

echo.
echo Building single executable...
pyinstaller build.spec --clean

echo.
echo Build complete!
echo Output: dist/sniper_bot.exe
echo.
pause
```

### 12.3 Build Script (Linux/macOS)

```bash
#!/bin/bash
# build.sh
set -e

echo "Building Sniper Bot..."

echo "Installing dependencies..."
pip install -r requirements.txt
pip install pyinstaller

echo "Building single executable..."
pyinstaller build.spec --clean

echo ""
echo "Build complete!"
echo "Output: dist/sniper_bot"
```

---

## 13. Launch Detection Flow (Detailed)

Here's exactly what happens when a new token launches:

```
1. WebSocket receives new block header
2. Bot queries factory contract for TokenLaunched events in that block
3. Event decoded → token address, deployer, pool address extracted
4. Bot reads token contract for name, symbol, supply, logo
5. Bot reads pool contract for current liquidity (WETH balance)
6. Bot checks filters:
   - Is liquidity >= min_liquidity_eth? (default: 0.3 ETH)
   - Is symbol not in blacklist?
   - Is symbol in whitelist (if whitelist is non-empty)?
   - Is market cap in range?
   - Is holder count acceptable?
7. If all filters pass → generate buy signal
8. Risk manager checks:
   - Daily loss limit not exceeded?
   - Daily trade count not exceeded?
   - Max positions not reached?
   - Gas price acceptable?
   - Circuit breaker not triggered?
9. If risk checks pass → execute swap
10. SwapExecutor:
    a. Get price quote from Quoter V2
    b. Calculate minimum output with slippage
    c. Build Uniswap V3 exactInputSingle transaction
    d. Sign with wallet private key
    e. Send raw transaction to network
11. On confirmation:
    a. Record position in state store
    b. Mark launch as "bought" in database
    c. Start exit timer (if sell_after_minutes > 0)
    d. Log trade to console and file
12. Exit Manager monitors:
    a. Take-profit: sell when price >= entry * (1 + TP%)
    b. Stop-loss: sell when price <= entry * (1 - SL%)
    c. Time exit: sell after X minutes from entry
    d. Circuit breaker: sell all positions if CB triggered
```

---

## 14. Safety Features

### 14.1 Kill Switch
- Create a file named `KILL` in the bot's working directory
- Bot checks for this file every 5 seconds
- When detected: cancel all pending orders, close all positions, stop monitoring
- Remove the `KILL` file to restart

### 14.2 Dry-Run Mode
- Default mode — no real transactions are sent
- All swaps are simulated and logged
- Shows what WOULD happen without spending real ETH
- Switch to live mode by setting `DRY_RUN=false` or `--dry-run=false`

### 14.3 Pre-Flight Checks
Before every live trade, the bot verifies:
1. Private key is valid (can derive address)
2. Wallet has sufficient ETH for gas + buy amount
3. RPC is responsive and on the correct chain (Chain ID 4663)
4. Factory contract address matches expected address
5. Token contract exists and is not a honeypot (can receive ETH)
6. Pool has sufficient liquidity for the buy amount
7. Gas price is within acceptable range

### 14.4 Simulation Before Execution
Before sending a real transaction, the bot can simulate the swap using `eth_call`:
```python
# Simulate the swap to check if it would succeed
try:
    self.router.functions.exactInputSingle(params).call({
        "from": self.wallet.address,
        "value": 0,
    })
    # If call succeeds, the swap would work
except Exception as e:
    logger.error("simulation_failed", error=str(e))
    # Don't send the real transaction
    return None
```

---

## 15. Deployment

### 15.1 Single Executable
The entire bot is packaged as a single `.exe` file (Windows) or single binary (Linux/macOS) using PyInstaller. No Python installation needed on the target machine.

### 15.2 Running the Bot
```bash
# First time setup
cp .env.example .env
# Edit .env with your private key and settings
# Edit config.yaml with your strategy parameters

# Dry run (safe, no real trades)
./sniper_bot.exe

# Live mode (real trades)
./sniper_bot.exe --dry-run=false

# Custom config
./sniper_bot.exe --config my_config.yaml

# No UI (headless)
./sniper_bot.exe --no-ui
```

### 15.3 Running as a Service (Linux)
```ini
# /etc/systemd/system/sniper-bot.service
[Unit]
Description=Robinhood Chain Sniper Bot
After=network.target

[Service]
Type=simple
User=sniper
WorkingDirectory=/opt/sniper-bot
ExecStart=/opt/sniper-bot/sniper_bot
EnvironmentFile=/opt/sniper-bot/.env
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 16. Monitoring & Logging

### 16.1 Console Output (Rich TUI)
The bot displays a real-time terminal dashboard showing:
- Current wallet balance (ETH)
- Open positions with P&L
- Recent trades
- Launch detection events
- Risk status
- Circuit breaker status

### 16.2 Log File
All events are logged to `sniper_bot.log` in JSON format:
```json
{"timestamp": "2026-07-31T03:30:00Z", "level": "INFO", "event": "new_token_launch", "symbol": "TEST", "token": "0xabc...", "block": 12345678}
{"timestamp": "2026-07-31T03:30:02Z", "level": "INFO", "event": "trade_executed", "symbol": "TEST", "side": "buy", "amount_eth": 0.05, "tx_hash": "0x123..."}
{"timestamp": "2026-07-31T04:30:02Z", "level": "INFO", "event": "exit_triggered", "symbol": "TEST", "reason": "take_profit", "pnl_pct": 12.5}
```

---

## 17. Key Differences from the Previous (Wrong) Plan

| Aspect | Previous Plan (Wrong) | This Plan (Correct) |
|--------|----------------------|---------------------|
| Platform | Robinhood brokerage app | Robinhood Chain (L2 blockchain) |
| API | Unofficial Robinhood REST API | On-chain WebSocket + HTTP RPC |
| Authentication | Username/password login | Private key signing |
| Order execution | Robinhood REST API orders | Uniswap V3 smart contract swaps |
| New listings | SEC filings + Robinhood instruments | `TokenLaunched` on-chain events |
| Data source | Yahoo Finance, Robinhood API | Direct blockchain RPC |
| Wallet | Brokerage account balance | Ethereum wallet (ETH balance) |
| Risk | Brokerage-specific limits | Gas limits, slippage, liquidity checks |
| Deployment | Docker + PostgreSQL | Single .exe + SQLite |

---

## 18. Open Questions

1. **Which launchpads to monitor?** Pons is the primary one, but there may be others on Robinhood Chain. Should we also monitor other factories?
2. **Gas fee strategy** — should we use priority fee bumping during high gas periods?
3. **Multi-chain support** — should the bot support other chains in the future?
4. **Telegram/Discord alerts** — do you want notifications sent to a chat service?
5. **Portfolio tracking** — should the bot track your total portfolio value across all tokens?
6. **Backtesting** — do you want to test strategies against historical launch data?
7. **Token safety checks** — should we add honeypot detection and holder concentration analysis?

---

## 19. Implementation Priority

### MVP (Core Sniper — Week 1)
1. Config system (Pydantic + YAML)
2. WebSocket listener for `TokenLaunched` events
3. Token info fetcher (read name, symbol, pool from chain)
4. Basic sniper strategy (buy on launch)
5. Swap executor (Uniswap V3 exactInputSingle)
6. SQLite state store
7. CLI interface (rich TUI)
8. Dry-run mode
9. Risk manager (basic checks)
10. PyInstaller build script

### Should Have (Week 2)
1. Exit manager (TP/SL/timed sells)
2. Circuit breaker
3. Filter system (blacklist, whitelist, liquidity checks)
4. Gas estimator
5. Simulation before execution (eth_call)
6. Kill switch (KILL file)
7. Logging system
8. Alert system (console + file)

### Could Have (Week 3+)
1. Telegram/Discord alerts
2. Portfolio value tracking
3. Backtesting engine
4. Multi-launchpad support
5. Honeypot detection
6. Holder concentration analysis
7. Web dashboard
8. Multi-wallet support
