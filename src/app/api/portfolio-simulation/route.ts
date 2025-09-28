import { NextRequest, NextResponse } from 'next/server';

interface PortfolioPosition {
  ticker: string;
  dollarAmount: number;
}

interface SimulationRequest {
  positions: PortfolioPosition[];
  horizonYears?: number;
  numSimulations?: number;
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
  portfolioComposition: {
    [ticker: string]: {
      allocation_pct: number;
      allocation_dollar: number;
      shares: number;
      current_price: number;
    };
  };
}

class PortfolioMonteCarloSimulator {
  private positions: PortfolioPosition[];
  private horizonYears: number;
  private horizonDays: number;
  private numSimulations: number;
  private seed: number;
  private portfolioData: PortfolioData | null = null;

  constructor(
    positions: PortfolioPosition[],
    horizonYears = 1,
    numSimulations = 5000,
    seed = 42
  ) {
    this.positions = positions;
    this.horizonYears = horizonYears;
    this.horizonDays = 252 * horizonYears;
    this.numSimulations = numSimulations;
    this.seed = seed;
  }

  private seedRandom(seed: number): void {
    let current = seed;
    const originalRandom = Math.random;
    
    Math.random = () => {
      current = (current * 1664525 + 1013904223) % Math.pow(2, 32);
      return current / Math.pow(2, 32);
    };
  }

  private normalRandom(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const mag = Math.sqrt(-2 * Math.log(u1));
    return mag * Math.cos(2 * Math.PI * u2);
  }

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

  private matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => row.reduce((sum, val, i) => sum + val * vector[i], 0));
  }

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

  private formatMarketCap(marketCap: number): string {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  }

  async fetchPortfolioData(): Promise<PortfolioData> {
    const tickers = this.positions.map(pos => pos.ticker);
    
    const prices: { [ticker: string]: number[] } = {};
    const returns: { [ticker: string]: number[] } = {};
    const meanReturns: { [ticker: string]: number } = {};
    const volatilities: { [ticker: string]: number } = {};
    
    let minLength = Infinity;
    const dates: string[] = [];
    
    // Fetch data for each stock
    for (const ticker of tickers) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${Math.floor(new Date('2018-01-01').getTime() / 1000)}&period2=${Math.floor(Date.now() / 1000)}&interval=1d`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${ticker}`);
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
          throw new Error(`Insufficient data for ${ticker}`);
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
          dates.push(...cleanData.map((item: any) => item.date));
        }
        
      } catch (error) {
        console.error(`Error fetching data for ${ticker}:`, error);
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

  async runSimulation(): Promise<SimulationResults> {
    if (!this.portfolioData) {
      await this.fetchPortfolioData();
    }
    
    // Set random seed
    this.seedRandom(this.seed);
    
    const { tickers, returns, prices } = this.portfolioData!;
    
    // Calculate portfolio weights from dollar amounts
    const totalValue = this.positions.reduce((sum, pos) => sum + pos.dollarAmount, 0);
    const weights = this.positions.map(pos => pos.dollarAmount / totalValue);
    
    // Update positions with calculated weights and shares
    const portfolioComposition: { [ticker: string]: any } = {};
    for (let i = 0; i < this.positions.length; i++) {
      const position = this.positions[i];
      const latestPrice = prices[position.ticker][prices[position.ticker].length - 1];
      const dollarAllocation = totalValue * weights[i];
      const shares = dollarAllocation / latestPrice;
      
      portfolioComposition[position.ticker] = {
        allocation_pct: weights[i] * 100,
        allocation_dollar: dollarAllocation,
        shares: shares,
        current_price: latestPrice
      };
    }
    
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
    const sharesHeld = Object.values(portfolioComposition).map((comp: any) => comp.shares);
    
    // Storage for results
    const portfolioPaths: number[][] = Array(this.horizonDays + 1).fill(null).map(() => Array(this.numSimulations).fill(0));
    const individualPaths: { [ticker: string]: number[][] } = {};
    
    // Initialize individual paths storage
    for (const ticker of tickers) {
      individualPaths[ticker] = Array(this.horizonDays + 1).fill(null).map(() => Array(this.numSimulations).fill(0));
    }
    
    // Set initial values
    portfolioPaths[0].fill(totalValue);
    for (const ticker of tickers) {
      const tickerIndex = tickers.indexOf(ticker);
      individualPaths[ticker][0].fill(initialPrices[tickerIndex]);
    }
    
    // Monte Carlo simulation
    for (let sim = 0; sim < this.numSimulations; sim++) {
      let currentPrices = [...initialPrices];
      
      for (let day = 1; day <= this.horizonDays; day++) {
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
    
    // Calculate results
    const finalValues = portfolioPaths[this.horizonDays];
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
      const finalPrices = individualPaths[ticker][this.horizonDays];
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
      individualStockResults,
      portfolioComposition
    };
  }

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

  private percentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

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
}

export async function POST(request: NextRequest) {
  try {
    const body: SimulationRequest = await request.json();
    
    if (!body.positions || body.positions.length === 0) {
      return NextResponse.json(
        { error: 'No portfolio positions provided' },
        { status: 400 }
      );
    }

    // Validate positions
    for (const position of body.positions) {
      if (!position.ticker || !position.dollarAmount || position.dollarAmount <= 0) {
        return NextResponse.json(
          { error: 'Invalid position: ticker and positive dollar amount required' },
          { status: 400 }
        );
      }
    }

    const simulator = new PortfolioMonteCarloSimulator(
      body.positions,
      body.horizonYears || 1,
      body.numSimulations || 5000
    );

    const results = await simulator.runSimulation();

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { error: 'Simulation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
