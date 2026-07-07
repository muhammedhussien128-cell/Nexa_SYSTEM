const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
    title: "NEXA Accounts Receivable Engine",
    icon: path.join(__dirname, 'assets', 'icon.png') // Make sure to add an icon later if needed
  });

  // Start the Express server
  serverProcess = spawn('node', [path.join(__dirname, 'src', 'server.js')]);

  serverProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
    // Once we see the server is running, load the URL
    if (data.toString().includes('Server running on port 5000')) {
      mainWindow.loadURL('http://localhost:5000');
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });

  // Fallback if the server starts too fast before we catch stdout
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:5000').catch(err => console.log('Waiting for server...'));
  }, 2000);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Kill the Express server when the Electron app closes
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
