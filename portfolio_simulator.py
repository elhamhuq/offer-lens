# Monte Carlo Multi-Stock Portfolio Simulator
# Requirements: pip install yfinance numpy pandas matplotlib plotly seaborn

import numpy as np
import pandas as pd
import yfinance as yf
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import seaborn as sns
import sys
import time

def get_portfolio_input():
    """Get portfolio composition from user"""
    print("=" * 70)
    print("    Monte Carlo Multi-Stock Portfolio Simulator")
    print("=" * 70)
    
    # Get stocks and weights
    stocks = []
    weights = []
    
    print("\nEnter your portfolio composition:")
    print("(Enter stock ticker and weight as percentage, e.g., 'AAPL 30' for 30%)")
    print("Type 'done' when finished entering stocks")
    
    total_weight = 0
    
    while True:
        entry = input(f"Stock {len(stocks)+1} (ticker weight%): ").strip()
        
        if entry.lower() == 'done':
            if len(stocks) == 0:
                print("No stocks entered. Using default portfolio: AAPL 40%, MSFT 30%, GOOGL 30%")
                return ['AAPL', 'MSFT', 'GOOGL'], [0.4, 0.3, 0.3]
            break
            
        try:
            parts = entry.split()
            if len(parts) != 2:
                print("Please enter: TICKER WEIGHT% (e.g., 'AAPL 30')")
                continue
                
            ticker = parts[0].upper()
            weight = float(parts[1])
            
            if weight <= 0 or weight > 100:
                print("Weight must be between 0 and 100%")
                continue
                
            stocks.append(ticker)
            weights.append(weight / 100)  # Convert to decimal
            total_weight += weight
            
            print(f"Added: {ticker} ({weight}%) - Running total: {total_weight}%")
            
        except ValueError:
            print("Invalid format. Please enter: TICKER WEIGHT% (e.g., 'AAPL 30')")
            continue
    
    # Normalize weights to sum to 1
    if abs(total_weight - 100) > 0.01:  # Allow small rounding errors
        print(f"\nWarning: Weights sum to {total_weight}%. Normalizing to 100%...")
        weights = [w / (total_weight/100) for w in weights]
        
    return stocks, weights

def download_portfolio_data(tickers, start_date, end_date):
    """Download historical data for portfolio stocks"""
    print(f"\nDownloading data for {len(tickers)} stocks...")
    
    # Try bulk download first
    try:
        data = yf.download(tickers, start=start_date, end=end_date, progress=False)
        if data.empty:
            raise ValueError("Empty data")
            
        # Extract adjusted close prices
        if len(tickers) > 1:
            if 'Adj Close' in data.columns.get_level_values(0):
                prices = data['Adj Close']
            else:
                prices = data['Close']
        else:
            # Single stock
            if 'Adj Close' in data.columns:
                prices = data['Adj Close'].to_frame(name=tickers[0])
            else:
                prices = data['Close'].to_frame(name=tickers[0])
                
    except:
        print("Bulk download failed. Downloading individually...")
        price_data = {}
        
        for ticker in tickers:
            print(f"Fetching {ticker}...")
            stock = yf.Ticker(ticker)
            hist = stock.history(start=start_date, end=end_date)
            
            if hist.empty:
                raise ValueError(f"No data found for {ticker}")
                
            if 'Adj Close' in hist.columns:
                price_data[ticker] = hist['Adj Close']
            else:
                price_data[ticker] = hist['Close']
                
        prices = pd.DataFrame(price_data)
    
    # Clean data
    prices = prices.dropna()
    
    if prices.empty:
        raise ValueError("No valid price data after cleaning")
        
    return prices

