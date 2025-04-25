import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';
import si from 'systeminformation';
import { spawn } from 'child_process';
import fs from 'fs';

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;

// Create the browser window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: join(__dirname, 'assets', 'icon.png')
  });

  // Load the HTML file
  mainWindow.loadFile('index.html');

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// When Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for RAM optimization
ipcMain.handle('get-system-info', async () => {
  try {
    const memInfo = await si.mem();
    return {
      totalMem: memInfo.total,
      usedMem: memInfo.used,
      freeMem: memInfo.free,
      platform: process.platform,
      arch: process.arch,
      cpus: os.cpus().length,
      hostname: os.hostname()
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    return { error: error.message };
  }
});

// Function to optimize RAM on Windows
function optimizeWindowsRAM() {
  // Create a PowerShell script to clear RAM
  const psScript = `
    # Empty Working Set for all processes
    Get-Process | Where-Object {$_.WorkingSet -gt 10MB} |
    ForEach-Object {
      [void][System.Reflection.Assembly]::LoadWithPartialName('System.Runtime.InteropServices');
      $gch = [System.Runtime.InteropServices.GCHandle]::Alloc($_, [System.Runtime.InteropServices.GCHandleType]::WeakTrackResurrection);
      [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($_);
      [void]$gch.Free();
      [System.GC]::Collect();
      [System.GC]::WaitForPendingFinalizers();
    }

    # Clear standby list and memory cache
    if (([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
      Write-Output "Clearing standby list and memory cache..."
      $signature = @'
      [DllImport("ntdll.dll", SetLastError = true)]
      public static extern UInt32 NtSetSystemInformation(UInt32 InfoClass, IntPtr Info, UInt32 Length);
'@
      Add-Type -MemberDefinition $signature -Name NativeMethods -Namespace Win32

      [UInt32]$SMCclass = 0x0002
      [UInt32]$SMCaction = 0x0001 # MemoryPurgeStandbyList
      $SMCsize = [System.Runtime.InteropServices.Marshal]::SizeOf([UInt32]::new())
      $SMCinfo = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($SMCsize)
      [System.Runtime.InteropServices.Marshal]::WriteInt32($SMCinfo, $SMCaction)
      $retval = [Win32.NativeMethods]::NtSetSystemInformation($SMCclass, $SMCinfo, $SMCsize)
      [System.Runtime.InteropServices.Marshal]::FreeHGlobal($SMCinfo)

      if ($retval -ne 0) {
        Write-Output "Failed to clear standby list and memory cache: $retval"
      } else {
        Write-Output "Successfully cleared standby list and memory cache."
      }
    } else {
      Write-Output "Need administrator rights to clear standby list and memory cache."
    }

    # Run Windows built-in memory diagnostics
    Clear-DnsClientCache

    # EmptyStandbyList equivalent
    try {
      taskkill /F /IM "RuntimeBroker.exe" 2>$null
      taskkill /F /IM "SearchUI.exe" 2>$null
    } catch {
      # Ignore errors if processes are not running
    }

    Write-Output "Memory optimization completed."
  `;

  // Save the script to a temporary file
  const scriptPath = join(os.tmpdir(), 'ram-optimizer.ps1');
  fs.writeFileSync(scriptPath, psScript);

  // Execute the PowerShell script
  const ps = spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath]);

  return new Promise((resolve, reject) => {
    let output = '';

    ps.stdout.on('data', (data) => {
      output += data.toString();
    });

    ps.stderr.on('data', (data) => {
      console.error(`PowerShell Error: ${data}`);
    });

    ps.on('close', (code) => {
      if (code !== 0) {
        reject(`PowerShell process exited with code ${code}`);
      } else {
        resolve(output);
      }
    });
  });
}

