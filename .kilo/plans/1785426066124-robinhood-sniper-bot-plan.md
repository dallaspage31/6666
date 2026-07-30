# Robinhood Sniper Bot - Comprehensive Implementation Plan

## Overview

A Python-based automated trading bot ("sniper") that executes high-speed, precision trades on Robinhood using the user's account credentials. The bot supports multiple sniper strategies with aggressive risk controls.

> **Critical Disclaimer**: This bot uses Robinhood's unofficial API. Robinhood does not provide an official public API for automated trading. Using unofficial APIs may violate Robinhood's Terms of Service. Use at your own risk.

---

## 1. Goals & Scope

### Goals
1. **Multi-strategy sniper execution**: Support IPO/listing sniping, price-level sniping, and momentum scalping
2. **Ultra-low latency order placement**: Sub-second execution from trigger to order submission
3. **Robust risk management**: Per-trade, daily, and portfolio-level caps with circuit breakers
4. **Production-grade safety**: Authentication security, kill switches, dry-run mode, audit logging
5. **Observability**: Real-time monitoring, alerting, and performance analytics

### Out of Scope
- Market-making or arbitrage across exchanges
- Options or complex derivatives trading
- Machine learning model training (pre-trained signals only)
- Long-term portfolio rebalancing

---

## 2. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Language | Python 3.11+ | Async support, rich ecosystem for finance |
| Async Runtime | asyncio + uvloop | Sub-millisecond event loop |
| HTTP Client | httpx (async) | HTTP/2 support, connection pooling |
| Market Data | websockets (async) + yfinance | Real-time streams + fallback |
| Robinhood API | robin-stocks + raw API calls | Community-maintained + direct control |
| Database | PostgreSQL 15 | Transaction logs, trade history, positions |
| Config | Pydantic Settings + YAML | Type-safe, validated configuration |
| Logging | structlog + JSON output | Structured, searchable logs |
| Monitoring | Prometheus + Grafana | Real-time metrics |
| Alerting | Pushover/Slack webhooks | Critical alerts |
| Containerization | Docker + docker-compose | Reproducible deployment |
| CI/CD | GitHub Actions | Automated testing and deployment |

### Dependencies (requirements.txt)
```txt
python>=3.11
robin-stocks>=2.1.0
httpx[http2]>=0.27.0
uvloop>=0.19.0
pydantic>=2.6.0
pydantic-settings>=2.2.0
asyncpg>=0.29.0
websockets>=12.0
yfinance>=0.2.37
structlog>=24.0.0
prometheus-client>=0.20.0
slack-sdk>=3.21.0
pushover-complete>=0.3.0
redis>=5.0.0
python-dateutil>=2.9.0
numpy>=1.26.0
pandas>=2.2.0
```

---

## 3. Authentication & Security

### 3.1 Robinhood Authentication
- **Primary**: Username + password + optional 2FA (TOTP or SMS)
- **Session Persistence**: Cache encrypted session token (AES-256-GCM) to avoid repeated logins
- **Token Rotation**: Auto-refresh on 401 responses
- **Rate Limiting**: Built-in exponential backoff (1s → 60s) on all API calls

### 3.2 Credential Storage
```
.env file (gitignored):
  ROBINHOOD_USERNAME=your_username
  ROBINHOOD_PASSWORD=your_password
  ROBINHOOD_2FA_SECRET=your_totp_secret  # Optional, for TOTP 2FA
  ENCRYPTION_KEY=base64_encoded_32_byte_key
```

### 3.3 Security Measures
- All credentials loaded from environment variables only
- Session tokens encrypted at rest using Fernet (AES-128-CBC + HMAC)
- No plaintext passwords stored anywhere
- IP allowlisting via firewall rules (if running on VPS)
- Optional: Hardware security key for brokerage login 2FA

---

## 4. Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Sniper Bot Core                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Config    │  │   Logger    │  │   Metrics   │     │
│  │  (Pydantic) │  │ (structlog) │  │(Prometheus) │     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Market Data │  │  Strategy   │  │ Order Exec  │     │
│  │  Streams    │  │   Engine    │  │   Engine    │     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Risk Mgmt   │  │ Portfolio   │  │   Storage   │     │
│  │  (Circuit   │  │   Manager   │  │ (PostgreSQL)│     │
│  │  Breakers)  │  │             │  │             │     │
└─────────────────────────────────────────────────────────┘
         │               │                  │
         ▼               ▼                  ▼
  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
  │  Robinhood  │ │   Yahoo     │ │   Pushover  │
  │     API     │ │   Finance   │ │   Alerts    │
  └─────────────┘ └─────────────┘ └─────────────┘
