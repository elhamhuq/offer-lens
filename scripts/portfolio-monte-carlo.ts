#!/usr/bin/env node

/**
 * Portfolio Monte Carlo Simulator
 * Multi-stock portfolio simulation with dollar amount inputs
 * 
 * Usage: npx tsx scripts/portfolio-monte-carlo.ts
 * Or: npm run portfolio-monte-carlo
 */

import * as fs from 'fs';
import * as path from 'path';

// Types
interface PortfolioPosition {
  ticker: string;
  dollarAmount: number;
  weight?: number;
  shares?: number;
  currentPrice?: number;
}

interface PortfolioConfig {
  positions: PortfolioPosition[];
  horizonYears: number;
  horizonDays: number;
  numSimulations: number;
  seed: number;
}

interface PortfolioData {
  tickers: string[];
  prices: { [ticker: string]: number[] };
  dates: string[];
  returns: { [ticker: string]: number[] };
  correlationMatrix: number[][];
  meanReturns: { [ticker: string]: number };
  volatilities: { [ticker: string]: number };
  covMatrix: number[][];
}

interface SimulationResults {
  portfolioPaths: number[][];
  individualPaths: { [ticker: string]: number[][] };
  finalValues: number[];
  returns: number[];
  percentiles: {
    p5: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p95: number[];
  };
  riskMetrics: {
    meanReturn: number;
    medianReturn: number;
    probNegative: number;
    var5: number;
    var1: number;
    cvar5: number;
    volatility: number;
  };
  statistics: {
    expectedFinalValue: number;
    minFinalValue: number;
    maxFinalValue: number;
    bestReturn: number;
    worstReturn: number;
  };
  individualStockResults: {
    [ticker: string]: {
      meanReturn: number;
      volatility: number;
      finalValue: number;
    };
  };
}

class PortfolioMonteCarloSimulator {
  private config: PortfolioConfig;
  private portfolioData: PortfolioData | null = null;

  constructor(config: Partial<PortfolioConfig> = {}) {
    this.config = {
      positions: [],
      horizonYears: 1,
      horizonDays: 252,
      numSimulations: 10000,
      seed: 42,
      ...config
    };
    
    this.config.horizonDays = 252 * this.config.horizonYears;
  }

