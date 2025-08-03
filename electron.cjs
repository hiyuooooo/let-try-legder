const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

// Simple isDev check
const isDev = process.env.NODE_ENV === "development";

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "assets/icon.png"), // Add your app icon
    show: false,
  });

  // Load the app
  let startUrl;
  if (isDev) {
    startUrl = "http://localhost:8080";
  } else {
    // Try multiple possible paths for the web files
    const possiblePaths = [
      path.join(process.resourcesPath, "web/index.html"),
      path.join(__dirname, "../web/index.html"),
      path.join(__dirname, "../../web/index.html"),
      path.join(__dirname, "../../../web/index.html"),
      path.join(process.resourcesPath, "app/web/index.html"),
      path.join(process.resourcesPath, "app/dist/web/index.html")
    ];

    let webPath = null;
    console.log("Looking for web files in:", possiblePaths);

    for (const testPath of possiblePaths) {
      console.log("Checking path:", testPath, "exists:", fs.existsSync(testPath));
      if (fs.existsSync(testPath)) {
        webPath = testPath;
        console.log("Found web files at:", webPath);
        break;
      }
    }

    if (!webPath) {
      console.error("Could not find web files! Using fallback...");
      webPath = possiblePaths[0]; // fallback
    }

    startUrl = `file://${webPath}`;
    console.log("Final URL:", startUrl);
  }

  mainWindow.loadURL(startUrl);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Create application menu
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New Entry",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow.webContents.send("menu-new-entry");
          },
        },
        {
          label: "Import Excel",
          accelerator: "CmdOrCtrl+I",
          click: () => {
            mainWindow.webContents.send("menu-import-excel");
          },
        },
        {
          label: "Export PDF",
          accelerator: "CmdOrCtrl+P",
          click: () => {
            mainWindow.webContents.send("menu-export-pdf");
          },
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator: "CmdOrCtrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forcereload" },
        { role: "toggledevtools" },
        { type: "separator" },
        { role: "resetzoom" },
        { role: "zoomin" },
        { role: "zoomout" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About Ledger App",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About Ledger App",
              message: "Ledger Management System",
              detail: "Version 1.0.0\nBuilt with Electron and React",
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle file operations
ipcMain.handle("save-file", async (event, data) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `ledger-backup-${new Date().toISOString().split("T")[0]}.json`,
    filters: [
      { name: "JSON Files", extensions: ["json"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!result.canceled) {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
    return { success: true, path: result.filePath };
  }

  return { success: false };
});

ipcMain.handle("open-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [
      { name: "JSON Files", extensions: ["json"] },
      { name: "Excel Files", extensions: ["xlsx", "xls"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const content = fs.readFileSync(result.filePaths[0], "utf8");
    return { success: true, content, path: result.filePaths[0] };
  }

  return { success: false };
});