```

### 4.2 Module Structure
```
sniper_bot/
├── __init__.py
├── bot.py              # Main entry point, orchestrator
├── config.py           # Pydantic settings, YAML config loading
├── auth/
│   ├── __init__.py
│   ├── robinhood_auth.py    # Authentication manager
│   └── credentials.py       # Credential encryption/decryption
├── market_data/
│   ├── __init__.py
│   ├── streamer.py          # WebSocket real-time price feeds
│   ├── yahoo_provider.py    # Yahoo Finance fallback data
│   └── models.py            # Price/tick data models
├── strategies/
│   ├── __init__.py
│   ├── base.py              # Abstract strategy interface
│   ├── ipo_sniper.py        # IPO/new listing sniping
│   ├── price_level_sniper.py # Price threshold sniping
│   └── momentum_scaler.py   # Volatility-based scalping
├── execution/
│   ├── __init__.py
│   ├── order_manager.py     # Order placement, tracking, cancellation
│   ├── order_types.py       # Market, limit, stop-limit order models
│   └── latency_tracker.py   # Execution latency monitoring
├── risk/
│   ├── __init__.py
│   ├── risk_manager.py      # Real-time risk checks
│   ├── circuit_breaker.py   # Kill switches and emergency stops
│   └── position_limits.py   # Per-asset and portfolio limits
├── portfolio/
│   ├── __init__.py
│   ├── portfolio_manager.py # Position tracking, P&L calculation
│   └── transaction_log.py   # Trade history and audit trail
├── storage/
│   ├── __init__.py
│   ├── database.py          # PostgreSQL connection pool
│   ├── models.py            # SQLAlchemy ORM models
│   └── cache.py             # Redis caching layer
├── monitoring/
│   ├── __init__.py
│   ├── metrics.py           # Prometheus metric definitions
│   ├── alerts.py            # Alert dispatch (Slack, Pushover)
│   └── health.py            # Health check endpoints
├── utils/
│   ├── __init__.py
│   ├── timing.py            # High-precision timing utilities
│   └── exceptions.py        # Custom exception classes
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── test_strategies.py
    ├── test_risk.py
    ├── test_execution.py
    └── test_integration.py
```

---

## 5. Strategy Implementations

### 5.1 IPO/Listing Sniper (`ipo_sniper.py`)

**Trigger Conditions:**
- New stock/crypto becomes available for trading on Robinhood
- Monitor `https://api.robinhood.com/limited_category/` and SEC EDGAR feeds
- Check for new symbols in Robinhood's instrument universe

**Execution Flow:**
1. Poll Robinhood's instruments endpoint every 5 seconds for new symbols
2. Cross-reference with SEC EDGAR RSS feeds for new filings
3. On detection of new listing:
   a. Fetch initial market data (if available)
   b. Validate symbol exists and is tradeable
   c. Check portfolio cash balance and position limits
   d. Place limit order at bid + $0.01 (for stocks) or market order (for crypto)
   e. Monitor order status with 1-second polling
   f. If filled, place immediate take-profit limit order at +5-10%
   g. Place stop-loss at -2-3%

**Configuration:**
```yaml
ipo_sniper:
  enabled: true
  max_allocation_per_ipo: 500.00  # USD
  position_timeout_minutes: 30    # Auto-sell after 30 min
  take_profit_pct: 0.08           # 8% profit target
  stop_loss_pct: 0.03             # 3% stop loss
  max_concurrent_positions: 3
  order_type: limit               # or market
  order_price_offset: 0.01        # $0.01 above bid for stocks
  check_interval_seconds: 5
```

### 5.2 Price Level Sniper (`price_level_sniper.py`)

**Trigger Conditions:**
- Asset price crosses a predefined threshold (support/resistance level)
- Configurable for multiple symbols with different thresholds

**Execution Flow:**
1. Subscribe to real-time price feeds via WebSocket (Yahoo Finance or Robinhood)
2. Monitor price against configured thresholds
3. On threshold breach:
   a. Validate market conditions (not during circuit breakers)
   b. Check risk limits and cash availability
   c. Place aggressive limit order at threshold price
   d. If not filled within 5 seconds, cancel and place market order
   e. Set take-profit and stop-loss immediately after fill

**Configuration:**
```yaml
price_level_sniper:
  enabled: true
  targets:
    - symbol: AAPL
      buy_below: 185.50
      sell_above: 190.00
      take_profit_pct: 0.02
      stop_loss_pct: 0.01
      max_position_usd: 1000.00
    - symbol: TSLA
      buy_below: 240.00
      sell_above: 250.00
      take_profit_pct: 0.03
      stop_loss_pct: 0.015
      max_position_usd: 1500.00
  check_interval_ms: 100     # Check every 100ms for price levels
  order_retry_attempts: 3    # Retry order placement 3 times
  order_retry_delay_ms: 50   # 50ms between retries
```

### 5.3 Momentum Scalper (`momentum_scaler.py`)

**Trigger Conditions:**
- Price moves >2% in <5 minutes with volume spike >200% of average
- Identifies pump-and-dump or news-driven momentum plays