def calculate_portfolio_metrics(prices, weights):
    """Calculate portfolio statistics"""
    # Calculate returns
    returns = np.log(prices / prices.shift(1)).dropna()
    
    # Portfolio statistics
    portfolio_returns = (returns * weights).sum(axis=1)
    
    metrics = {
        'individual_returns': returns.mean() * 252,
        'individual_volatilities': returns.std() * np.sqrt(252),
        'correlation_matrix': returns.corr(),
        'covariance_matrix': returns.cov(),
        'portfolio_return': portfolio_returns.mean() * 252,
        'portfolio_volatility': portfolio_returns.std() * np.sqrt(252),
        'returns_data': returns
    }
    
    return metrics

def run_portfolio_simulation(prices, weights, n_sims=10000, horizon_days=252, initial_value=100000):
    """Run Monte Carlo simulation for portfolio"""
    
    returns = np.log(prices / prices.shift(1)).dropna()
    
    # Parameters for simulation
    mu_daily = returns.mean().values
    cov_daily = returns.cov().values
    
    # Starting values
    last_prices = prices.iloc[-1].values
    n_assets = len(weights)
    
    # Cholesky decomposition for correlated random variables
    try:
        chol = np.linalg.cholesky(cov_daily)
    except np.linalg.LinAlgError:
        # If covariance matrix is not positive definite, use regularization
        cov_daily += np.eye(n_assets) * 1e-6
        chol = np.linalg.cholesky(cov_daily)
    
    # Calculate initial portfolio value and shares
    portfolio_price = np.dot(last_prices, weights)
    shares_per_stock = (initial_value * np.array(weights)) / last_prices
    
    # Storage for results
    sim_portfolio_values = np.zeros((horizon_days + 1, n_sims))
    sim_stock_paths = np.zeros((horizon_days + 1, n_assets, n_sims))
    
    # Set initial values
    sim_portfolio_values[0, :] = initial_value
    for i in range(n_assets):
        sim_stock_paths[0, i, :] = last_prices[i]
    
    print(f"Running {n_sims:,} simulations...")
    
    # Monte Carlo simulation
    for sim in range(n_sims):
        stock_prices = last_prices.copy()
        
        for t in range(horizon_days):
            # Generate correlated random shocks
            z = np.random.normal(size=n_assets)
            correlated_z = chol @ z
            
            # GBM evolution
            dt = 1.0
            drift = (mu_daily - 0.5 * np.diag(cov_daily)) * dt
            diffusion = np.sqrt(np.diag(cov_daily)) * np.sqrt(dt) * correlated_z
            
            stock_prices = stock_prices * np.exp(drift + diffusion)
            
            # Store stock prices
            for i in range(n_assets):
                sim_stock_paths[t + 1, i, sim] = stock_prices[i]
            
            # Calculate portfolio value (buy and hold strategy)
            portfolio_value = np.dot(stock_prices, shares_per_stock)
            sim_portfolio_values[t + 1, sim] = portfolio_value
    
    # Calculate returns
    sim_returns = (sim_portfolio_values[-1, :] / initial_value) - 1
    
    return {
        'portfolio_paths': sim_portfolio_values,
        'stock_paths': sim_stock_paths,
        'returns': sim_returns,
        'final_values': sim_portfolio_values[-1, :],
        'initial_portfolio_price': portfolio_price,
        'shares_per_stock': shares_per_stock,
        'last_prices': last_prices
    }

