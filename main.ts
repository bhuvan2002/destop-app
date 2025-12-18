import { app, BrowserWindow } from "electron";
import path from "path";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { autoUpdater } from "electron-updater";

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcessWithoutNullStreams | null = null;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Don't show until maximized
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Maximize the window
  mainWindow.maximize();
  mainWindow.show();

  const indexHtmlPath = path.join(
    __dirname,
    "../../FE/dist/index.html"
  );

  mainWindow.loadFile(indexHtmlPath);

  mainWindow.webContents.on("did-fail-load", (_, code, desc) => {
    console.error("❌ Failed to load UI:", code, desc);
  });
}

function startBackend() {
  const backendPath = path.join(
    __dirname,
    "../../BE/dist/server.js"
  );

  backendProcess = spawn("node", [backendPath]);

  backendProcess.stdout.on("data", (data: Buffer) => {
    // Optional: Log backend output if needed, or silence it
    // console.log("🟦 Backend:", data.toString());
  });

  backendProcess.stderr.on("data", (data: Buffer) => {
    console.error("🟥 Backend error:", data.toString());
  });

  backendProcess.on("exit", (code: number | null) => {
    console.log("⚠ Backend exited with code:", code);
  });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on("window-all-closed", () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
