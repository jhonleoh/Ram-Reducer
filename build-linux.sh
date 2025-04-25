
#!/bin/bash
echo "Building RAM Optimizer for Linux..."
npm install
npm run dist:linux
echo "Build completed! Check the dist folder for the installer."