  /**
   * Fetch historical data for all portfolio stocks
   */
  async fetchPortfolioData(): Promise<PortfolioData> {
    const tickers = this.config.positions.map(pos => pos.ticker);
    
    console.log(`📈 Fetching data for ${tickers.length} stocks: ${tickers.join(', ')}...`);
    
    const prices: { [ticker: string]: number[] } = {};
    const returns: { [ticker: string]: number[] } = {};
    const meanReturns: { [ticker: string]: number } = {};
    const volatilities: { [ticker: string]: number } = {};
    
    let dates: string[] = [];
    let minLength = Infinity;
    
    // Fetch data for each stock
    for (const ticker of tickers) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${Math.floor(new Date('2018-01-01').getTime() / 1000)}&period2=${Math.floor(Date.now() / 1000)}&interval=1d`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${ticker}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
          throw new Error(`No data found for ticker ${ticker}`);
        }
        
        const result = data.chart.result[0];
        const timestamps = result.timestamp;
        const stockPrices = result.indicators.quote[0].close;
        
        // Filter out null values
        const cleanData = timestamps.map((timestamp: number, index: number) => ({
          date: new Date(timestamp * 1000).toISOString().split('T')[0],
          price: stockPrices[index]
        })).filter((item: any) => item.price !== null);
        
        if (cleanData.length < 30) {
          throw new Error(`Insufficient data for ${ticker}. Found ${cleanData.length} data points.`);
        }
        
        const stockPricesArray = cleanData.map((item: any) => item.price);
        prices[ticker] = stockPricesArray;
        
        // Calculate returns
        const stockReturns = [];
        for (let i = 1; i < stockPricesArray.length; i++) {
          stockReturns.push(Math.log(stockPricesArray[i] / stockPricesArray[i - 1]));
        }
        returns[ticker] = stockReturns;
        
        // Calculate statistics
        const meanReturn = stockReturns.reduce((sum, ret) => sum + ret, 0) / stockReturns.length;
        const variance = stockReturns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / (stockReturns.length - 1);
        const volatility = Math.sqrt(variance);
        
        meanReturns[ticker] = meanReturn * 252; // Annualized
        volatilities[ticker] = volatility * Math.sqrt(252); // Annualized
        
        // Track minimum length for alignment
        minLength = Math.min(minLength, stockPricesArray.length);
        
        if (dates.length === 0) {
          dates = cleanData.map((item: any) => item.date);
        }
        
        console.log(`✅ ${ticker}: ${stockPricesArray.length} days, Latest: $${stockPricesArray[stockPricesArray.length - 1].toFixed(2)}`);
        
      } catch (error) {
        console.error(`❌ Error fetching data for ${ticker}:`, error);
        throw error;
      }
    }
    
    // Align all data to the same length (use most recent data)
    for (const ticker of tickers) {
      if (prices[ticker].length > minLength) {
        const startIndex = prices[ticker].length - minLength;
        prices[ticker] = prices[ticker].slice(startIndex);
        returns[ticker] = returns[ticker].slice(startIndex - 1); // Returns are one less
      }
    }
    
    // Calculate correlation matrix
    const correlationMatrix = this.calculateCorrelationMatrix(returns);
    
    // Calculate covariance matrix
    const covMatrix = this.calculateCovarianceMatrix(returns);
    
    console.log(`📊 Successfully fetched data for ${tickers.length} stocks`);
    console.log(`📅 Common date range: ${dates[dates.length - minLength]} to ${dates[dates.length - 1]}`);
    console.log(`📈 Total trading days: ${minLength}`);
    
    this.portfolioData = {
      tickers,
      prices,
      dates: dates.slice(-minLength),
      returns,
      correlationMatrix,
      meanReturns,
      volatilities,
      covMatrix
    };
    
    return this.portfolioData;
  }

  /**
   * Calculate correlation matrix from returns
   */
  private calculateCorrelationMatrix(returns: { [ticker: string]: number[] }): number[][] {
    const tickers = Object.keys(returns);
    const n = tickers.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          const corr = this.calculateCorrelation(returns[tickers[i]], returns[tickers[j]]);
          matrix[i][j] = corr;
        }
      }
    }
    
    return matrix;
  }

  /**
   * Calculate covariance matrix from returns
   */
  private calculateCovarianceMatrix(returns: { [ticker: string]: number[] }): number[][] {
    const tickers = Object.keys(returns);
    const n = tickers.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const cov = this.calculateCovariance(returns[tickers[i]], returns[tickers[j]]);
        matrix[i][j] = cov * 252; // Annualized
      }
    }
    
    return matrix;
  }

  /**
   * Calculate correlation between two arrays
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let sumX2 = 0;
    let sumY2 = 0;
    
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      sumX2 += dx * dx;
      sumY2 += dy * dy;
    }
    
    const denominator = Math.sqrt(sumX2 * sumY2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate covariance between two arrays
   */
  private calculateCovariance(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = x.reduce((sum, val) => sum + val, 0) / n;
    const meanY = y.reduce((sum, val) => sum + val, 0) / n;
    
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += (x[i] - meanX) * (y[i] - meanY);
    }
    
    return sum / (n - 1);
  }

  /**
   * Run portfolio Monte Carlo simulation
   */
  async runSimulation(): Promise<SimulationResults> {
    if (!this.portfolioData) {
      await this.fetchPortfolioData();
    }
    
    console.log('\n🎲 Starting portfolio Monte Carlo simulation...');
    
    // Set random seed
    this.seedRandom(this.config.seed);
    
    const { tickers, returns, prices } = this.portfolioData!;
    
    // Calculate portfolio weights from dollar amounts
    const totalValue = this.config.positions.reduce((sum, pos) => sum + pos.dollarAmount, 0);
    const weights = this.config.positions.map(pos => pos.dollarAmount / totalValue);
    
    // Update positions with calculated weights and shares
    for (let i = 0; i < this.config.positions.length; i++) {
      const position = this.config.positions[i];
      const latestPrice = prices[position.ticker][prices[position.ticker].length - 1];
      position.weight = weights[i];
      position.shares = position.dollarAmount / latestPrice;
      position.currentPrice = latestPrice;
    }
    
    console.log(`💰 Portfolio value: $${totalValue.toLocaleString()}`);
    console.log(`📊 Number of simulations: ${this.config.numSimulations.toLocaleString()}`);
    console.log(`📅 Time horizon: ${this.config.horizonYears} year (${this.config.horizonDays} trading days)`);
    
    // Calculate daily statistics
    const dailyReturns = tickers.map(ticker => {
      const returnsArray = returns[ticker];
      return returnsArray.reduce((sum, ret) => sum + ret, 0) / returnsArray.length;
    });
    
    const dailyCov = this.calculateCovarianceMatrix(returns);
    const dailyCovMatrix = dailyCov.map(row => row.map(val => val / 252)); // Convert to daily
    
    // Cholesky decomposition for correlation
    let chol: number[][];
    try {
      chol = this.choleskyDecomposition(dailyCovMatrix);
    } catch (error) {
      // Regularize if not positive definite
      const regularized = dailyCovMatrix.map((row, i) => 
        row.map((val, j) => i === j ? val + 1e-6 : val)
      );
      chol = this.choleskyDecomposition(regularized);
    }
    
    const nAssets = tickers.length;
    const dt = 1.0;
    
    // Initial prices and shares
    const initialPrices = tickers.map(ticker => prices[ticker][prices[ticker].length - 1]);
    const sharesHeld = this.config.positions.map(pos => pos.shares!);
    
    // Storage for results
    const portfolioPaths: number[][] = Array(this.config.horizonDays + 1).fill(null).map(() => Array(this.config.numSimulations).fill(0));
    const individualPaths: { [ticker: string]: number[][] } = {};
    
    // Initialize individual paths storage
    for (const ticker of tickers) {
      individualPaths[ticker] = Array(this.config.horizonDays + 1).fill(null).map(() => Array(this.config.numSimulations).fill(0));
    }
    
    // Set initial values
    portfolioPaths[0].fill(totalValue);
    for (const ticker of tickers) {
      const tickerIndex = tickers.indexOf(ticker);
      individualPaths[ticker][0].fill(initialPrices[tickerIndex]);
    }
    
    const startTime = Date.now();
    
    // Monte Carlo simulation
    for (let sim = 0; sim < this.config.numSimulations; sim++) {
      if (sim % 1000 === 0) {
        console.log(`  Progress: ${(sim / this.config.numSimulations * 100).toFixed(0)}%`);
      }
      
      let currentPrices = [...initialPrices];
      
      for (let day = 1; day <= this.config.horizonDays; day++) {
        // Generate correlated random shocks
        const z = Array(nAssets).fill(0).map(() => this.normalRandom());
        const correlatedZ = this.matrixVectorMultiply(chol, z);
        
        // GBM evolution for each asset
        for (let i = 0; i < nAssets; i++) {
          const drift = (dailyReturns[i] - 0.5 * dailyCovMatrix[i][i]) * dt;
          const diffusion = Math.sqrt(dailyCovMatrix[i][i] * dt) * correlatedZ[i];
          currentPrices[i] = currentPrices[i] * Math.exp(drift + diffusion);
          
          // Store individual stock price
          individualPaths[tickers[i]][day][sim] = currentPrices[i];
        }
        
        // Calculate portfolio value
        const portfolioValue = currentPrices.reduce((sum, price, i) => sum + price * sharesHeld[i], 0);
        portfolioPaths[day][sim] = portfolioValue;
      }
    }
    
    const endTime = Date.now();
    const simulationTime = (endTime - startTime) / 1000;
    
    console.log(`✅ Simulation completed in ${simulationTime.toFixed(2)} seconds`);
    
    // Calculate results
    const finalValues = portfolioPaths[this.config.horizonDays];
    const portfolioReturns = finalValues.map(value => (value / totalValue) - 1);
    
    // Calculate percentiles
    const percentiles = this.calculatePercentiles(portfolioPaths);
    
    // Calculate risk metrics
    const riskMetrics = this.calculateRiskMetrics(portfolioReturns);
    
    // Calculate statistics
    const statistics = {
      expectedFinalValue: finalValues.reduce((sum, val) => sum + val, 0) / finalValues.length,
      minFinalValue: Math.min(...finalValues),
      maxFinalValue: Math.max(...finalValues),
      bestReturn: Math.max(...portfolioReturns),
      worstReturn: Math.min(...portfolioReturns)
    };
    
    // Calculate individual stock results
    const individualStockResults: { [ticker: string]: any } = {};
    for (const ticker of tickers) {
      const finalPrices = individualPaths[ticker][this.config.horizonDays];
      const stockReturns = finalPrices.map(price => (price / initialPrices[tickers.indexOf(ticker)]) - 1);
      individualStockResults[ticker] = {
        meanReturn: stockReturns.reduce((sum, ret) => sum + ret, 0) / stockReturns.length,
        volatility: Math.sqrt(stockReturns.reduce((sum, ret) => sum + Math.pow(ret - stockReturns.reduce((s, r) => s + r, 0) / stockReturns.length, 2), 0) / stockReturns.length),
        finalValue: finalPrices.reduce((sum, price) => sum + price * sharesHeld[tickers.indexOf(ticker)], 0) / finalPrices.length
      };
    }
    
    return {
      portfolioPaths,
      individualPaths,
      finalValues,
      returns: portfolioReturns,
      percentiles,
      riskMetrics,
      statistics,
      individualStockResults
    };
  }

  /**
   * Calculate percentiles for each time step
   */
  private calculatePercentiles(portfolioPaths: number[][]): SimulationResults['percentiles'] {
    const percentiles = {
      p5: [] as number[],
      p25: [] as number[],
      p50: [] as number[],
      p75: [] as number[],
      p95: [] as number[]
    };
    
    for (let day = 0; day < portfolioPaths.length; day++) {
      const values = portfolioPaths[day].slice().sort((a, b) => a - b);
      percentiles.p5.push(this.percentile(values, 5));
      percentiles.p25.push(this.percentile(values, 25));
      percentiles.p50.push(this.percentile(values, 50));
      percentiles.p75.push(this.percentile(values, 75));
      percentiles.p95.push(this.percentile(values, 95));
    }
    
    return percentiles;
  }

  /**
   * Calculate percentile of a sorted array
   */
  private percentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Calculate risk metrics
   */
  private calculateRiskMetrics(returns: number[]): SimulationResults['riskMetrics'] {
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const medianReturn = this.percentile(returns.slice().sort((a, b) => a - b), 50);
    const probNegative = returns.filter(ret => ret < 0).length / returns.length;
    const var5 = this.percentile(returns.slice().sort((a, b) => a - b), 5);
    const var1 = this.percentile(returns.slice().sort((a, b) => a - b), 1);
    const cvar5 = returns.filter(ret => ret <= var5).reduce((sum, ret) => sum + ret, 0) / returns.filter(ret => ret <= var5).length;
    const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length);
    
    return {
      meanReturn,
      medianReturn,
      probNegative,
      var5,
      var1,
      cvar5,
      volatility
    };
  }

  /**
   * Cholesky decomposition
   */
  private choleskyDecomposition(matrix: number[][]): number[][] {
    const n = matrix.length;
    const L: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = 0;
        for (let k = 0; k < j; k++) {
          sum += L[i][k] * L[j][k];
        }
        
        if (i === j) {
          L[i][j] = Math.sqrt(matrix[i][i] - sum);
        } else {
          L[i][j] = (matrix[i][j] - sum) / L[j][j];
        }
      }
    }
    
    return L;
  }

  /**
   * Matrix-vector multiplication
   */
  private matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => row.reduce((sum, val, i) => sum + val * vector[i], 0));
  }

  /**
   * Generate normally distributed random number (Box-Muller transform)
   */
  private normalRandom(): number {
    if (this.spare !== null) {
      const temp = this.spare;
      this.spare = null;
      return temp;
    }
    
    const u1 = Math.random();
    const u2 = Math.random();
    const mag = Math.sqrt(-2 * Math.log(u1));
    
    this.spare = mag * Math.sin(2 * Math.PI * u2);
    return mag * Math.cos(2 * Math.PI * u2);
  }

  private spare: number | null = null;

  /**
   * Seed the random number generator
   */
  private seedRandom(seed: number): void {
    let current = seed;
    const originalRandom = Math.random;
    
    Math.random = () => {
      current = (current * 1664525 + 1013904223) % Math.pow(2, 32);
      return current / Math.pow(2, 32);
    };
  }

  /**
   * Print simulation results
   */
  printResults(results: SimulationResults): void {
    const { riskMetrics, statistics, individualStockResults } = results;
    const totalValue = this.config.positions.reduce((sum, pos) => sum + pos.dollarAmount, 0);
    
    console.log('\n' + '='.repeat(80));
    console.log(`                    PORTFOLIO MONTE CARLO RESULTS`);
    console.log('='.repeat(80));
    console.log(`Number of simulations: ${this.config.numSimulations.toLocaleString()}`);
    console.log(`Time horizon: ${this.config.horizonYears} year (${this.config.horizonDays} trading days)`);
    console.log(`Initial portfolio value: $${totalValue.toLocaleString()}`);
    
    console.log(`\n--- PORTFOLIO COMPOSITION ---`);
    for (const position of this.config.positions) {
      console.log(`${position.ticker}: $${position.dollarAmount.toLocaleString()} (${(position.weight! * 100).toFixed(1)}%) - ${position.shares!.toFixed(2)} shares @ $${position.currentPrice!.toFixed(2)}`);
    }
    
    console.log(`\n--- RETURN STATISTICS ---`);
    console.log(`Mean return: ${(riskMetrics.meanReturn * 100).toFixed(2)}%`);
    console.log(`Median return: ${(riskMetrics.medianReturn * 100).toFixed(2)}%`);
    console.log(`Return volatility: ${(riskMetrics.volatility * 100).toFixed(2)}%`);
    console.log(`Best case return: ${(statistics.bestReturn * 100).toFixed(2)}%`);
    console.log(`Worst case return: ${(statistics.worstReturn * 100).toFixed(2)}%`);
    
    console.log(`\n--- RISK METRICS ---`);
    console.log(`Probability of loss: ${(riskMetrics.probNegative * 100).toFixed(1)}%`);
    console.log(`5% Value at Risk: ${(riskMetrics.var5 * 100).toFixed(2)}%`);
    console.log(`1% Value at Risk: ${(riskMetrics.var1 * 100).toFixed(2)}%`);
    console.log(`5% Conditional VaR: ${(riskMetrics.cvar5 * 100).toFixed(2)}%`);
    
    console.log(`\n--- FINAL VALUES ---`);
    console.log(`Expected final value: $${statistics.expectedFinalValue.toLocaleString()}`);
    console.log(`Final value range: $${statistics.minFinalValue.toLocaleString()} - $${statistics.maxFinalValue.toLocaleString()}`);
    
    console.log(`\n--- INDIVIDUAL STOCK RESULTS ---`);
    for (const [ticker, results] of Object.entries(individualStockResults)) {
      console.log(`${ticker}: ${(results.meanReturn * 100).toFixed(2)}% return, ${(results.volatility * 100).toFixed(2)}% volatility`);
    }
    
    console.log('='.repeat(80));
  }

  /**
   * Generate HTML visualization
   */
  async generateVisualization(results: SimulationResults): Promise<void> {
    console.log('\n📊 Generating portfolio visualizations...');
    
    const { portfolioPaths, individualPaths, percentiles, returns, individualStockResults } = results;
    const { tickers } = this.portfolioData!;
    const days = Array.from({ length: this.config.horizonDays + 1 }, (_, i) => i);
    const totalValue = this.config.positions.reduce((sum, pos) => sum + pos.dollarAmount, 0);
    
    // Create HTML file with ECharts visualization
    const htmlContent = this.generateHTMLVisualization(
      days, portfolioPaths, individualPaths, percentiles, returns, 
      individualStockResults, tickers, totalValue, results
    );
    
    const outputPath = path.join(process.cwd(), 'portfolio-monte-carlo-results.html');
    fs.writeFileSync(outputPath, htmlContent);
    
    console.log(`📁 Visualization saved to: ${outputPath}`);
    console.log('🌐 Open the HTML file in your browser to view the interactive charts');
  }

  /**
   * Generate HTML with ECharts visualization
   */
  private generateHTMLVisualization(
    days: number[],
    portfolioPaths: number[][],
    individualPaths: { [ticker: string]: number[][] },
    percentiles: SimulationResults['percentiles'],
    returns: number[],
    individualStockResults: { [ticker: string]: any },
    tickers: string[],
    totalValue: number,
    results: SimulationResults
  ): string {
    // Sample paths for visualization (first 50 for performance)
    const samplePaths = Math.min(50, this.config.numSimulations);
    const pathIndices = Array.from({ length: samplePaths }, (_, i) => Math.floor(i * this.config.numSimulations / samplePaths));
    
    const portfolioPathData = pathIndices.map(idx => ({
      name: `Path ${idx + 1}`,
      type: 'line',
      data: days.map(day => portfolioPaths[day][idx]),
      lineStyle: { width: 0.5, opacity: 0.3 },
      showSymbol: false,
      silent: true
    }));

    // Individual stock path data
    const individualPathData: { [ticker: string]: any[] } = {};
    for (const ticker of tickers) {
      individualPathData[ticker] = pathIndices.map(idx => ({
        name: `${ticker} Path ${idx + 1}`,
        type: 'line',
        data: days.map(day => individualPaths[ticker][day][idx]),
        lineStyle: { width: 0.5, opacity: 0.3 },
        showSymbol: false,
        silent: true
      }));
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio Monte Carlo Simulation</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.1rem;
        }
        .chart-container {
            padding: 30px;
        }
        .chart {
            width: 100%;
            height: 500px;
            margin-bottom: 40px;
        }
        .chart-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #333;
            margin-bottom: 5px;
        }
        .stat-label {
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .portfolio-composition {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .portfolio-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #dee2e6;
        }
        .portfolio-item:last-child {
            border-bottom: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Portfolio Monte Carlo Simulation</h1>
            <p>Multi-stock portfolio analysis with ${this.config.numSimulations.toLocaleString()} simulations over ${this.config.horizonYears} year</p>
        </div>
        
        <div class="chart-container">
            <div class="portfolio-composition">
                <h3 style="margin-top: 0;">Portfolio Composition</h3>
                ${this.config.positions.map(pos => `
                    <div class="portfolio-item">
                        <span><strong>${pos.ticker}</strong>: ${pos.shares!.toFixed(2)} shares @ $${pos.currentPrice!.toFixed(2)}</span>
                        <span>$${pos.dollarAmount.toLocaleString()} (${(pos.weight! * 100).toFixed(1)}%)</span>
                    </div>
                `).join('')}
                <div class="portfolio-item" style="border-top: 2px solid #333; margin-top: 10px;">
                    <span><strong>Total Portfolio Value</strong></span>
                    <span><strong>$${totalValue.toLocaleString()}</strong></span>
                </div>
            </div>
            
            <div class="chart-title">Portfolio Value Simulation</div>
            <div id="portfolioChart" class="chart"></div>
            
            <div class="chart-title">Distribution of Portfolio Returns</div>
            <div id="returnsChart" class="chart"></div>
            
            <div class="chart-title">Individual Stock Performance</div>
            <div id="individualChart" class="chart"></div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${(results.riskMetrics.meanReturn * 100).toFixed(1)}%</div>
                    <div class="stat-label">Mean Return</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${(results.riskMetrics.probNegative * 100).toFixed(1)}%</div>
                    <div class="stat-label">Probability of Loss</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">$${results.statistics.expectedFinalValue.toLocaleString()}</div>
                    <div class="stat-label">Expected Final Value</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${(results.riskMetrics.var5 * 100).toFixed(1)}%</div>
                    <div class="stat-label">5% VaR</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Portfolio Chart
        const portfolioChart = echarts.init(document.getElementById('portfolioChart'));
        const portfolioOption = {
            title: {
                text: 'Portfolio Value Simulation',
                subtext: '${this.config.numSimulations.toLocaleString()} simulated paths with confidence bands',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' }
            },
            legend: {
                data: ['5th-95th Percentile', '25th-75th Percentile', 'Median', 'Initial Investment'],
                top: 40
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: ${JSON.stringify(days)},
                name: 'Trading Days'
            },
            yAxis: {
                type: 'value',
                name: 'Portfolio Value ($)',
                axisLabel: {
                    formatter: '${'$'}{value}'
                }
            },
            series: [
                ...${JSON.stringify(portfolioPathData)},
                {
                    name: '95th Percentile',
                    type: 'line',
                    data: ${JSON.stringify(percentiles.p95)},
                    lineStyle: { color: '#ff4757', width: 1 },
                    showSymbol: false
                },
                {
                    name: '75th Percentile',
                    type: 'line',
                    data: ${JSON.stringify(percentiles.p75)},
                    lineStyle: { color: '#ffa502', width: 1 },
                    showSymbol: false
                },
                {
                    name: 'Median',
                    type: 'line',
                    data: ${JSON.stringify(percentiles.p50)},
                    lineStyle: { color: '#3742fa', width: 3 },
                    showSymbol: false
                },
                {
                    name: '25th Percentile',
                    type: 'line',
                    data: ${JSON.stringify(percentiles.p25)},
                    lineStyle: { color: '#ffa502', width: 1 },
                    showSymbol: false
                },
                {
                    name: '5th Percentile',
                    type: 'line',
                    data: ${JSON.stringify(percentiles.p5)},
                    lineStyle: { color: '#ff4757', width: 1 },
                    showSymbol: false
                },
                {
                    name: 'Initial Investment',
                    type: 'line',
                    data: Array(${days.length}).fill(${totalValue}),
                    lineStyle: { color: '#2ed573', width: 2, type: 'dashed' },
                    showSymbol: false
                }
            ]
        };
        portfolioChart.setOption(portfolioOption);

        // Returns Distribution Chart
        const returnsChart = echarts.init(document.getElementById('returnsChart'));
        const returnsData = ${JSON.stringify(results.returns)};
        
        // Create histogram data
        const minReturn = Math.min(...returnsData);
        const maxReturn = Math.max(...returnsData);
        const bins = 50;
        const binSize = (maxReturn - minReturn) / bins;
        const histogram = Array(bins).fill(0);
        const binLabels = [];
        
        for (let i = 0; i < bins; i++) {
            binLabels.push(((minReturn + i * binSize) * 100).toFixed(1) + '%');
        }
        
        returnsData.forEach(returnVal => {
            const binIndex = Math.min(Math.floor((returnVal - minReturn) / binSize), bins - 1);
            histogram[binIndex]++;
        });

        const returnsOption = {
            title: {
                text: 'Distribution of Portfolio Returns',
                subtext: 'Histogram of ${this.config.numSimulations.toLocaleString()} simulation outcomes',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: binLabels,
                name: 'Return (%)'
            },
            yAxis: {
                type: 'value',
                name: 'Frequency'
            },
            series: [{
                name: 'Returns',
                type: 'bar',
                data: histogram,
                itemStyle: {
                    color: '#70a1ff'
                },
                markLine: {
                    data: [
                        {
                            yAxis: ${(results.riskMetrics.meanReturn * 100).toFixed(2)},
                            name: 'Mean Return',
                            lineStyle: { color: '#3742fa', width: 2 }
                        },
                        {
                            yAxis: ${(results.riskMetrics.var5 * 100).toFixed(2)},
                            name: '5% VaR',
                            lineStyle: { color: '#ff4757', width: 2, type: 'dashed' }
                        }
                    ]
                }
            }]
        };
        returnsChart.setOption(returnsOption);

        // Individual Stock Chart
        const individualChart = echarts.init(document.getElementById('individualChart'));
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
        
        const individualSeries = [];
        ${tickers.map((ticker, index) => `
            individualSeries.push({
                name: '${ticker}',
                type: 'line',
                data: ${JSON.stringify(days.map(day => individualPaths[ticker][day].reduce((sum, price) => sum + price, 0) / individualPaths[ticker][day].length))},
                lineStyle: { color: '${['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'][index % 7]}', width: 2 },
                showSymbol: false
            });
        `).join('')}

        const individualOption = {
            title: {
                text: 'Individual Stock Price Evolution',
                subtext: 'Average price paths for each stock in the portfolio',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' }
            },
            legend: {
                data: ${JSON.stringify(tickers)},
                top: 40
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: ${JSON.stringify(days)},
                name: 'Trading Days'
            },
            yAxis: {
                type: 'value',
                name: 'Stock Price ($)',
                axisLabel: {
                    formatter: '${'$'}{value}'
                }
            },
            series: individualSeries
        };
        individualChart.setOption(individualOption);

        // Handle window resize
        window.addEventListener('resize', () => {
            portfolioChart.resize();
            returnsChart.resize();
            individualChart.resize();
        });
    </script>
</body>
</html>`;
  }
}

