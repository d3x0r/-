'use strict';

const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
console.log( app );
  app.commandLine.appendSwitch('ignore-certificate-errors' );
  //--client-certificate=path



function createWindow () {
  // Create the browser window.
  var pos_val = process.env.DISPLAY_POS;
  if( pos_val == undefined )
    pos_val = "0,0,800,600";
  var pos_array = pos_val.split(',');
  //var _x = Number(process.env.POS_X);
  //var _y = Number(process.env.POS_Y);
  //var _width = Number(process.env.SCREEN_WIDTH);
  //var _height = Number(process.env.SCREEN_HEIGHT);
  var _x = Number(pos_array[0]);
  var _y = Number(pos_array[1]);
  var _width = Number(pos_array[2]);
  var _height = Number(pos_array[3]);
  //mainWindow = new BrowserWindow({x:_x, y:_y, width:_width, height:_height, transparent:true, frame:false, alwaysOnTop:true });
  //mainWindow = new BrowserWindow({x:_x, y:_y, width:_width, height:_height, transparent:true, frame:true, alwaysOnTop:false });
  //mainWindow = new BrowserWindow({x:0, y:0, width:1920, height:1080, transparent:true, frame:false, alwaysOnTop:true });
  mainWindow = new BrowserWindow({x:0, y:0, width:1920, height:1080, transparent:true, frame:false });
  //mainWindow = new BrowserWindow({transparent:true, frame:false, width: 800, height: 600});
  //mainWindow = new BrowserWindow({transparent:true, frame:false, fullscreen:true, alwaysOnTop:true });
  //mainWindow = new BrowserWindow({transparent:true, fullscreen:true });

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});
