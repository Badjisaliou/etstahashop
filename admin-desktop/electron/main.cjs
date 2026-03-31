const { app, BrowserWindow, ipcMain, Notification } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log/main");

const isDev = !app.isPackaged;
const DEV_URL = "http://127.0.0.1:5174";
const ICON_PATH = isDev
  ? path.join(__dirname, "..", "build", "icons", "icon.ico")
  : path.join(process.resourcesPath, "icon.ico");

log.initialize();
log.transports.file.level = "info";
log.transports.console.level = isDev ? "debug" : "info";

process.on("uncaughtException", (error) => {
  log.error("Uncaught exception in main process", error);
});

process.on("unhandledRejection", (reason) => {
  log.error("Unhandled rejection in main process", reason);
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1100,
    minHeight: 720,
    icon: ICON_PATH,
    backgroundColor: "#f4f7fb",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
    return;
  }

  const indexPath = path.join(__dirname, "..", "web-dist", "index.html");
  mainWindow.loadFile(indexPath).catch((error) => {
    log.error("Failed to load packaged index.html", error);
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    log.error("Renderer process gone", details);
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    log.error("Renderer failed to load", { errorCode, errorDescription, validatedURL });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    log.info("Blocked window.open from renderer", { url });
    return { action: "deny" };
  });
}

function configureAutoUpdate() {
  if (isDev) {
    return;
  }

  autoUpdater.logger = log;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  const updateBaseUrl = process.env.ETS_DESKTOP_UPDATE_URL;
  if (updateBaseUrl) {
    autoUpdater.setFeedURL({
      provider: "generic",
      url: updateBaseUrl
    });
  }

  autoUpdater.on("checking-for-update", () => {
    log.info("Auto-update: checking for updates");
  });

  autoUpdater.on("update-available", (info) => {
    log.info("Auto-update: update available", info);
  });

  autoUpdater.on("update-not-available", (info) => {
    log.info("Auto-update: no update available", info);
  });

  autoUpdater.on("error", (error) => {
    log.error("Auto-update: error", error);
  });

  autoUpdater.on("download-progress", (progress) => {
    log.info("Auto-update: download progress", {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info("Auto-update: update downloaded, install on quit", info);
  });

  autoUpdater.checkForUpdates().catch((error) => {
    log.error("Auto-update: failed check", error);
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId("com.etstaha.admin.desktop");

  log.info("ETS Taha Admin desktop starting", {
    version: app.getVersion(),
    isDev
  });
  createWindow();
  configureAutoUpdate();

  ipcMain.on("renderer-error", (_event, payload) => {
    log.error("Renderer error reported", payload);
  });

  ipcMain.on("desktop-notification", (_event, payload) => {
    try {
      if (!Notification.isSupported()) {
        log.warn("Desktop notification is not supported on this OS");
        return;
      }

      const notification = new Notification({
        title: payload?.title || "ETS Taha Admin",
        body: payload?.body || "Nouvelle activite detectee.",
        icon: ICON_PATH,
        silent: false
      });

      notification.show();
      log.info("Desktop notification shown", payload);
    } catch (error) {
      log.error("Failed to show desktop notification", error);
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