**Execution Flow:**
1. Monitor 1-minute candles across watchlist
2. Calculate momentum: `(current_price - price_5min_ago) / price_5min_ago`
3. Calculate volume ratio: `current_volume / avg_volume_20periods`
4. On momentum + volume spike:
   a. Validate with 5-second confirmation candle
   b. Check if momentum is positive (buy) or negative (short - Robinhood doesn't support shorting, so skip)
   c. Place market order for long position
   d. Hold for 2-5 minutes, then close position
   e. Take profit at +1-2%, stop loss at -0.5-1%

**Configuration:**
```yaml
momentum_scaler:
  enabled: true
  watchlist:
    - BTCUSD
    - ETHUSD
    - AAPL
    - TSLA
    - NVDA
    - GME
    - AMC
  momentum_threshold: 0.02     # 2% price move
  volume_multiplier: 2.0         # 2x average volume
  confirmation_candles: 3        # Confirm with 3 candles
  hold_time_minutes: 3           # Hold for 3 minutes
  take_profit_pct: 0.015         # 1.5% profit
  stop_loss_pct: 0.008           # 0.8% stop loss
  max_position_usd: 500.00       # Max per trade
  max_daily_loss_usd: 200.00     # Daily loss cap
```

---

## 6. Core Module Specifications

### 6.1 Bot Orchestrator (`bot.py`)

```python
class SniperBot:
    def __init__(self, config: BotConfig):
        self.config = config
        self.auth_manager = RobinhoodAuthManager(config)
        self.market_data = MarketDataStream(config)
        self.strategy_engine = StrategyEngine(config)
        self.order_manager = OrderManager(config, self.auth_manager)
        self.risk_manager = RiskManager(config)
        self.portfolio = PortfolioManager(config)
        self.storage = Database(config)
        self.metrics = MetricsCollector()
        self.alerts = AlertManager(config)

    async def start(self):
        """Main bot lifecycle"""
        # 1. Authenticate with Robinhood
        await self.auth_manager.login()
        
        # 2. Initialize market data streams
        await self.market_data.start_streams()
        
        # 3. Load active strategies
        strategies = self.strategy_engine.load_strategies()
        
        # 4. Start main event loop
        await self._run_event_loop(strategies)

    async def _run_event_loop(self, strategies):
        """Main async event loop"""
        while True:
            try:
                # Fetch latest market data
                ticks = await self.market_data.get_latest_ticks()
                
                # Run each strategy
                for strategy in strategies:
                    signals = await strategy.evaluate(ticks)
                    for signal in signals:
                        # Risk check before execution
                        if await self.risk_manager.check_signal(signal):
                            await self.order_manager.execute_signal(signal)
                
                # Update portfolio and metrics
                await self.portfolio.update()
                self.metrics.record_portfolio(self.portfolio)
                
                await asyncio.sleep(self.config.loop_interval_ms / 1000)
                
            except Exception as e:
                self.metrics.record_error("event_loop", str(e))
                await self.alerts.send_critical(f"Bot error: {e}")
                await asyncio.sleep(5)  # Brief pause before retry
```

### 6.2 Order Manager (`order_manager.py`)

```python
class OrderManager:
    def __init__(self, config, auth_manager):
        self.config = config
        self.auth = auth_manager
        self.client = robin_stocks.Robinhood()
        self.pending_orders = {}
        self.order_latency_threshold_ms = 500  # Max 500ms for order placement

    async def execute_signal(self, signal: TradingSignal) -> OrderResult:
        """Execute a trading signal with latency tracking"""
        start_time = time.perf_counter_ns()
        
        # Pre-order checks
        await self._validate_signal(signal)
        
        # Place order
        order_id = await self._place_order(signal)
        
        # Monitor order status
        result = await self._monitor_order(order_id, signal)
        
        latency_ms = (time.perf_counter_ns() - start_time) / 1_000_000
        self.metrics.record_order_latency(latency_ms)
        
        # Log execution
        await self._log_execution(signal, result, latency_ms)
        
        return result

    async def _place_order(self, signal: TradingSignal) -> str:
        """Place order with retry logic"""
        for attempt in range(self.config.order_retry_attempts):
            try:
                if signal.order_type == "market":
                    order = self.client.orders.order_market(
                        symbol=signal.symbol,
                        quantity=signal.quantity,
                        side=signal.side,
                        time_in_force="day"
                    )
                elif signal.order_type == "limit":
                    order = self.client.orders.order_limit(
                        symbol=signal.symbol,
                        quantity=signal.quantity,
                        price=signal.limit_price,
                        side=signal.side,
                        time_in_force="gtc"
                    )
                return order["id"]
            except Exception as e:
                if attempt == self.config.order_retry_attempts - 1:
                    raise
                await asyncio.sleep(self.config.order_retry_delay_ms / 1000)
```

### 6.3 Risk Manager (`risk_manager.py`)

```python
class RiskManager:
    def __init__(self, config: BotConfig):
        self.config = config
        self.daily_loss = 0.0
        self.daily_trades = 0
        self.position_tracker = {}
        self.circuit_breaker = CircuitBreaker(config)

    async def check_signal(self, signal: TradingSignal) -> bool:
        """Comprehensive pre-trade risk validation"""
        checks = [
            self._check_circuit_breaker(),
            self._check_daily_loss_limit(),
            self._check_daily_trade_limit(),
            self._check_position_limits(signal),
            self._check_symbol_risk(signal),
            self._check_market_hours(signal),
            self._check_market_volatility(signal),
        ]
        return all(checks)

    def _check_circuit_breaker(self) -> bool:
        """Emergency stop - circuit breaker active"""
        if self.circuit_breaker.is_triggered:
            self.metrics.record_risk_block("circuit_breaker")
            return False
        return True

    def _check_daily_loss_limit(self) -> bool:
        """Stop trading if daily loss exceeds limit"""
        if self.daily_loss >= self.config.risk.max_daily_loss_usd:
            self.metrics.record_risk_block("daily_loss_limit")
            return False
        return True

    def _check_position_limits(self, signal: TradingSignal) -> bool:
        """Check position size against limits"""
        max_position = self.config.risk.get_max_position(signal.symbol)
        current_position = self.position_tracker.get(signal.symbol, 0)
        
        if signal.side == "buy":
            new_position = current_position + signal.quantity
            if new_position > max_position:
                self.metrics.record_risk_block("position_limit_exceeded")
                return False
        return True
```

### 6.4 Circuit Breaker (`circuit_breaker.py`)

```python
class CircuitBreaker:
    """Emergency stop mechanism with multiple trigger conditions"""
    
    def __init__(self, config: BotConfig):
        self.config = config
        self.is_triggered = False
        self.trigger_reasons = []
        
    async def monitor(self):
        """Continuously monitor for circuit breaker conditions"""
        while True:
            checks = [
                self._check_api_health(),
                self._check_market_halts(),
                self._check_extreme_volatility(),
                self._check_manual_kill_switch(),
            ]
            
            for check_name, triggered, reason in checks:
                if triggered:
                    await self._trigger(reason)
            
            await asyncio.sleep(5)

    def _check_api_health(self) -> tuple:
        """Check Robinhood API responsiveness"""
        try:
            # Ping API endpoint
            response = requests.get(
                "https://api.robinhood.com/",
                timeout=5
            )
            if response.status_code != 200:
                return ("api_health", True, f"API returned {response.status_code}")
        except Exception as e:
            return ("api_health", True, f"API unreachable: {e}")
        return ("api_health", False, "")

    async def _trigger(self, reason: str):
        """Trigger emergency stop"""
        self.is_triggered = True
        self.trigger_reasons.append({
            "timestamp": datetime.now(timezone.utc),
            "reason": reason
        })
        
        # Cancel all open orders
        await self._cancel_all_orders()
        
        # Send alerts
        await self.alerts.send_critical(
            f"Circuit breaker triggered: {reason}\n"
            f"All trading halted. Manual intervention required."
        )
        
        # Log event
        logger.critical("circuit_breaker_triggered", reason=reason)
```

### 6.5 Portfolio Manager (`portfolio_manager.py`)

```python
class PortfolioManager:
    def __init__(self, config: BotConfig):
        self.config = config
        self.positions = {}
        self.cash_balance = 0.0
        self.daily_pnl = 0.0
        self.total_pnl = 0.0

    async def update(self):
        """Fetch current portfolio state from Robinhood"""
        # Get account info
        account = self.client.account.load_account_info()
        self.cash_balance = float(account["cash"])
        
        # Get positions
        positions = self.client.position.get_open_positions()
        for pos in positions:
            symbol = pos["symbol"]
            quantity = float(pos["quantity"])
            avg_price = float(pos["average_buy_price"])
            current_price = await self.market_data.get_price(symbol)
            
            self.positions[symbol] = Position(
                symbol=symbol,
                quantity=quantity,
                avg_entry_price=avg_price,
                current_price=current_price,
                market_value=quantity * current_price,
                pnl=(current_price - avg_price) * quantity
            )
        
        # Update P&L
        self.daily_pnl = sum(p.pnl for p in self.positions.values())
        self.total_pnl += self.daily_pnl
```

---

## 7. Configuration System

### 7.1 Main Configuration (`config.py`)

```python
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import yaml

class RobinhoodConfig(BaseSettings):
    username: str
    password: str
    totp_secret: Optional[str] = None
    encryption_key: str

class RiskConfig(BaseSettings):
    max_daily_loss_usd: float = 500.0
    max_daily_trades: int = 50
    max_position_pct: float = 0.10  # 10% of portfolio per position
    max_portfolio_risk_pct: float = 0.25  # 25% of portfolio at risk
    default_take_profit_pct: float = 0.05
    default_stop_loss_pct: float = 0.02

class StrategyConfig(BaseSettings):
    ipo_sniper: dict = Field(default_factory=dict)
    price_level_sniper: dict = Field(default_factory=dict)
    momentum_scaler: dict = Field(default_factory=dict)

class BotConfig(BaseSettings):
    robinhood: RobinhoodConfig
    risk: RiskConfig = Field(default_factory=RiskConfig)
    strategies: StrategyConfig = Field(default_factory=StrategyConfig)
    
    # Runtime settings
    dry_run: bool = False
    loop_interval_ms: int = 100
    order_retry_attempts: int = 3
    order_retry_delay_ms: int = 50
    log_level: str = "INFO"
    
    # Monitoring
    prometheus_port: int = 9090
    health_check_port: int = 8080
    
    model_config = {
        "env_nested_delimiter": "__",
        "extra": "ignore"
    }

def load_config(yaml_path: str = "config.yaml") -> BotConfig:
    """Load configuration from YAML file with env var overrides"""
    with open(yaml_path) as f:
        yaml_config = yaml.safe_load(f)
    
    return BotConfig(**yaml_config)
```

### 7.2 YAML Configuration File (`config.yaml`)

```yaml
# ============================================
# Robinhood Sniper Bot Configuration
# ============================================

robinhood:
  username: ${ROBINHOOD_USERNAME}
  password: ${ROBINHOOD_PASSWORD}
  totp_secret: ${ROBINHOOD_2FA_SECRET}
  encryption_key: ${ENCRYPTION_KEY}

risk:
  max_daily_loss_usd: 500.00
  max_daily_trades: 50
  max_position_pct: 0.10
  max_portfolio_risk_pct: 0.25
  default_take_profit_pct: 0.05
  default_stop_loss_pct: 0.02

strategies:
  ipo_sniper:
    enabled: true
    max_allocation_per_ipo: 500.00
    position_timeout_minutes: 30
    take_profit_pct: 0.08
    stop_loss_pct: 0.03
    max_concurrent_positions: 3
    order_type: limit
    order_price_offset: 0.01
    check_interval_seconds: 5

  price_level_sniper:
    enabled: true
    targets:
      - symbol: AAPL
        buy_below: 185.50
        sell_above: 190.00
        take_profit_pct: 0.02
        stop_loss_pct: 0.01
        max_position_usd: 1000.00
      - symbol: TSLA
        buy_below: 240.00
        sell_above: 250.00
        take_profit_pct: 0.03
        stop_loss_pct: 0.015
        max_position_usd: 1500.00
    check_interval_ms: 100
    order_retry_attempts: 3
    order_retry_delay_ms: 50

  momentum_scaler:
    enabled: false
    watchlist:
      - BTCUSD
      - ETHUSD
      - AAPL
      - TSLA
      - NVDA
      - GME
      - AMC
    momentum_threshold: 0.02
    volume_multiplier: 2.0
    confirmation_candles: 3
    hold_time_minutes: 3
    take_profit_pct: 0.015
    stop_loss_pct: 0.008
    max_position_usd: 500.00
    max_daily_loss_usd: 200.00

# Runtime settings
dry_run: true
loop_interval_ms: 100
order_retry_attempts: 3
order_retry_delay_ms: 50
log_level: INFO

# Monitoring
prometheus_port: 9090
health_check_port: 8080
```

---

## 8. Database Schema

### 8.1 Tables

```sql
-- Trade execution log
CREATE TABLE trade_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_name VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    side VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
    order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('market', 'limit', 'stop')),
    quantity NUMERIC(15,6) NOT NULL,
    price NUMERIC(15,4) NOT NULL,
    order_id VARCHAR(100),
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    latency_ms NUMERIC(10,2),
    status VARCHAR(20) NOT NULL CHECK (status IN ('filled', 'partial', 'cancelled', 'failed')),
    pnl NUMERIC(15,4),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Position tracking
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) NOT NULL,
    quantity NUMERIC(15,6) NOT NULL,
    avg_entry_price NUMERIC(15,4) NOT NULL,
    current_price NUMERIC(15,4),
    market_value NUMERIC(15,4),
    pnl NUMERIC(15,4),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(symbol)
);

-- Risk events
CREATE TABLE risk_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    symbol VARCHAR(10),
    reason TEXT,
    details JSONB,
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Order audit trail
CREATE TABLE order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('placed', 'cancelled', 'modified', 'filled', 'rejected')),
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Daily summary
CREATE TABLE daily_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    total_trades INTEGER,
    total_pnl NUMERIC(15,4),
    max_drawdown NUMERIC(15,4),
    total_fees NUMERIC(15,4),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Alerts log
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    message TEXT NOT NULL,
    details JSONB,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT FALSE
);
```

### 8.2 Indexes
```sql
CREATE INDEX idx_trade_executions_symbol ON trade_executions(symbol);
CREATE INDEX idx_trade_executions_date ON trade_executions(DATE(executed_at));
CREATE INDEX idx_risk_events_date ON risk_events(DATE(triggered_at));
CREATE INDEX idx_order_audit_order_id ON order_audit(order_id);
```

---

## 9. Monitoring & Alerting

### 9.1 Prometheus Metrics
```python
# metrics.py
from prometheus_client import Counter, Gauge, Histogram, Summary

class MetricsCollector:
    # Counters
    trades_total = Counter("sniper_trades_total", "Total trades executed", ["strategy", "symbol", "side"])
    orders_placed = Counter("sniper_orders_placed_total", "Orders placed", ["symbol", "order_type"])
    orders_failed = Counter("sniper_orders_failed_total", "Failed orders", ["symbol", "reason"])
    risk_blocks = Counter("sniper_risk_blocks_total", "Risk-blocked trades", ["reason"])
    errors_total = Counter("sniper_errors_total", "Total errors", ["component"])
    
    # Gauges
    portfolio_value = Gauge("sniper_portfolio_value_usd", "Current portfolio value")
    cash_balance = Gauge("sniper_cash_balance_usd", "Available cash")
    daily_pnl = Gauge("sniper_daily_pnl_usd", "Daily P&L")
    active_positions = Gauge("sniper_active_positions", "Number of open positions")
    circuit_breaker_status = Gauge("sniper_circuit_breaker_status", "Circuit breaker state (0=ok, 1=triggered)")
    
    # Histograms
    order_latency = Histogram("sniper_order_latency_ms", "Order placement latency (ms)", 
                              buckets=[10, 25, 50, 100, 200, 500, 1000, 2000])
    trade_pnl = Histogram("sniper_trade_pnl", "Per-trade P&L distribution",
                          buckets=[-50, -10, -1, 0, 1, 5, 10, 25, 50, 100])
    
    # Summaries
    daily_volume = Summary("sniper_daily_volume_usd", "Daily trading volume")
```

### 9.2 Alert Definitions
```python
# alerts.py
class AlertManager:
    ALERT_RULES = {
        "critical": [
            {"name": "circuit_breaker_triggered", "condition": "circuit_breaker_status == 1"},
            {"name": "daily_loss_exceeded", "condition": "daily_pnl < -max_daily_loss"},
            {"name": "api_unreachable", "condition": "errors_total{component='robinhood_api'} > 5"},
        ],
        "warning": [
            {"name": "high_latency", "condition": "order_latency_ms > 500"},
            {"name": "position_concentration", "condition": "position_value > max_position_usd * 0.9"},
            {"name": "low_cash", "condition": "cash_balance < min_cash_reserve"},
        ],
        "info": [
            {"name": "trade_executed", "condition": "trades_total"},
            {"name": "strategy_enabled", "condition": "strategy_status == 'enabled'"},
        ],
    }
    
    async def send_alert(self, alert_type: str, severity: str, message: str, details: dict = None):
        """Send alert via configured channels"""
        # Log to database
        await self.db.log_alert(alert_type, severity, message, details)
        
        # Send notifications
        if severity == "critical":
            await self._send_pushover(message, priority=1)
            await self._send_slack(message, channel="#alerts")
        elif severity == "warning":
            await self._send_pushover(message, priority=0)
```

---

## 10. Deployment & Operations

### 10.1 Docker Setup

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create non-root user
RUN useradd -m -u 1000 sniper
USER sniper

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["python", "-m", "sniper_bot.bot"]
```

```yaml
# docker-compose.yml
version: "3.8"

services:
  sniper-bot:
    build: .
    container_name: sniper-bot
    restart: unless-stopped
    env_file: .env
    volumes:
      - ./config.yaml:/app/config.yaml:ro
      - ./logs:/app/logs
    ports:
      - "9090:9090"  # Prometheus metrics
      - "8080:8080"  # Health check
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    container_name: sniper-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: sniper
      POSTGRES_USER: sniper
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    container_name: sniper-redis
    restart: unless-stopped
    ports:
      - "6379:6379"

  prometheus:
    image: prom/prometheus:latest
    container_name: sniper-prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
    ports:
      - "9091:9090"

  grafana:
    image: grafana/grafana:latest
    container_name: sniper-grafana
    depends_on:
      - prometheus
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}

