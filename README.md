# RAM Optimizer Pro

A powerful cross-platform desktop application to optimize and free up RAM on your system.

## Features

- Real-time memory usage monitoring with detailed statistics
- One-click RAM optimization for Windows, macOS, and Linux
- Memory usage trend visualization with interactive charts
- Top memory-consuming processes identification
- Clean and intuitive user interface

## Platform-Specific Optimizations

### Windows
- Clears standby list and working sets of running processes
- Releases memory using low-level system APIs
- Manages system caches efficiently
- Requires administrator rights for full functionality

### Linux
- Drops caches and buffers when run with appropriate permissions
- Performs memory compaction when available
- Monitors high-memory-consuming processes

### macOS
- Purges inactive memory
- Cleans up temporary files and system caches
- Requires admin rights for some operations

## Development

### Prerequisites

- Node.js 16+
- npm or bun

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/ram-optimizer-pro.git

# Navigate to the project directory
cd ram-optimizer-pro

# Install dependencies
npm install
# or
bun install
```

### Running in Development Mode

```bash
npm run dev
# or
bun run dev
```

### Building the Application

```bash
# For all platforms
npm run dist

# For Windows only
npm run dist:win

# For macOS only
npm run dist:mac

# For Linux only
npm run dist:linux
```

The packaged applications will be available in the `dist` directory.

## Usage Instructions

1. Launch the application
2. Review your current memory usage on the dashboard
3. Click the "Optimize RAM" button to free up memory
4. Monitor the memory usage trend and identify top memory consumers
5. For best results on Windows and Linux, run the application with administrator privileges

## License

MIT

## Disclaimer

This application performs system-level operations that may affect running processes. Use at your own risk. The developer is not responsible for any data loss or system instability caused by this application.
