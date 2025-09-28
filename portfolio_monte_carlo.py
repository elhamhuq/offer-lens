# Multi-Stock Portfolio Monte Carlo Simulator
# Requirements: pip install yfinance numpy pandas matplotlib plotly

import numpy as np
import pandas as pd
import yfinance as yf
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import sys
import time
import warnings
warnings.filterwarnings('ignore')

def get_user_portfolio():
    """Get portfolio composition from user input"""
    print("=" * 70)
    print("    Multi-Stock Portfolio Monte Carlo Simulator")
    print("=" * 70)
    
    portfolio = {}
    total_allocation = 0
    
    print("\nEnter your portfolio composition:")
    print("Format: TICKER ALLOCATION (e.g., AAPL 40 for 40%)")
    print("Enter 'done' when finished")
    print("-" * 50)
    
    while True:
        user_input = input("Enter stock ticker and allocation %: ").strip()
        
        if user_input.lower() == 'done':
            break
            
        if not user_input:
            continue
            
        try:
            parts = user_input.upper().split()
            if len(parts) != 2:
                print("❌ Please use format: TICKER PERCENTAGE (e.g., AAPL 40)")
                continue
                
            ticker = parts[0]
            allocation = float(parts[1])
            
            if allocation <= 0 or allocation > 100:
                print("❌ Allocation must be between 0 and 100")
                continue
                
            if total_allocation + allocation > 100:
                print(f"❌ Total allocation would exceed 100% (current: {total_allocation:.1f}%)")
                continue
                
            portfolio[ticker] = allocation
            total_allocation += allocation
            
            print(f"✅ Added {ticker}: {allocation}% (Total: {total_allocation:.1f}%)")
            
        except ValueError:
            print("❌ Invalid format. Please use: TICKER PERCENTAGE")
            continue
    
    if not portfolio:
        print("No stocks entered. Using default portfolio...")
        portfolio = {'AAPL': 40, 'MSFT': 30, 'GOOGL': 30}
        total_allocation = 100
    
    # Normalize to 100% if not exactly 100%
    if total_allocation != 100:
        print(f"\n⚠️  Total allocation is {total_allocation:.1f}%. Normalizing to 100%...")
        for ticker in portfolio:
            portfolio[ticker] = (portfolio[ticker] / total_allocation) * 100
    
    return portfolio

def download_portfolio_data(portfolio, start_date="2018-01-01"):
    """Download historical data for all portfolio stocks"""
    print(f"\n📊 Downloading historical data for {len(portfolio)} stocks...")
    
    tickers = list(portfolio.keys())
    
    # Try bulk download first
    try:
        data = yf.download(tickers, start=start_date, progress=False)
        
        if len(tickers) == 1:
            # Single ticker - convert to proper format
            if 'Adj Close' in data.columns:
                prices = data['Adj Close'].to_frame(name=tickers[0])
            else:
                prices = data['Close'].to_frame(name=tickers[0])
        else:
            # Multiple tickers
            if 'Adj Close' in data.columns.get_level_values(0):
                prices = data['Adj Close']
            else:
                prices = data['Close']
                
    except Exception as e:
        print(f"⚠️  Bulk download failed: {e}")
        print("📥 Fetching individual stock data...")
        
        # Fallback: individual downloads
        price_data = {}
        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                hist = stock.history(start=start_date)
                if hist.empty:
                    print(f"❌ No data for {ticker}")
                    continue
                price_data[ticker] = hist['Close'] if 'Close' in hist.columns else hist['Adj Close']
                print(f"✅ Downloaded {ticker}")
            except Exception as e:
                print(f"❌ Failed to download {ticker}: {e}")
        
        if not price_data:
            raise ValueError("No valid stock data downloaded")
            
        prices = pd.DataFrame(price_data)
    
    # Clean data
    prices = prices.dropna()
    
    if prices.empty:
        raise ValueError("No valid price data after cleaning")
    
    print(f"✅ Successfully downloaded data for {len(prices.columns)} stocks")
    print(f"📅 Date range: {prices.index[0].strftime('%Y-%m-%d')} to {prices.index[-1].strftime('%Y-%m-%d')}")
    print(f"📊 Total trading days: {len(prices):,}")
    
    return prices