volumes:
  postgres_data:
```

### 10.2 CI/CD Pipeline (`.github/workflows/ci.yml`)

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_USER: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      - name: Run linting
        run: ruff check .
      - name: Run type checking
        run: mypy sniper_bot/
      - name: Run tests
        run: pytest -v --cov=sniper_bot --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v4

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to server
        run: |
          ssh ${DEPLOY_USER}@${DEPLOY_HOST} "cd /opt/sniper-bot && git pull && docker-compose up -d --build"
```

### 10.3 Health Check Endpoint

```python
# health.py
from fastapi import FastAPI
import psutil

app = FastAPI()

@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    checks = {
        "robinhood_api": await check_robinhood_api(),
        "database": await check_database(),
        "redis": await check_redis(),
        "market_data": await check_market_data(),
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage("/").percent,
        }
    }
    
    all_healthy = all(
        check.get("healthy", False) if isinstance(check, dict) else check
        for check in checks.values()
    )
    
    return {
        "status": "healthy" if all_healthy else "unhealthy",
        "checks": checks,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
```

---

## 11. Testing Strategy

### 11.1 Test Categories

| Category | Framework | Description |
|----------|-----------|-------------|
| Unit Tests | pytest | Individual function/module testing |
| Integration Tests | pytest-asyncio | Multi-module interaction testing |
| Mock Tests | pytest-mock + respx | API mocking for Robinhood endpoints |
| Load Tests | locust | Latency and throughput under load |
| Safety Tests | pytest | Emergency stop, circuit breaker, dry-run validation |

