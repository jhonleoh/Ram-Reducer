import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';

// Update package.json with author and description
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.author = {
  name: "RAM Optimizer Developer",
  email: "dev@example.com"
};
packageJson.description = "A powerful utility to optimize and free up RAM on your system";

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with author and description');

// Create a simple build shell script
const windowsBuildScript = `
@echo off
echo Building RAM Optimizer for Windows...
call npm install
call npm run dist:win
echo Build completed! Check the dist folder for the installer.
pause
`;

const linuxBuildScript = `
#!/bin/bash
echo "Building RAM Optimizer for Linux..."
npm install
npm run dist:linux
echo "Build completed! Check the dist folder for the installer."
`;

const macBuildScript = `
#!/bin/bash
echo "Building RAM Optimizer for macOS..."
npm install
npm run dist:mac
echo "Build completed! Check the dist folder for the installer."
`;

fs.writeFileSync(path.join(process.cwd(), 'build-windows.bat'), windowsBuildScript);
fs.writeFileSync(path.join(process.cwd(), 'build-linux.sh'), linuxBuildScript);
fs.writeFileSync(path.join(process.cwd(), 'build-mac.sh'), macBuildScript);

// Make the shell scripts executable
try {
  exec('chmod +x build-linux.sh build-mac.sh', (error) => {
    if (error) {
      console.error('Error making scripts executable:', error);
    } else {
      console.log('✅ Created build scripts for Windows, Linux, and macOS');
    }
  });
} catch (error) {
  console.error('Error:', error);
}

console.log('\n🚀 Setup completed!');
console.log('\nTo build on Windows:');
console.log('1. Double-click build-windows.bat');
console.log('\nTo build on Linux:');
console.log('1. Open terminal in this directory');
console.log('2. Run: ./build-linux.sh');
console.log('\nTo build on macOS:');
console.log('1. Open terminal in this directory');
console.log('2. Run: ./build-mac.sh');