def display_results(tickers, weights, metrics, simulation_results, simulation_time):
    """Display comprehensive results"""
    
    returns = simulation_results['returns']
    final_values = simulation_results['final_values']
    
    # Risk metrics
    mean_return = np.mean(returns)
    median_return = np.median(returns)
    volatility = np.std(returns)
    prob_negative = np.mean(returns < 0)
    var_5 = np.percentile(returns, 5)
    var_1 = np.percentile(returns, 1)
    
    print(f"\n{'='*80}")
    print(f"                    PORTFOLIO MONTE CARLO RESULTS")
    print(f"{'='*80}")
    print(f"Simulation completed in: {simulation_time:.2f} seconds")
    
    # Portfolio composition
    print(f"\n--- PORTFOLIO COMPOSITION ---")
    for i, (ticker, weight) in enumerate(zip(tickers, weights)):
        print(f"{ticker}: {weight:.1%} (${weight*100000:,.0f})")
    
    # Historical metrics
    print(f"\n--- HISTORICAL ANALYSIS ---")
    print(f"Portfolio annual return: {metrics['portfolio_return']:.2%}")
    print(f"Portfolio annual volatility: {metrics['portfolio_volatility']:.2%}")
    print(f"Sharpe ratio: {metrics['portfolio_return']/metrics['portfolio_volatility']:.2f}")
    
    print(f"\n--- INDIVIDUAL STOCK METRICS ---")
    for i, ticker in enumerate(tickers):
        print(f"{ticker}: Return {metrics['individual_returns'].iloc[i]:.2%}, "
              f"Volatility {metrics['individual_volatilities'].iloc[i]:.2%}")
    
    # Monte Carlo results
    print(f"\n--- MONTE CARLO RESULTS (1 Year) ---")
    print(f"Mean return: {mean_return:.2%}")
    print(f"Median return: {median_return:.2%}")
    print(f"Return volatility: {volatility:.2%}")
    print(f"Best case: {np.max(returns):.2%}")
    print(f"Worst case: {np.min(returns):.2%}")
    
    print(f"\n--- RISK METRICS ---")
    print(f"Probability of loss: {prob_negative:.1%}")
    print(f"5% VaR (Value at Risk): {var_5:.2%}")
    print(f"1% VaR (Value at Risk): {var_1:.2%}")
    
    print(f"\n--- PORTFOLIO VALUES ---")
    print(f"Expected final value: ${np.mean(final_values):,.0f}")
    print(f"Median final value: ${np.median(final_values):,.0f}")
    print(f"Value range: ${np.min(final_values):,.0f} - ${np.max(final_values):,.0f}")
    print(f"{'='*80}")