### 11.2 Key Test Cases

```python
# conftest.py - Shared fixtures
@pytest.fixture
def mock_robinhood_client(mocker):
    """Mock Robinhood API client"""
    client = mocker.Mock()
    client.login.return_value = {"access_token": "test_token"}
    client.orders.order_market.return_value = {"id": "test_order_123"}
    return client

@pytest.fixture
def dry_run_config():
    """Configuration for dry-run mode"""
    return BotConfig(
        robinhood=RobinhoodConfig(...),
        dry_run=True,
        ...
    )

# test_strategies.py
def test_price_level_sniper_triggers_on_threshold():
    """Test that price level sniper triggers when threshold is breached"""
    strategy = PriceLevelSniper(config)
    
    # Simulate price crossing below buy threshold
    tick = Tick(symbol="AAPL", price=185.40, timestamp=datetime.now())
    
    signals = strategy.evaluate([tick])
    
    assert len(signals) == 1
    assert signals[0].symbol == "AAPL"
    assert signals[0].side == "buy"
    assert signals[0].quantity > 0

# test_risk.py
def test_risk_manager_blocks_over_daily_loss():
    """Test that risk manager blocks trades when daily loss exceeds limit"""
    risk_manager = RiskManager(config)
    risk_manager.daily_loss = config.risk.max_daily_loss_usd + 100
    
    signal = TradingSignal(symbol="AAPL", side="buy", quantity=10, ...)
    
    assert risk_manager.check_signal(signal) is False

# test_execution.py
async def test_order_manager_places_market_order(mock_robinhood_client):
    """Test market order placement"""
    order_manager = OrderManager(config, mock_robinhood_client)
    
    signal = TradingSignal(
        symbol="AAPL",
        side="buy",
        quantity=10,
        order_type="market"
    )
    
    result = await order_manager.execute_signal(signal)
    
    assert result.status == "filled"
    assert result.order_id == "test_order_123"
    mock_robinhood_client.orders.order_market.assert_called_once()
```

