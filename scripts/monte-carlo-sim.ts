#!/usr/bin/env node

/**
 * Monte Carlo Stock Price Simulator
 * TypeScript/Node.js version of the Python Monte Carlo simulation
 * 
 * Usage: npx tsx scripts/monte-carlo-sim.ts
 * Or: npm run monte-carlo
 */

import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

// Types
interface SimulationConfig {
  ticker: string;
  startDate: string;
  endDate?: string;
  tradingDays: number;
  horizonYears: number;
  horizonDays: number;
  numSimulations: number;
  initialInvestment: number;
  seed: number;
}

interface SimulationResults {
  stockPaths: number[][];
  finalValues: number[];
  finalInvestmentValues: number[];
  returns: number[];
  percentiles: {
    p10: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p90: number[];
  };
  riskMetrics: {
    meanReturn: number;
    medianReturn: number;
    probNegative: number;
    var5: number;
    volatility: number;
  };
  statistics: {
    expectedFinalValue: number;
    minFinalValue: number;
    maxFinalValue: number;
    bestReturn: number;
    worstReturn: number;
  };
}

interface StockData {
  prices: number[];
  dates: string[];
  returns: number[];
  meanReturn: number;
  volatility: number;
  annualizedReturn: number;
  annualizedVolatility: number;
}

class MonteCarloSimulator {
  private config: SimulationConfig;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = {
      ticker: 'AAPL',
      startDate: '2018-01-01',
      tradingDays: 252,
      horizonYears: 1,
      horizonDays: 252,
      numSimulations: 10000,
      initialInvestment: 100000,
      seed: 42,
      ...config
    };
    
