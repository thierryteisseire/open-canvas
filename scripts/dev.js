#!/usr/bin/env node

/**
 * Unified development script for Open Canvas
 * Starts both LangGraph server and Next.js frontend with a single command
 */

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes for better logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

const prefix = {
  langgraph: `${colors.cyan}${colors.bright}[LangGraph]${colors.reset}`,
  nextjs: `${colors.green}${colors.bright}[Next.js]${colors.reset}`,
  system: `${colors.magenta}${colors.bright}[System]${colors.reset}`,
};

let langgraphProcess = null;
let nextjsProcess = null;
let isShuttingDown = false;

/**
 * Spawn a process with proper logging
 */
function spawnProcess(name, command, args, cwd, prefixLabel) {
  console.log(`${prefix.system} Starting ${name}...`);
  
  const proc = spawn(command, args, {
    cwd,
    stdio: 'pipe',
    shell: false, // Changed from true to false to avoid shell issues
    env: { ...process.env },
  });

  // Handle stdout
  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${prefixLabel} ${line}`);
    });
  });

  // Handle stderr
  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${prefixLabel} ${colors.yellow}${line}${colors.reset}`);
    });
  });

  // Handle process exit
  proc.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      console.log(`${prefixLabel} ${colors.red}Process exited with code ${code} and signal ${signal}${colors.reset}`);
      cleanup(1);
    }
  });

  // Handle process errors
  proc.on('error', (err) => {
    console.error(`${prefixLabel} ${colors.red}Error: ${err.message}${colors.reset}`);
    cleanup(1);
  });

  return proc;
}

/**
 * Cleanup function to kill all processes
 */
function cleanup(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${prefix.system} Shutting down...`);

  if (langgraphProcess) {
    console.log(`${prefix.system} Stopping LangGraph server...`);
    langgraphProcess.kill('SIGTERM');
  }

  if (nextjsProcess) {
    console.log(`${prefix.system} Stopping Next.js server...`);
    nextjsProcess.kill('SIGTERM');
  }

  // Force exit after 2 seconds if processes don't stop gracefully
  setTimeout(() => {
    if (langgraphProcess) langgraphProcess.kill('SIGKILL');
    if (nextjsProcess) nextjsProcess.kill('SIGKILL');
    process.exit(exitCode);
  }, 2000);
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║              🚀 Open Canvas Dev Server 🚀             ║');
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  console.log(`${prefix.system} Starting all services...\n`);

  const rootDir = path.resolve(__dirname, '..');
  const agentsDir = path.join(rootDir, 'apps', 'agents');
  const webDir = path.join(rootDir, 'apps', 'web');

  // Start LangGraph server
  langgraphProcess = spawnProcess(
    'LangGraph Server',
    process.execPath, // Use node directly
    [path.join(rootDir, 'node_modules', '.bin', 'langgraphjs'), 'dev', '--port', '54367', '--config', '../../langgraph.json', '--no-browser'],
    agentsDir,
    prefix.langgraph
  );

  // Wait a bit for LangGraph to start, then start Next.js
  setTimeout(() => {
    nextjsProcess = spawnProcess(
      'Next.js Frontend',
      process.execPath, // Use node directly
      [path.join(rootDir, 'node_modules', '.bin', 'next'), 'dev'],
      webDir,
      prefix.nextjs
    );

    // Print ready message after both are started
    setTimeout(() => {
      console.log(`\n${colors.bright}${colors.green}╔═══════════════════════════════════════════════════════╗${colors.reset}`);
      console.log(`${colors.bright}${colors.green}║                                                       ║${colors.reset}`);
      console.log(`${colors.bright}${colors.green}║                   ✨ Ready! ✨                        ║${colors.reset}`);
      console.log(`${colors.bright}${colors.green}║                                                       ║${colors.reset}`);
      console.log(`${colors.bright}${colors.green}╚═══════════════════════════════════════════════════════╝${colors.reset}`);
      console.log(`\n${prefix.system} Services running:`);
      console.log(`  ${colors.cyan}🚀 LangGraph API:${colors.reset}     http://localhost:54367`);
      console.log(`  ${colors.cyan}🎨 LangGraph Studio:${colors.reset}  https://smith.langchain.com/studio?baseUrl=http://localhost:54367`);
      console.log(`  ${colors.green}🌐 Next.js App:${colors.reset}       http://localhost:3000`);
      console.log(`\n${prefix.system} Press ${colors.bright}Ctrl+C${colors.reset} to stop all services\n`);
    }, 3000);
  }, 2000);

  // Handle termination signals
  process.on('SIGINT', () => cleanup(0));
  process.on('SIGTERM', () => cleanup(0));
  process.on('exit', () => cleanup(0));
}

// Run the script
main();
