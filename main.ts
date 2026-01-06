import { app, BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { autoUpdater } from "electron-updater";

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcessWithoutNullStreams | null = null;

const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.maximize();
  mainWindow.show();

  const indexHtmlPath = isDev
    ? path.join(__dirname, "../../FE/dist/index.html")
    : path.join(app.getAppPath(), "FE/dist/index.html");

  console.log("📂 UI Path:", indexHtmlPath);

  if (!fs.existsSync(indexHtmlPath)) {
    console.error("❌ UI file not found at:", indexHtmlPath);
  }

  mainWindow.loadFile(indexHtmlPath);

  mainWindow.webContents.on("did-fail-load", (_, code, desc, validatedURL) => {
    console.error("❌ Failed to load UI:", code, desc, "URL:", validatedURL);
  });
}

function startBackend() {
  let backendPath = isDev
    ? path.join(__dirname, "../../BE/dist/server.js")
    : path.join(process.resourcesPath, "app.asar.unpacked/BE/dist/server.js");

  console.log("🚀 Backend Path:", backendPath);

  if (!fs.existsSync(backendPath)) {
    console.error("❌ Backend file not found at:", backendPath);
    // Try fallback path if unpacked path fails
    const fallbackPath = path.join(app.getAppPath(), "BE/dist/server.js");
    console.log("尝试备选路径 (Fallback):", fallbackPath);
    if (fs.existsSync(fallbackPath)) {
      backendPath = fallbackPath;
    } else {
      return; // Don't try to spawn if not found
    }
  }

  backendProcess = spawn("node", [backendPath], {
    env: {
      ...process.env,
      // Pass DATABASE_URL if available or assume it exists in .env
    }
  });

  backendProcess.stdout.on("data", (data: Buffer) => {
    console.log("🟦 Backend:", data.toString());
  });

  backendProcess.stderr.on("data", (data: Buffer) => {
    console.error("🟥 Backend error:", data.toString());
  });

  backendProcess.on("error", (err) => {
    console.error("❌ Failed to start backend process:", err);
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
    // Check every 5 minutes
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 5 * 60 * 1000);
  }

  autoUpdater.on("checking-for-update", () => {
    console.log("🔍 Checking for update...");
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`console.log("Auto-updater: Checking for update...")`);
    }
  });

  autoUpdater.on("update-available", (info) => {
    console.log("✨ Update available:", info.version);
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`console.log("Auto-updater: ✨ Update available: ${info.version}")`);
    }
  });

  autoUpdater.on("update-not-available", (info) => {
    console.log("✅ Update not available.");
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`console.log("Auto-updater: ✅ Update not available.")`);
    }
  });

  autoUpdater.on("error", (err) => {
    console.error("❌ Error in auto-updater:", err);
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`console.error("Auto-updater ❌ Error: ${err.message}")`);
    }
  });

  autoUpdater.on("download-progress", (progressObj) => {
    let log_message = "Download speed: " + Math.round(progressObj.bytesPerSecond / 1024) + " KB/s";
    log_message = log_message + " - Downloaded " + Math.round(progressObj.percent) + "%";
    console.log(log_message);
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript(`console.log("Auto-updater: ⏳ Downloading: ${Math.round(progressObj.percent)}%")`);
    }
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("📦 Update downloaded; version:", info.version);
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript('alert("A new update has been downloaded and will be installed. The app will restart now.")');
    }
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 3000);
  });
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