    this.config.horizonDays = this.config.tradingDays * this.config.horizonYears;
  }

  /**
   * Fetch historical stock data using a free API
   * For production, you'd want to use a proper financial data provider
   */
  async fetchStockData(): Promise<StockData> {
    const { ticker, startDate, endDate } = this.config;
    
    try {
      // Using Yahoo Finance API (free, no auth required)
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${Math.floor(new Date(startDate).getTime() / 1000)}&period2=${Math.floor((endDate ? new Date(endDate).getTime() : Date.now()) / 1000)}&interval=1d`;
      
      console.log(`📈 Fetching data for ${ticker}...`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new Error(`No data found for ticker ${ticker}`);
      }
      
      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const prices = result.indicators.quote[0].close;
      
      // Filter out null values and create clean data
      const cleanData = timestamps.map((timestamp: number, index: number) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        price: prices[index]
      })).filter((item: any) => item.price !== null);
      
      const stockPrices = cleanData.map((item: any) => item.price);
      const dates = cleanData.map((item: any) => item.date);
      
      if (stockPrices.length < 30) {
        throw new Error(`Insufficient data for ${ticker}. Found ${stockPrices.length} data points.`);
      }
      
      // Calculate returns
      const returns = [];
      for (let i = 1; i < stockPrices.length; i++) {
        returns.push(Math.log(stockPrices[i] / stockPrices[i - 1]));
      }
      
      const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / (returns.length - 1);
      const volatility = Math.sqrt(variance);
      
      const annualizedReturn = meanReturn * this.config.tradingDays;
      const annualizedVolatility = volatility * Math.sqrt(this.config.tradingDays);
      
      console.log(`✅ Successfully fetched ${stockPrices.length} trading days of data`);
      console.log(`📊 Price range: $${Math.min(...stockPrices).toFixed(2)} - $${Math.max(...stockPrices).toFixed(2)}`);
      console.log(`💰 Latest price: $${stockPrices[stockPrices.length - 1].toFixed(2)}`);
      console.log(`📈 Annualized return: ${(annualizedReturn * 100).toFixed(2)}%`);
      console.log(`📊 Annualized volatility: ${(annualizedVolatility * 100).toFixed(2)}%`);
      
      return {
        prices: stockPrices,
        dates,
        returns,
        meanReturn,
        volatility,
        annualizedReturn,
        annualizedVolatility
      };
      
    } catch (error) {
      console.error(`❌ Error fetching data for ${ticker}:`, error);
      throw error;
    }
  }

  /**
   * Run Monte Carlo simulation using Geometric Brownian Motion
   */
  async runSimulation(): Promise<SimulationResults> {
    console.log('\n🎲 Starting Monte Carlo simulation...');
    
    // Set random seed for reproducibility
    this.seedRandom(this.config.seed);
    
    // Fetch historical data
    const stockData = await this.fetchStockData();
    
    const startPrice = stockData.prices[stockData.prices.length - 1];
    const numShares = this.config.initialInvestment / startPrice;
    
    // Simulation parameters
    const mu = stockData.meanReturn; // Daily drift
    const sigma = stockData.volatility; // Daily volatility
    const dt = 1.0; // Daily time step
    
    console.log(`🎯 Starting simulation with ${this.config.numSimulations.toLocaleString()} paths...`);
    console.log(`📅 Time horizon: ${this.config.horizonYears} year (${this.config.horizonDays} trading days)`);
    console.log(`💰 Initial investment: $${this.config.initialInvestment.toLocaleString()}`);
    console.log(`📈 Starting stock price: $${startPrice.toFixed(2)}`);
    console.log(`📊 Number of shares: ${numShares.toFixed(2)}`);
    
    const startTime = Date.now();
    
    // Pre-allocate arrays for performance
    const stockPaths: number[][] = Array(this.config.horizonDays + 1).fill(null).map(() => Array(this.config.numSimulations).fill(0));
    const finalValues: number[] = Array(this.config.numSimulations).fill(0);
    
    // Initialize starting prices
    stockPaths[0].fill(startPrice);
    
    // Run simulations
    for (let sim = 0; sim < this.config.numSimulations; sim++) {
      let currentPrice = startPrice;
      
      for (let day = 1; day <= this.config.horizonDays; day++) {
        // Generate random shock
        const z = this.normalRandom();
        
        // Geometric Brownian Motion step
        const drift = (mu - 0.5 * sigma * sigma) * dt;
        const diffusion = sigma * Math.sqrt(dt) * z;
        currentPrice = currentPrice * Math.exp(drift + diffusion);
        
        stockPaths[day][sim] = currentPrice;
      }
      
      finalValues[sim] = currentPrice;
    }
    
    // Calculate investment values and returns
    const finalInvestmentValues = finalValues.map(price => price * numShares);
    const returns = finalValues.map(price => (price / startPrice) - 1);
    
    // Calculate percentiles for visualization
    const percentiles = this.calculatePercentiles(stockPaths);
    
    // Calculate risk metrics
    const riskMetrics = this.calculateRiskMetrics(returns);
    
    // Calculate statistics
    const statistics = {
      expectedFinalValue: finalInvestmentValues.reduce((sum, val) => sum + val, 0) / finalInvestmentValues.length,
      minFinalValue: Math.min(...finalInvestmentValues),
      maxFinalValue: Math.max(...finalInvestmentValues),
      bestReturn: Math.max(...returns),
      worstReturn: Math.min(...returns)
    };
    
    const endTime = Date.now();
    const simulationTime = (endTime - startTime) / 1000;
    
    console.log(`✅ Simulation completed in ${simulationTime.toFixed(2)} seconds`);
    
    return {
      stockPaths,
      finalValues,
      finalInvestmentValues,
      returns,
      percentiles,
      riskMetrics,
      statistics
    };
  }

  /**
   * Calculate percentiles for each time step
   */
  private calculatePercentiles(stockPaths: number[][]): SimulationResults['percentiles'] {
    const percentiles = {
      p10: [] as number[],
      p25: [] as number[],
      p50: [] as number[],
      p75: [] as number[],
      p90: [] as number[]
    };
    
    for (let day = 0; day < stockPaths.length; day++) {
      const prices = stockPaths[day].slice().sort((a, b) => a - b);
      percentiles.p10.push(this.percentile(prices, 10));
      percentiles.p25.push(this.percentile(prices, 25));
      percentiles.p50.push(this.percentile(prices, 50));
      percentiles.p75.push(this.percentile(prices, 75));
      percentiles.p90.push(this.percentile(prices, 90));
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
    const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length);
    
    return {
      meanReturn,
      medianReturn,
      probNegative,
      var5,
      volatility
    };
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
    // Simple linear congruential generator for seeding
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
    const { riskMetrics, statistics } = results;
    
    console.log('\n' + '='.repeat(60));
    console.log(`           MONTE CARLO RESULTS FOR ${this.config.ticker.toUpperCase()}`);
    console.log('='.repeat(60));
    console.log(`Number of simulations: ${this.config.numSimulations.toLocaleString()}`);
    console.log(`Time horizon: ${this.config.horizonYears} year (${this.config.horizonDays} trading days)`);
    console.log(`Initial investment: $${this.config.initialInvestment.toLocaleString()}`);
    console.log(`\n--- RETURN STATISTICS ---`);
    console.log(`Mean return: ${(riskMetrics.meanReturn * 100).toFixed(2)}%`);
    console.log(`Median return: ${(riskMetrics.medianReturn * 100).toFixed(2)}%`);
    console.log(`Return volatility: ${(riskMetrics.volatility * 100).toFixed(2)}%`);
    console.log(`Best case return: ${(statistics.bestReturn * 100).toFixed(2)}%`);
    console.log(`Worst case return: ${(statistics.worstReturn * 100).toFixed(2)}%`);
    console.log(`\n--- RISK METRICS ---`);
    console.log(`Probability of loss: ${(riskMetrics.probNegative * 100).toFixed(1)}%`);
    console.log(`5% Value at Risk: ${(riskMetrics.var5 * 100).toFixed(2)}%`);
    console.log(`\n--- FINAL VALUES ---`);
    console.log(`Expected final value: $${statistics.expectedFinalValue.toLocaleString()}`);
    console.log(`Final value range: $${statistics.minFinalValue.toLocaleString()} - $${statistics.maxFinalValue.toLocaleString()}`);
    console.log('='.repeat(60));
  }

  /**
   * Generate HTML visualization using ECharts
   */
  async generateVisualization(results: SimulationResults): Promise<void> {
    console.log('\n📊 Generating visualizations...');
    
    const { stockPaths, percentiles, finalValues, returns } = results;
    const days = Array.from({ length: this.config.horizonDays + 1 }, (_, i) => i);
    const startPrice = stockPaths[0][0];
    
    // Create HTML file with ECharts visualization
    const htmlContent = this.generateHTMLVisualization(days, stockPaths, percentiles, finalValues, returns, startPrice, results);
    
    const outputPath = path.join(process.cwd(), 'monte-carlo-results.html');
    fs.writeFileSync(outputPath, htmlContent);
    
    console.log(`📁 Visualization saved to: ${outputPath}`);
    console.log('🌐 Open the HTML file in your browser to view the interactive charts');
  }

  /**
   * Generate HTML with ECharts visualization
   */
  private generateHTMLVisualization(
    days: number[],
    stockPaths: number[][],
    percentiles: SimulationResults['percentiles'],
    finalValues: number[],
    returns: number[],
    startPrice: number,
    results: SimulationResults
  ): string {
    // Sample a subset of paths for the main chart (for performance)
    const samplePaths = Math.min(50, this.config.numSimulations);
    const pathIndices = Array.from({ length: samplePaths }, (_, i) => Math.floor(i * this.config.numSimulations / samplePaths));
    
    const stockPathData = pathIndices.map(idx => ({
      name: `Path ${idx + 1}`,
      type: 'line',
      data: days.map(day => stockPaths[day][idx]),
      lineStyle: { width: 0.5, opacity: 0.3 },
      showSymbol: false,
      silent: true
    }));

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monte Carlo Simulation - ${this.config.ticker.toUpperCase()}</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Monte Carlo Simulation</h1>
            <p>${this.config.ticker.toUpperCase()} - ${this.config.numSimulations.toLocaleString()} simulations over ${this.config.horizonYears} year</p>
        </div>
        
        <div class="chart-container">
            <div class="chart-title">Stock Price Paths</div>
            <div id="stockChart" class="chart"></div>
            
            <div class="chart-title">Distribution of Returns</div>
            <div id="returnsChart" class="chart"></div>
            
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
        // Stock Price Paths Chart
        const stockChart = echarts.init(document.getElementById('stockChart'));
        const stockOption = {
            title: {
                text: 'Monte Carlo Stock Price Simulation',
                subtext: '${this.config.numSimulations.toLocaleString()} simulated paths with confidence bands',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' }
            },
            legend: {
                data: ['10th-90th Percentile', '25th-75th Percentile', 'Median', 'Starting Price'],
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
            series: [
                ...${JSON.stringify(stockPathData)},
                {
                    name: '90th Percentile',
                    type: 'line',
                    data: ${JSON.stringify(percentiles.p90)},
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
                    name: '10th Percentile',
                    type: 'line',
                    data: ${JSON.stringify(percentiles.p10)},
                    lineStyle: { color: '#ff4757', width: 1 },
                    showSymbol: false
                },
                {
                    name: 'Starting Price',
                    type: 'line',
                    data: Array(${days.length}).fill(${startPrice}),
                    lineStyle: { color: '#2ed573', width: 2, type: 'dashed' },
                    showSymbol: false
                }
            ]
        };
        stockChart.setOption(stockOption);

        // Returns Distribution Chart
        const returnsChart = echarts.init(document.getElementById('returnsChart'));
        const returnsData = ${JSON.stringify(returns)};
        
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
                text: 'Distribution of Returns',
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

        // Handle window resize
        window.addEventListener('resize', () => {
            stockChart.resize();
            returnsChart.resize();
        });
    </script>
</body>
</html>`;
  }
}

// CLI Interface
async function main() {
  console.log('='.repeat(60));
  console.log('    Monte Carlo Stock Price Simulator');
  console.log('='.repeat(60));

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
    const ticker = (await question('Enter stock ticker symbol (e.g., AAPL, MSFT, TSLA): ')).toUpperCase().trim();
    const finalTicker = ticker || 'AAPL';
    
    console.log(`\\nStarting Monte Carlo simulation for ${finalTicker}...`);
    
    // Create simulator
    const simulator = new MonteCarloSimulator({
      ticker: finalTicker,
      numSimulations: 10000,
      horizonYears: 1,
      initialInvestment: 100000
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

export { MonteCarloSimulator, type SimulationConfig, type SimulationResults };