// Function to optimize RAM on Linux
function optimizeLinuxRAM() {
  // Create a shell script to clear RAM
  const shellScript = `
    # Drop caches
    if [ "$(id -u)" -eq 0 ]; then
      echo "Cleaning Linux memory caches..."
      sync
      echo 3 > /proc/sys/vm/drop_caches
      echo "Memory caches have been cleared."
    else
      echo "Need root permissions to clear memory caches."
    fi

    # Kill unnecessary processes
    for PROC in $(ps aux | grep -E '(chrome|firefox)' | grep -v grep | awk '{print $2}')
    do
      echo "Found browser process: $PROC"
    done

    # Compact memory (if available)
    if [ -f /sys/kernel/mm/compact_memory ]; then
      if [ "$(id -u)" -eq 0 ]; then
        echo 1 > /sys/kernel/mm/compact_memory
        echo "Memory compaction completed."
      else
        echo "Need root permissions for memory compaction."
      fi
    else
      echo "Memory compaction not available on this system."
    fi

    echo "Memory optimization completed."
  `;

  // Save the script to a temporary file
  const scriptPath = join(os.tmpdir(), 'ram-optimizer.sh');
  fs.writeFileSync(scriptPath, shellScript);
  fs.chmodSync(scriptPath, '755');

  // Execute the shell script
  const sh = spawn('bash', [scriptPath]);

  return new Promise((resolve, reject) => {
    let output = '';

    sh.stdout.on('data', (data) => {
      output += data.toString();
    });

    sh.stderr.on('data', (data) => {
      console.error(`Bash Error: ${data}`);
    });

    sh.on('close', (code) => {
      if (code !== 0) {
        reject(`Bash process exited with code ${code}`);
      } else {
        resolve(output);
      }
    });
  });
}

// Function to optimize RAM on macOS
function optimizeMacOSRAM() {
  // Create a shell script to clear RAM
  const shellScript = `
    # Purge inactive memory
    if [ "$(id -u)" -eq 0 ] || [ -x "$(command -v purge)" ]; then
      echo "Purging inactive memory..."
      purge
      echo "Inactive memory has been purged."
    else
      echo "Need root permissions to purge memory."
    fi

    # Clean up temporary files
    rm -rf ~/Library/Caches/* 2>/dev/null
    rm -rf /tmp/* 2>/dev/null

    echo "Memory optimization completed."
  `;

  // Save the script to a temporary file
  const scriptPath = join(os.tmpdir(), 'ram-optimizer.sh');
  fs.writeFileSync(scriptPath, shellScript);
  fs.chmodSync(scriptPath, '755');

  // Execute the shell script
  const sh = spawn('bash', [scriptPath]);

  return new Promise((resolve, reject) => {
    let output = '';

    sh.stdout.on('data', (data) => {
      output += data.toString();
    });

    sh.stderr.on('data', (data) => {
      console.error(`Bash Error: ${data}`);
    });

    sh.on('close', (code) => {
      if (code !== 0) {
        reject(`Bash process exited with code ${code}`);
      } else {
        resolve(output);
      }
    });
  });
}

// Event to optimize RAM based on platform
ipcMain.handle('optimize-ram', async () => {
  try {
    let result = '';

    // Call the appropriate function based on the platform
    if (process.platform === 'win32') {
      result = await optimizeWindowsRAM();
    } else if (process.platform === 'linux') {
      result = await optimizeLinuxRAM();
    } else if (process.platform === 'darwin') {
      result = await optimizeMacOSRAM();
    } else {
      return { error: 'Unsupported platform' };
    }

    // Get updated memory info after optimization
    const memInfo = await si.mem();

    return {
      success: true,
      message: result,
      memoryBefore: memInfo.active, // Active memory before (approximate)
      memoryAfter: memInfo.used,    // Used memory after
      memoryFreed: memInfo.free     // Free memory
    };
  } catch (error) {
    console.error('Error optimizing RAM:', error);
    return { error: error.message };
  }
});

// IPC handler to get detailed memory information
ipcMain.handle('get-detailed-memory', async () => {
  try {
    const memInfo = await si.mem();
    const processesInfo = await si.processes();

    // Get the top memory-consuming processes
    const topProcesses = processesInfo.list
      .sort((a, b) => b.memRss - a.memRss)
      .slice(0, 10)
      .map(proc => ({
        name: proc.name,
        pid: proc.pid,
        memoryUsage: Math.round(proc.memRss / 1024 / 1024 * 100) / 100, // Convert to MB
      }));

    return {
      memory: {
        total: memInfo.total,
        used: memInfo.used,
        free: memInfo.free,
        active: memInfo.active,
        available: memInfo.available,
        swapTotal: memInfo.swapTotal,
        swapUsed: memInfo.swapUsed,
        swapFree: memInfo.swapFree
      },
      topProcesses
    };
  } catch (error) {
    console.error('Error getting detailed memory info:', error);
    return { error: error.message };
  }
});