// CLI Interface
async function main() {
  console.log('='.repeat(80));
  console.log('    Portfolio Monte Carlo Simulator');
  console.log('='.repeat(80));

  // Get user input
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, resolve);
    });
  };

  try {
    const positions: PortfolioPosition[] = [];
    
    console.log('\nEnter your portfolio positions:');
    console.log('Format: TICKER DOLLAR_AMOUNT (e.g., AAPL 25000 for $25,000)');
    console.log('Type "done" when finished entering positions\n');
    
    while (true) {
      const entry = (await question(`Position ${positions.length + 1}: `)).trim();
      
      if (entry.toLowerCase() === 'done') {
        if (positions.length === 0) {
          console.log('No positions entered. Using default portfolio...');
          positions.push(
            { ticker: 'AAPL', dollarAmount: 40000 },
            { ticker: 'MSFT', dollarAmount: 30000 },
            { ticker: 'GOOGL', dollarAmount: 30000 }
          );
        }
        break;
      }
      
      try {
        const parts = entry.split(' ');
        if (parts.length < 2) {
          console.log('Please enter: TICKER DOLLAR_AMOUNT (e.g., AAPL 25000)');
          continue;
        }
        
        const ticker = parts[0].toUpperCase();
        const dollarAmount = parseFloat(parts[1]);
        
        if (isNaN(dollarAmount) || dollarAmount <= 0) {
          console.log('Please enter a valid dollar amount');
          continue;
        }
        
        positions.push({ ticker, dollarAmount });
        const total = positions.reduce((sum, pos) => sum + pos.dollarAmount, 0);
        console.log(`✅ Added ${ticker}: $${dollarAmount.toLocaleString()} (Total: $${total.toLocaleString()})`);
        
      } catch (error) {
        console.log('Invalid format. Please enter: TICKER DOLLAR_AMOUNT');
      }
    }
    
    console.log(`\n📋 Final Portfolio:`);
    const totalValue = positions.reduce((sum, pos) => sum + pos.dollarAmount, 0);
    for (const pos of positions) {
      console.log(`  ${pos.ticker}: $${pos.dollarAmount.toLocaleString()} (${((pos.dollarAmount / totalValue) * 100).toFixed(1)}%)`);
    }
    console.log(`  Total: $${totalValue.toLocaleString()}\n`);
    
    // Create simulator
    const simulator = new PortfolioMonteCarloSimulator({
      positions,
      numSimulations: 10000,
      horizonYears: 1
    });
    
    // Run simulation
    const results = await simulator.runSimulation();
    
    // Print results
    simulator.printResults(results);
    
    // Generate visualization
    await simulator.generateVisualization(results);
    
  } catch (error) {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the simulation if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { PortfolioMonteCarloSimulator, type PortfolioConfig, type SimulationResults };