### 11.3 Test Execution Matrix

```bash
# Run all tests
pytest -v --cov=sniper_bot --cov-report=html

# Run only unit tests
pytest -m "not integration" -v

# Run only integration tests
pytest -m "integration" -v

# Run with coverage threshold
pytest --cov=sniper_bot --cov-fail-under=85

# Run safety/dry-run tests
pytest -k "safety" -v

# Run load tests
locust -f tests/load_test.py --headless -u 10 -r 1 --run-time 60s
```

---

## 12. Rollout Plan

### Phase 1: Development & Local Testing (Week 1-2)
- [x] Set up project structure and CI/CD
- [ ] Implement core modules (auth, market data, order manager)
- [ ] Implement at least one strategy (price level sniper)
- [ ] Write unit tests for all modules (>85% coverage)
- [ ] Run dry-run mode locally with mock data

### Phase 2: Sandbox Testing (Week 3)
- [ ] Deploy to Docker with test Robinhood account
- [ ] Run all strategies in dry-run mode for 72 hours
- [ ] Validate risk controls and circuit breakers
- [ ] Test alerting system
- [ ] Performance benchmarking (latency < 500ms)

### Phase 3: Limited Live Trading (Week 4)
- [ ] Switch to live mode with $100 test capital
- [ ] Enable only one strategy (price level sniper)
- [ ] Monitor 24/7 with manual oversight
- [ ] Validate execution accuracy and P&L tracking
- [ ] Tune strategy parameters based on real performance

### Phase 4: Full Deployment (Week 5+)
- [ ] Enable all strategies
- [ ] Increase capital allocation gradually
- [ ] Set up Grafana dashboards
- [ ] Implement automated reporting
- [ ] Document operational procedures

