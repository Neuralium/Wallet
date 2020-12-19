import { app, BrowserWindow, screen, ipcMain, globalShortcut, remote } from 'electron';
import {join} from 'path';
import {format} from 'url';


let win: BrowserWindow = null, serve;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

function createWindow() {

  const electronScreen = screen;
  const isMac = process.platform === 'darwin';
  //const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    //width: size.width,
    // height: size.height,
    width: 1500,
    height: 900,
    center: true,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve) ? true : false,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: join(__dirname, '/assets/icons/Icon-512x512.png')

  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });

    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(format({
      pathname: join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  win.once('close', (event) => {
    event.preventDefault();
    (<any>event).sender.send('quit');
    ipcMain.once('ok-quit', () => {
      win.close();
    });
  });



  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

}

try {

  app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {

      event.preventDefault();

    });

    contents.on('new-window', async (event, navigationUrl) => {

      event.preventDefault();
      // do nothing.
    });
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', () => {
    setTimeout(createWindow, 400);

    
    globalShortcut.register('Shift+CommandOrControl+I', () => {
      console.log('Shift+CommandOrControl+I was pressed');
      win.webContents.openDevTools();
    });

    globalShortcut.register('CommandOrControl+R', () => {
      console.log('CommandOrControl+R was pressed');
      win.webContents.reload();
    });

    globalShortcut.register('CommandOrControl+Shift+R', () => {
      console.log('CommandOrControl+Shift+R was pressed');

      win.webContents.reloadIgnoringCache();
    });
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}