def calculate_portfolio_statistics(prices, portfolio, initial_investment=100000):
    """Calculate portfolio statistics and run Monte Carlo simulation"""
    
    # Calculate weights from percentages
    weights = np.array([portfolio[ticker]/100 for ticker in prices.columns])
    
    # Calculate log returns
    returns = np.log(prices / prices.shift(1)).dropna()
    
    # Portfolio statistics
    mean_returns = returns.mean() * 252  # Annualized
    cov_matrix = returns.cov() * 252     # Annualized
    
    # Portfolio expected return and volatility
    portfolio_return = np.sum(weights * mean_returns)
    portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
    
    # Current portfolio value breakdown
    latest_prices = prices.iloc[-1]
    portfolio_weights_dollar = {}
    total_value = 0
    
    for i, ticker in enumerate(prices.columns):
        dollar_allocation = initial_investment * weights[i]
        shares = dollar_allocation / latest_prices[ticker]
        portfolio_weights_dollar[ticker] = {
            'allocation_pct': weights[i] * 100,
            'allocation_dollar': dollar_allocation,
            'shares': shares,
            'current_price': latest_prices[ticker]
        }
        total_value += dollar_allocation
    
    return {
        'returns': returns,
        'weights': weights,
        'mean_returns': mean_returns,
        'cov_matrix': cov_matrix,
        'portfolio_return': portfolio_return,
        'portfolio_volatility': portfolio_volatility,
        'latest_prices': latest_prices,
        'portfolio_breakdown': portfolio_weights_dollar
    }

def run_monte_carlo_portfolio(stats, prices, n_sims=5000, horizon_days=252):
    """Run optimized Monte Carlo simulation for portfolio"""
    
    print(f"\n🎲 Running {n_sims:,} Monte Carlo simulations...")
    
    returns = stats['returns']
    weights = stats['weights']
    latest_prices = stats['latest_prices']
    
    # Daily statistics
    daily_returns = returns.mean().values
    daily_cov = returns.cov().values
    
    # Cholesky decomposition for correlation
    try:
        chol = np.linalg.cholesky(daily_cov)
    except np.linalg.LinAlgError:
        # If matrix is not positive definite, add small diagonal term
        daily_cov += np.eye(len(daily_cov)) * 1e-6
        chol = np.linalg.cholesky(daily_cov)
    
    n_assets = len(prices.columns)
    dt = 1.0  # Daily time step
    
    # Pre-compute values
    initial_prices = latest_prices.values
    shares_held = (weights * 100000) / initial_prices
    initial_portfolio_value = 100000
    
    # Storage for results (more memory efficient)
    portfolio_paths = np.zeros((horizon_days + 1, n_sims))
    individual_final_prices = np.zeros((n_assets, n_sims))
    
    portfolio_paths[0, :] = initial_portfolio_value
    
    # Vectorized simulation - much faster!
    print("⚡ Using vectorized simulation for speed...")
    
    # Generate all random numbers at once
    random_matrix = np.random.normal(0, 1, (n_sims, horizon_days, n_assets))
    
    for sim in range(n_sims):
        if sim % 1000 == 0:
            print(f"  Progress: {sim/n_sims*100:.0f}%", end='\r')
        
        # Current prices for this simulation
        current_prices = initial_prices.copy()
        
        # Simulate all days for this path
        for day in range(horizon_days):
            # Get correlated shocks for this day
            random_shocks = random_matrix[sim, day, :]
            correlated_shocks = chol @ random_shocks
            
            # Vectorized GBM update for all assets
            drift = (daily_returns - 0.5 * np.diag(daily_cov)) * dt
            diffusion = np.sqrt(np.diag(daily_cov) * dt) * correlated_shocks
            current_prices *= np.exp(drift + diffusion)
        
        # Store final prices and portfolio value
        individual_final_prices[:, sim] = current_prices
        portfolio_value = np.sum(current_prices * shares_held)
        portfolio_paths[-1, sim] = portfolio_value
        
        # Interpolate intermediate values (for visualization)
        if sim < 100:  # Only store paths for first 100 sims to save memory
            temp_prices = initial_prices.copy()
            for day in range(1, horizon_days + 1):
                random_shocks = random_matrix[sim, day-1, :]
                correlated_shocks = chol @ random_shocks
                drift = (daily_returns - 0.5 * np.diag(daily_cov)) * dt
                diffusion = np.sqrt(np.diag(daily_cov) * dt) * correlated_shocks
                temp_prices *= np.exp(drift + diffusion)
                portfolio_paths[day, sim] = np.sum(temp_prices * shares_held)
    
    print(f"  Progress: 100% ✅")
    
    # Create individual paths structure (only final values to save memory)
    individual_paths = np.zeros((2, n_assets, n_sims))
    individual_paths[0, :, :] = initial_prices.reshape(-1, 1)
    individual_paths[1, :, :] = individual_final_prices
    
    return portfolio_paths, individual_paths