---

## 13. Operational Procedures

### 13.1 Daily Checklist
```markdown
## Morning Startup (Before Market Open)
1. Check bot status: `docker-compose ps`
2. Verify Robinhood login: `docker logs sniper-bot | grep "login"`
3. Check health endpoint: `curl http://localhost:8080/health`
4. Review previous day's P&L: Check Grafana dashboard
5. Verify alerts channel is active
6. Confirm dry_run is False for live trading

## Evening Shutdown (After Market Close)
1. Check final positions: `docker exec sniper-bot python -m sniper_bot.portfolio`
2. Review trade log: Check `trade_executions` table
3. Check risk events: Review `risk_events` table
4. Backup database: `pg_dump sniper > backup_$(date +%Y%m%d).sql`
5. Archive logs: Compress and store logs
```

### 13.2 Emergency Procedures
```markdown
## Circuit Breaker Triggered
1. Bot automatically cancels all orders
2. Check alert message for reason
3. Investigate root cause (API, network, market)
4. Once resolved, reset circuit breaker:
   `docker exec sniper-bot python -c "from sniper_bot.risk import CircuitBreaker; CircuitBreaker.reset()"`
5. Restart bot in dry-run mode to verify
6. Switch back to live mode

## Robinhood Login Failed
1. Check credentials in `.env`
2. Verify 2FA is working (check TOTP app)
3. If locked out, use backup credentials
4. Update session token manually if needed
5. Restart bot

## Large Unexpected Loss
1. Immediately trigger manual kill switch:
   `docker exec sniper-bot pkill -f sniper_bot`
2. Cancel all open orders via Robinhood web/app
3. Review trade logs for root cause
4. Adjust risk parameters
5. Restart in dry-run mode
```

### 13.3 Monitoring Dashboard (Grafana)
Dashboard panels:
1. **Portfolio Value (USD)** - Real-time portfolio value
2. **Daily P&L** - Profit/loss chart by day
3. **Order Latency (ms)** - Histogram of order placement latency
4. **Trades Per Hour** - Bar chart of trading activity
5. **Risk Blocks** - Counter of risk-blocked trades
6. **Active Positions** - Table of current positions
7. **Cash Balance** - Available cash gauge
8. **Error Rate** - Errors per minute
9. **Circuit Breaker Status** - Indicator light
10. **Strategy Performance** - P&L by strategy

---

## 14. Risk & Safety Features

### 14.1 Circuit Breakers
| Trigger | Action |
|---------|--------|
| Daily loss > $500 | Halt all trading for remainder of day |
| 5 consecutive order failures | Halt for 10 minutes |
| API unreachable > 30 seconds | Halt all trading |
| Manual kill switch file exists | Immediate halt |
| Market volatility > 5% in 1 min | Halt for 5 minutes |

### 14.2 Position Limits
| Constraint | Value |
|-----------|-------|
| Max position size (per symbol) | 10% of portfolio |
| Max concurrent positions | 10 |
| Max portfolio at risk | 25% |
| Min cash reserve | $200 |
| Max daily trades | 50 |

### 14.3 Order Safety
| Feature | Description |
|---------|-------------|
| Pre-trade validation | Symbol exists, market is open, sufficient cash |
| Post-trade confirmation | Verify order was filled correctly |
| Order timeout | Cancel unfilled orders after 10 seconds |
| Duplicate prevention | Don't place same order twice |
| Price sanity checks | Reject orders with prices > 2x market price |

### 14.4 Dry-Run Mode
- All orders are simulated (no actual execution)
- Portfolio value tracked with mock fills
- Alerts still sent for significant events
- Full performance metrics recorded
- Can be toggled via config without restart

---

## 15. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Order placement latency | < 200ms | 99th percentile |
| Strategy evaluation latency | < 50ms | Per tick |
| Market data update frequency | 100ms | WebSocket stream |
| Uptime | 99.5% | Monthly |
| Max drawdown | < 5% | Daily |
| Daily profit target | 0.5-2% | Portfolio value |
| Risk-reward ratio | > 1.5:1 | Per trade |

---

## 16. Environment Variables

```bash
# Robinhood credentials
ROBINHOOD_USERNAME=your_username
ROBINHOOD_PASSWORD=your_password
ROBINHOOD_2FA_SECRET=your_totp_secret  # Optional

# Encryption
ENCRYPTION_KEY=your_32_byte_base64_encoded_key

# Database
POSTGRES_PASSWORD=secure_password

# Monitoring
GRAFANA_PASSWORD=admin_password
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
PUSHOVER_USER_KEY=your_pushover_user_key
PUSHOVER_API_TOKEN=your_pushover_api_token