def create_visualizations(tickers, weights, metrics, simulation_results):
    """Create comprehensive visualizations"""
    
    portfolio_paths = simulation_results['portfolio_paths']
    stock_paths = simulation_results['stock_paths']
    returns = simulation_results['returns']
    
    horizon_days = portfolio_paths.shape[0] - 1
    days = np.arange(horizon_days + 1)
    
    # 1. Portfolio path fan chart
    plt.figure(figsize=(14, 8))
    
    # Calculate percentiles
    p5 = np.percentile(portfolio_paths, 5, axis=1)
    p25 = np.percentile(portfolio_paths, 25, axis=1)
    p50 = np.percentile(portfolio_paths, 50, axis=1)
    p75 = np.percentile(portfolio_paths, 75, axis=1)
    p95 = np.percentile(portfolio_paths, 95, axis=1)
    
    plt.plot(days, portfolio_paths[:, :100], alpha=0.02, color='blue')
    plt.fill_between(days, p5, p95, alpha=0.2, color='lightblue', label='5th-95th percentile')
    plt.fill_between(days, p25, p75, alpha=0.3, color='skyblue', label='25th-75th percentile')
    plt.plot(days, p50, color='darkblue', linewidth=3, label='Median')
    plt.axhline(y=100000, color='red', linestyle='--', alpha=0.7, label='Initial Investment')
    
    plt.title(f'Portfolio Monte Carlo Simulation\n{", ".join([f"{t}({w:.1%})" for t, w in zip(tickers, weights)])}', 
              fontsize=14, fontweight='bold')
    plt.xlabel('Trading Days')
    plt.ylabel('Portfolio Value ($)')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.show()
    
    # 2. Return distribution
    plt.figure(figsize=(12, 6))
    plt.hist(returns, bins=50, alpha=0.7, color='lightgreen', edgecolor='black', density=True)
    plt.axvline(np.mean(returns), color='blue', linestyle='-', linewidth=2, 
                label=f'Mean: {np.mean(returns):.1%}')
    plt.axvline(np.percentile(returns, 5), color='red', linestyle='--', linewidth=2, 
                label=f'5% VaR: {np.percentile(returns, 5):.1%}')
    plt.axvline(0, color='black', linestyle=':', alpha=0.7, label='Break-even')
    
    plt.title('Distribution of Portfolio Returns (1 Year)', fontsize=14, fontweight='bold')
    plt.xlabel('Return (%)')
    plt.ylabel('Density')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.gca().xaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:.0%}'))
    plt.tight_layout()
    plt.show()
    
    # 3. Correlation heatmap
    plt.figure(figsize=(8, 6))
    sns.heatmap(metrics['correlation_matrix'], annot=True, cmap='RdYlBu_r', center=0,
                square=True, fmt='.3f', cbar_kws={'label': 'Correlation'})
    plt.title('Stock Correlation Matrix', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.show()
    
    # 4. Interactive Plotly portfolio paths
    fig = go.Figure()
    
    # Add sample paths
    for i in range(0, min(50, portfolio_paths.shape[1]), 5):
        fig.add_trace(go.Scatter(
            x=days, y=portfolio_paths[:, i],
            mode='lines',
            line=dict(color='lightblue', width=0.5),
            opacity=0.3,
            showlegend=False,
            hovertemplate='Day: %{x}<br>Value: $%{y:,.0f}<extra></extra>'
        ))
    
    # Add percentiles
    fig.add_trace(go.Scatter(x=days, y=p95, mode='lines', name='95th percentile', 
                            line=dict(color='red', width=1)))
    fig.add_trace(go.Scatter(x=days, y=p75, mode='lines', name='75th percentile', 
                            line=dict(color='orange', width=1)))
    fig.add_trace(go.Scatter(x=days, y=p50, mode='lines', name='Median', 
                            line=dict(color='blue', width=3)))
    fig.add_trace(go.Scatter(x=days, y=p25, mode='lines', name='25th percentile', 
                            line=dict(color='orange', width=1)))
    fig.add_trace(go.Scatter(x=days, y=p5, mode='lines', name='5th percentile', 
                            line=dict(color='red', width=1)))
    
    fig.add_hline(y=100000, line_dash="dash", line_color="green", 
                  annotation_text="Initial Investment: $100,000")
    
    fig.update_layout(
        title=f"Interactive Portfolio Simulation<br><sub>{', '.join([f'{t}({w:.1%})' for t, w in zip(tickers, weights)])}</sub>",
        xaxis_title="Trading Days",
        yaxis_title="Portfolio Value ($)",
        hovermode='x unified',
        width=1000,
        height=600
    )
    
    fig.show()

def main():
    """Main function"""
    np.random.seed(42)  # For reproducibility
    
    try:
        # Get user input
        tickers, weights = get_portfolio_input()
        
        # Display portfolio
        print(f"\nPortfolio: {', '.join([f'{t}({w:.1%})' for t, w in zip(tickers, weights)])}")
        
        # Start timing
        start_time = time.time()
        
        # Download data
        start_date = "2018-01-01"
        end_date = None
        prices = download_portfolio_data(tickers, start_date, end_date)
        
        print(f"Data period: {prices.index[0].strftime('%Y-%m-%d')} to {prices.index[-1].strftime('%Y-%m-%d')}")
        print(f"Trading days: {len(prices):,}")
        
        # Calculate metrics
        print("\nCalculating portfolio metrics...")
        metrics = calculate_portfolio_metrics(prices, weights)
        
        # Run simulation
        print("\nRunning Monte Carlo simulation...")
        simulation_results = run_portfolio_simulation(prices, weights)
        
        # Calculate timing
        end_time = time.time()
        simulation_time = end_time - start_time
        
        # Display results
        display_results(tickers, weights, metrics, simulation_results, simulation_time)
        
        # Create visualizations
        print("\nGenerating visualizations...")
        create_visualizations(tickers, weights, metrics, simulation_results)
        
        print(f"\nTotal execution time: {simulation_time:.2f} seconds")
        
    except Exception as e:
        print(f"Error: {e}")
        return

if __name__ == "__main__":
    main()