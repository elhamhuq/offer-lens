#!/usr/bin/env node

/**
 * Simple wrapper to run the Monte Carlo simulation
 * This allows for proper user input when run from command line
 */

const { spawn } = require('child_process');
const path = require('path');

function main() {
    console.log('='.repeat(60));
    console.log('    Monte Carlo Stock Price Simulator');
    console.log('='.repeat(60));
    console.log('Starting simulation...\n');
    
    // Run the TypeScript simulation
    const scriptPath = path.join(__dirname, 'monte-carlo-sim.ts');
    const child = spawn('npx', ['tsx', scriptPath], {
        stdio: 'inherit',
        cwd: process.cwd()
    });
    
    child.on('close', (code) => {
        if (code === 0) {
            console.log('\n✅ Simulation completed successfully!');
            console.log('📁 Check the generated HTML file for visualizations.');
        } else {
            console.log(`\n❌ Simulation exited with code ${code}`);
        }
    });
    
    child.on('error', (error) => {
        console.error('❌ Error running simulation:', error);
    });
}

if (require.main === module) {
    main();
}