# Runtime
LOG_LEVEL=INFO
DRY_RUN=true
```

---

## 17. File Structure Summary

```
sniper_bot/
├── bot.py                    # Main entry point
├── config.py                 # Configuration management
├── requirements.txt          # Python dependencies
├── requirements-dev.txt      # Development dependencies
├── config.yaml               # Strategy configuration
├── Dockerfile                # Container image
├── docker-compose.yml        # Multi-container orchestration
├── prometheus.yml            # Prometheus configuration
├── .env.example              # Environment variable template
├── README.md                 # Project documentation
├── AGENTS.md                 # Agent instructions
├── .kilo/                    # Kilo configuration
│   ├── commands/
│   │   ├── start.md
│   │   ├── stop.md
│   │   ├── status.md
│   │   └── health.md
│   └── agent/
│       └── sniper-agent.md
├── auth/
│   ├── __init__.py
│   ├── robinhood_auth.py     # Authentication manager
│   └── credentials.py        # Credential encryption
├── market_data/
│   ├── __init__.py
│   ├── streamer.py           # WebSocket price feeds
│   ├── yahoo_provider.py     # Yahoo Finance fallback
│   └── models.py             # Data models
├── strategies/
│   ├── __init__.py
│   ├── base.py               # Strategy interface
│   ├── ipo_sniper.py         # IPO/new listing strategy
│   ├── price_level_sniper.py # Price threshold strategy
│   └── momentum_scaler.py    # Momentum strategy
├── execution/
│   ├── __init__.py
│   ├── order_manager.py      # Order placement & tracking
│   ├── order_types.py        # Order type definitions
│   └── latency_tracker.py    # Latency monitoring
├── risk/
│   ├── __init__.py
│   ├── risk_manager.py       # Risk validation
│   ├── circuit_breaker.py    # Emergency stops
│   └── position_limits.py    # Position management
├── portfolio/
│   ├── __init__.py
│   ├── portfolio_manager.py  # Position tracking
│   └── transaction_log.py    # Trade history
├── storage/
│   ├── __init__.py
│   ├── database.py           # PostgreSQL connection
│   ├── models.py             # ORM models
│   └── cache.py              # Redis caching
├── monitoring/
│   ├── __init__.py
│   ├── metrics.py            # Prometheus metrics
│   ├── alerts.py             # Alert dispatch
│   └── health.py             # Health checks
├── utils/
│   ├── __init__.py
│   ├── timing.py             # Timing utilities
│   └── exceptions.py         # Custom exceptions
└── tests/
    ├── __init__.py
    ├── conftest.py           # Test fixtures
    ├── test_strategies.py
    ├── test_risk.py
    ├── test_execution.py
    ├── test_integration.py
    └── test_safety.py
```

---

## 18. Kilo Commands

### Start Bot
```bash
# .kilo/commands/start.md
docker-compose up -d --build
docker logs -f sniper-bot
```

### Stop Bot
```bash
# .kilo/commands/stop.md
docker-compose down
```

### Check Status
```bash
# .kilo/commands/status.md
docker-compose ps
curl http://localhost:8080/health
```

### Health Report
```bash
# .kilo/commands/health.md
curl http://localhost:8080/health | python -m json.tool
docker stats --no-stream
```

---

## 19. Open Questions / Assumptions

### Assumptions Made
1. **Robinhood API**: Using unofficial `robin-stocks` library. No official API exists for automated trading.
2. **Market Hours**: Bot trades during US market hours (9:30 AM - 4:00 PM ET) unless crypto strategy enabled.
3. **Crypto Support**: Robinhood crypto trading has different API endpoints and settlement times.
4. **Position Limits**: Based on USD value, not share count.
5. **Tax Reporting**: User is responsible for tax reporting; bot logs all trades for audit purposes.

### Outstanding Decisions
1. **2FA Method**: TOTP vs SMS - TOTP is more reliable for automation
2. **Order Types**: Market vs limit - limit orders safer but may miss opportunities
3. **Data Source**: Robinhood API vs Yahoo Finance for market data - Robinhood is authoritative but rate-limited
4. **Position Sizing**: Fixed USD vs percentage of portfolio - percentage is more dynamic
5. **Exit Strategy**: Time-based vs technical exit - both should be supported

---

## 20. Implementation Priority

### Must Have (MVP - Week 1)
1. Authentication system with encrypted credentials
2. Basic order manager (market + limit orders)
3. Price level sniper strategy
4. Risk manager with daily loss limits
5. PostgreSQL trade logging
6. Dry-run mode
7. Basic Prometheus metrics
8. Unit tests for all components

### Should Have (Week 2-3)
1. IPO sniper strategy
2. Momentum scaler strategy
3. WebSocket market data streaming
4. Circuit breaker system
5. Slack/Pushover alerts
6. Health check endpoint
7. Integration tests
8. Grafana dashboard

### Could Have (Week 4+)
1. Redis caching layer
2. Load testing with Locust
3. Automated CI/CD deployment
4. Advanced analytics dashboard
5. Mobile alerts
6. Strategy backtesting engine
7. Multi-account support
8. Web UI for configuration

---

## 21. Key Files to Create First

1. `requirements.txt` - Python dependencies
2. `config.py` - Configuration management
3. `auth/robinhood_auth.py` - Authentication
4. `execution/order_manager.py` - Order placement
5. `risk/risk_manager.py` - Risk controls
6. `strategies/price_level_sniper.py` - First strategy
7. `bot.py` - Main orchestrator
8. `tests/conftest.py` - Test fixtures
9. `Dockerfile` - Containerization
10. `docker-compose.yml` - Orchestration

---

## 22. Validation Checklist

Before running live (not dry-run):
- [ ] All unit tests pass (>85% coverage)
- [ ] All integration tests pass
- [ ] Dry-run mode validated for 72+ hours
- [ ] Circuit breaker tested manually
- [ ] Risk limits configured correctly
- [ ] Alerting system tested (Slack/Pushover)
- [ ] Health check endpoint returns healthy
- [ ] Database connection verified
- [ ] Prometheus metrics visible
- [ ] Emergency stop procedure documented
- [ ] Backup/restore procedure tested
- [ ] Logging level set to INFO (not DEBUG)
- [ ] `DRY_RUN=true` in `.env`
- [ ] Paper trading with $0 capital

After switching to live:
- [ ] Start with $100 test capital
- [ ] Enable only one strategy
- [ ] Monitor continuously for first 24 hours
- [ ] Verify all trades logged correctly
- [ ] Confirm P&L calculations accurate
- [ ] Test emergency procedures
