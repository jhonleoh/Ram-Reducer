
#!/bin/bash
echo "Building RAM Optimizer for macOS..."
npm install
npm run dist:mac
echo "Build completed! Check the dist folder for the installer."