def analyze_results(portfolio_paths, stats, portfolio_composition):
    """Analyze Monte Carlo results"""
    
    initial_value = 100000
    final_values = portfolio_paths[-1, :]
    returns = (final_values / initial_value) - 1
    
    # Risk metrics
    mean_return = np.mean(returns)
    median_return = np.median(returns)
    std_return = np.std(returns)
    prob_loss = np.mean(returns < 0) * 100
    
    # VaR and CVaR
    var_5 = np.percentile(returns, 5)
    var_1 = np.percentile(returns, 1)
    cvar_5 = np.mean(returns[returns <= var_5])
    
    # Percentiles
    percentiles = [1, 5, 10, 25, 50, 75, 90, 95, 99]
    return_percentiles = np.percentile(returns, percentiles)
    
    return {
        'final_values': final_values,
        'returns': returns,
        'mean_return': mean_return,
        'median_return': median_return,
        'std_return': std_return,
        'prob_loss': prob_loss,
        'var_5': var_5,
        'var_1': var_1,
        'cvar_5': cvar_5,
        'percentiles': dict(zip(percentiles, return_percentiles))
    }

def create_visualizations(portfolio_paths, individual_paths, results, stats, portfolio_composition, tickers):
    """Create comprehensive visualizations"""
    
    print("\n📈 Generating visualizations...")
    
    days = np.arange(len(portfolio_paths))
    
    # 1. Portfolio Value Fan Chart
    plt.figure(figsize=(14, 8))
    
    # Plot sample paths
    plt.subplot(2, 2, 1)
    for i in range(min(100, portfolio_paths.shape[1])):
        plt.plot(days, portfolio_paths[:, i], alpha=0.1, color='blue')
    
    # Percentiles
    p10 = np.percentile(portfolio_paths, 10, axis=1)
    p25 = np.percentile(portfolio_paths, 25, axis=1)
    p50 = np.percentile(portfolio_paths, 50, axis=1)
    p75 = np.percentile(portfolio_paths, 75, axis=1)
    p90 = np.percentile(portfolio_paths, 90, axis=1)
    
    plt.fill_between(days, p10, p90, alpha=0.3, color='lightblue', label='10th-90th percentile')
    plt.fill_between(days, p25, p75, alpha=0.5, color='skyblue', label='25th-75th percentile')
    plt.plot(days, p50, color='darkblue', linewidth=2, label='Median')
    plt.axhline(y=100000, color='red', linestyle='--', alpha=0.7, label='Initial Investment')
    
    plt.title('Portfolio Value Simulation Paths', fontweight='bold')
    plt.xlabel('Trading Days')
    plt.ylabel('Portfolio Value ($)')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # 2. Return Distribution
    plt.subplot(2, 2, 2)
    plt.hist(results['returns'], bins=50, alpha=0.7, color='lightgreen', edgecolor='black')
    plt.axvline(results['mean_return'], color='blue', linestyle='-', linewidth=2, 
                label=f"Mean: {results['mean_return']:.1%}")
    plt.axvline(results['var_5'], color='red', linestyle='--', linewidth=2, 
                label=f"5% VaR: {results['var_5']:.1%}")
    plt.axvline(0, color='black', linestyle=':', alpha=0.7, label='Break-even')
    
    plt.title('Distribution of 1-Year Returns')
    plt.xlabel('Return (%)')
    plt.ylabel('Frequency')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.gca().xaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:.0%}'))
    
    # 3. Individual Stock Performance
    plt.subplot(2, 2, 3)
    colors = plt.cm.Set3(np.linspace(0, 1, len(tickers)))
    
    for i, (ticker, color) in enumerate(zip(tickers, colors)):
        stock_final_values = individual_paths[1, i, :]  # Final prices
        stock_returns = (stock_final_values / individual_paths[0, i, 0]) - 1
        plt.hist(stock_returns, bins=30, alpha=0.6, label=ticker, color=color)
    
    plt.title('Individual Stock Return Distributions')
    plt.xlabel('Return (%)')
    plt.ylabel('Frequency')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.gca().xaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:.0%}'))
    
    # 4. Risk-Return Scatter
    plt.subplot(2, 2, 4)
    stock_stats = []
    
    for i, ticker in enumerate(tickers):
        stock_final_values = individual_paths[1, i, :]  # Final prices
        stock_returns = (stock_final_values / individual_paths[0, i, 0]) - 1
        mean_ret = np.mean(stock_returns)
        std_ret = np.std(stock_returns)
        stock_stats.append((mean_ret, std_ret))
        plt.scatter(std_ret, mean_ret, s=100, alpha=0.7, label=ticker)
    
    # Portfolio point
    plt.scatter(results['std_return'], results['mean_return'], 
                s=200, color='red', marker='*', label='Portfolio', edgecolor='black')
    
    plt.title('Risk-Return Profile')
    plt.xlabel('Volatility (Standard Deviation)')
    plt.ylabel('Expected Return')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.gca().xaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:.0%}'))
    plt.gca().yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:.0%}'))
    
    plt.tight_layout()
    plt.show()

