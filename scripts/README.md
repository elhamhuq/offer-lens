# Monte Carlo Stock Price Simulator

A TypeScript/Node.js implementation of Monte Carlo simulation for stock price forecasting, built to integrate with the Offer Lens project's tech stack.

## Features

- **Real-time Data**: Fetches historical stock data from Yahoo Finance API
- **Monte Carlo Simulation**: Uses Geometric Brownian Motion for price modeling
- **Interactive Visualizations**: Generates HTML charts using ECharts
- **Risk Analysis**: Calculates VaR, probability of loss, and other risk metrics
- **Performance Optimized**: Handles 10,000+ simulations efficiently

## Quick Start

### Prerequisites

Make sure you have the required dependencies installed:

```bash
npm install
```

### Running the Simulation

#### Method 1: Using npm script (Recommended)

```bash
npm run monte-carlo
```

#### Method 2: Direct execution

```bash
npx tsx scripts/monte-carlo-sim.ts
```

#### Method 3: Using the wrapper script

```bash
node scripts/run-monte-carlo.js
```

### Usage Example

1. Run the command:

   ```bash
   npm run monte-carlo
   ```

2. Enter a stock ticker when prompted:

   ```
   Enter stock ticker symbol (e.g., AAPL, MSFT, TSLA): AAPL
   ```

3. The simulation will:
   - Fetch historical data for the ticker
   - Run 10,000 Monte Carlo simulations
   - Calculate risk metrics and statistics
   - Generate an interactive HTML visualization

4. Open the generated `monte-carlo-results.html` file in your browser to view the charts.

## Configuration

You can customize the simulation by modifying the `MonteCarloSimulator` constructor:

```typescript
const simulator = new MonteCarloSimulator({
  ticker: 'AAPL', // Stock ticker symbol
  startDate: '2018-01-01', // Historical data start date
  tradingDays: 252, // Trading days per year
  horizonYears: 1, // Simulation time horizon
  numSimulations: 10000, // Number of Monte Carlo paths
  initialInvestment: 100000, // Initial investment amount
  seed: 42, // Random seed for reproducibility
});
```

## Output

The simulator generates:

### Console Output

- Historical data analysis (annualized return, volatility)
- Simulation progress and timing
- Risk metrics (mean return, VaR, probability of loss)
- Final value statistics

### HTML Visualization

- **Stock Price Paths Chart**: Shows simulated price trajectories with confidence bands
- **Returns Distribution**: Histogram of simulation outcomes
- **Risk Metrics Dashboard**: Key statistics and probabilities

## Technical Details

### Monte Carlo Method

The simulation uses Geometric Brownian Motion (GBM) to model stock price movements:

```
S(t+1) = S(t) * exp((μ - 0.5*σ²)*dt + σ*√dt*Z)
```

Where:

- `μ` = Daily drift (estimated from historical returns)
- `σ` = Daily volatility (estimated from historical returns)
- `dt` = Time step (1 day)
- `Z` = Standard normal random variable

### Data Source

- **API**: Yahoo Finance (free, no authentication required)
- **Data Range**: Configurable start date to present
- **Frequency**: Daily closing prices
- **Processing**: Automatic handling of missing data and market holidays

### Performance

- **Simulations**: 10,000 paths (configurable)
- **Time Horizon**: 1 year (252 trading days)
- **Execution Time**: ~2-5 seconds on modern hardware
- **Memory Usage**: Optimized for large-scale simulations

## Integration with Offer Lens

This Monte Carlo simulator is designed to integrate with the Offer Lens financial analysis system:

1. **Data Consistency**: Uses the same data structures and types as the main application
2. **Tech Stack Alignment**: Built with TypeScript and Node.js to match the project
3. **Visualization**: Uses ECharts (already in the project) for consistent styling
4. **Extensibility**: Can be easily integrated into the web interface

## Future Enhancements

- **Web Interface**: Integration into the dashboard for interactive simulations
- **Portfolio Analysis**: Support for multiple assets and correlations
- **Advanced Models**: Jump diffusion, stochastic volatility models
- **API Integration**: REST API endpoints for programmatic access
- **Export Options**: CSV, PDF report generation

## Troubleshooting

### Common Issues

1. **Network Errors**: Ensure internet connection for data fetching
2. **Invalid Ticker**: Verify stock symbol exists and is actively traded
3. **Insufficient Data**: Some tickers may have limited historical data
4. **Memory Issues**: Reduce `numSimulations` for very large runs

### Error Messages

- `No data found for ticker`: Invalid or delisted stock symbol
- `Insufficient data`: Less than 30 trading days of historical data
- `Network error`: Unable to fetch data from Yahoo Finance

## License

Part of the Offer Lens project. See main project license for details.
