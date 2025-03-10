#!/usr/bin/env node

/**
 * This script helps find your computer's IP address for connecting
 * your mobile device to the backend API during development.
 */

const os = require('os');
const interfaces = os.networkInterfaces();
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
  },
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
  }
};

console.log(`\n${colors.bright}${colors.fg.cyan}=== Isidor IP Address Finder ===${colors.reset}\n`);
console.log(`This script helps you find your computer's IP address for connecting`);
console.log(`your mobile device to the backend API during development.\n`);

let ipAddresses = [];

// Get all network interfaces
Object.keys(interfaces).forEach((interfaceName) => {
  const networkInterface = interfaces[interfaceName];
  
  // Skip loopback and non-IPv4 interfaces
  networkInterface.forEach((iface) => {
    if (iface.family === 'IPv4' && !iface.internal) {
      ipAddresses.push({
        name: interfaceName,
        address: iface.address
      });
    }
  });
});

if (ipAddresses.length === 0) {
  console.log(`${colors.fg.red}No network interfaces found.${colors.reset}`);
  console.log(`Make sure you're connected to a network.`);
} else {
  console.log(`${colors.bright}Found ${ipAddresses.length} network interface(s):${colors.reset}\n`);
  
  ipAddresses.forEach((ip, index) => {
    console.log(`${colors.fg.green}${index + 1}. ${ip.name}: ${colors.bright}${ip.address}${colors.reset}`);
  });
  
  console.log(`\n${colors.bright}${colors.fg.yellow}How to use this IP address:${colors.reset}\n`);
  console.log(`1. Open ${colors.fg.cyan}mobile/services/api.ts${colors.reset}`);
  console.log(`2. Find the line: ${colors.fg.cyan}const MANUAL_IP = null;${colors.reset}`);
  console.log(`3. Replace it with: ${colors.fg.cyan}const MANUAL_IP = '${ipAddresses[0].address}';${colors.reset}`);
  console.log(`4. Save the file and restart the Expo development server\n`);
  
  console.log(`${colors.bright}${colors.fg.yellow}To run this script again:${colors.reset}\n`);
  console.log(`${colors.fg.cyan}node scripts/find-ip.js${colors.reset}\n`);
} 