def print_detailed_results(results, stats, portfolio_composition, execution_time):
    """Print comprehensive results"""
    
    print(f"\n{'='*80}")
    print(f"                    PORTFOLIO MONTE CARLO RESULTS")
    print(f"{'='*80}")
    print(f"⏱️  Execution Time: {execution_time:.2f} seconds")
    print(f"📊 Simulations: {len(results['returns']):,}")
    print(f"📅 Time Horizon: 1 year (252 trading days)")
    print(f"💰 Initial Investment: $100,000")
    
    print(f"\n{'='*50}")
    print("📋 PORTFOLIO COMPOSITION")
    print(f"{'='*50}")
    
    for ticker, details in stats['portfolio_breakdown'].items():
        print(f"{ticker:>6}: {details['allocation_pct']:5.1f}% "
              f"(${details['allocation_dollar']:8,.0f}) "
              f"- {details['shares']:6.1f} shares @ ${details['current_price']:7.2f}")
    
    print(f"\n{'='*50}")
    print("📈 PORTFOLIO STATISTICS")
    print(f"{'='*50}")
    print(f"Expected Annual Return:     {stats['portfolio_return']:8.2%}")
    print(f"Expected Annual Volatility: {stats['portfolio_volatility']:8.2%}")
    print(f"Sharpe Ratio (0% risk-free): {stats['portfolio_return']/stats['portfolio_volatility']:7.2f}")
    
    print(f"\n{'='*50}")
    print("🎲 MONTE CARLO RESULTS")
    print(f"{'='*50}")
    print(f"Mean Return:               {results['mean_return']:8.2%}")
    print(f"Median Return:             {results['median_return']:8.2%}")
    print(f"Return Volatility:         {results['std_return']:8.2%}")
    print(f"Best Case (99th percentile): {results['percentiles'][99]:6.2%}")
    print(f"Worst Case (1st percentile): {results['percentiles'][1]:6.2%}")
    
    print(f"\n{'='*50}")
    print("⚠️  RISK METRICS")
    print(f"{'='*50}")
    print(f"Probability of Loss:       {results['prob_loss']:8.1f}%")
    print(f"5% Value at Risk (VaR):    {results['var_5']:8.2%}")
    print(f"1% Value at Risk (VaR):    {results['var_1']:8.2%}")
    print(f"5% Conditional VaR (CVaR): {results['cvar_5']:8.2%}")
    
    print(f"\n{'='*50}")
    print("💵 FINAL PORTFOLIO VALUES")
    print(f"{'='*50}")
    print(f"Expected Value:            ${np.mean(results['final_values']):10,.0f}")
    print(f"Median Value:              ${np.median(results['final_values']):10,.0f}")
    print(f"Best Case (95th %ile):     ${results['percentiles'][95]*100000+100000:10,.0f}")
    print(f"Worst Case (5th %ile):     ${results['percentiles'][5]*100000+100000:10,.0f}")
    print(f"Range:                     ${np.min(results['final_values']):10,.0f} - ${np.max(results['final_values']):10,.0f}")
    
    print(f"\n{'='*80}")

def main():
    """Main execution function"""
    start_time = time.time()
    
    try:
        # Get user input
        portfolio_composition = get_user_portfolio()
        
        print(f"\n📋 Final Portfolio Composition:")
        for ticker, allocation in portfolio_composition.items():
            print(f"  {ticker}: {allocation:.1f}%")
        
        # Download data
        prices = download_portfolio_data(portfolio_composition)
        
        # Calculate statistics
        stats = calculate_portfolio_statistics(prices, portfolio_composition)
        
        # Run Monte Carlo simulation
        portfolio_paths, individual_paths = run_monte_carlo_portfolio(stats, prices)
        
        # Analyze results
        results = analyze_results(portfolio_paths, stats, portfolio_composition)
        
        # Calculate execution time
        execution_time = time.time() - start_time
        
        # Print results
        print_detailed_results(results, stats, portfolio_composition, execution_time)
        
        # Create visualizations
        create_visualizations(portfolio_paths, individual_paths, results, stats, 
                            portfolio_composition, list(prices.columns))
        
        print(f"\n🎉 Analysis completed successfully!")
        print(f"⏱️  Total execution time: {execution_time:.2f} seconds")
        
    except KeyboardInterrupt:
        print("\n\n❌ Analysis interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()