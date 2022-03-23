/*
    THIS IS THE GUTS OF THE APP. IT CONTROLS WINDOWS, SETTINGS, BAR MENU, ETC. 
    You can run functions in this file from other files using IpcRenderer. (see example at end where we log in)
*/

const {app, BrowserWindow, Menu, MenuItem} = require('electron')
const shell = require('electron').shell
const {dialog} = require('electron')
const Store = require('electron-store')
const path = require('path');
// var cp = require('child_process');
const fs = require('fs')
const store = new Store({
    // name: "serverConfig.json"
})
var openInEditor = require('open-in-editor');
const {ipcMain} = require('electron')
require('electron-reload')(__dirname) // this will allow electron to reload on changes

var basepath = __dirname;
if (process.platform === "darwin") app.dock.setIcon(basepath + '/../icons/hacker-25899.png'); // set doc icon in macOS

// set app shortcuts
const createDesktopShortcut = require('create-desktop-shortcuts');
if (!((process.execPath).includes("node_modules/electron-prebuilt-compile/node_modules/electron/dist/electron"))) {
    // app is compiled
    try { // ADD TO APPLIATION LOOKUP SO ITS SEARCHABLE
        const AppAdd = createDesktopShortcut({
            windows: { filePath: app.getAppPath('exe') + '\\..\\..\\Incrypto.exe',
                outputPath: "%appdata%\\Microsoft\\Windows\\Start Menu\\Programs",
                name: 'Incrypto',
                comment: 'Encrypted Messaging App',
                icon: basepath + '/../icons/hacker-25899.ico', // windows needs ico
                workingDirectory: basepath,
                windowMode: "normal",
                arguments: '' }
        });
    } catch (e) {

    }
}

const url = require('url');
const { isTypeParameterDeclaration } = require('typescript');
app.setAppUserModelId("Incrypto");

let codeEditor = store.get("codeEditor", "code"); // VS Code is the default
let seeAllMessages = true;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
const windows = new Set();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    let width = store.get('windowWidth', 420); // use size of last use, but 120 is default
    let height = store.get('windowHeight', 720); // use size of last use, but 720 is default
    createWindow(width, height);
});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

function createWindow(width, height) {
    // Create the browser window.
    if (fs.existsSync(process.execPath + '.png')) { // to make sure AppImages can get the right ico file
        // console.log("AppImage detected")
        mainWindow = new BrowserWindow({
            webPreferences: {
                preload: path.join(__dirname, '../javascript/preload.js'),
                allowRunningInsecureContent: true, // this setting is not ideal, but for now, necessary
                nodeIntegration: true,
                contextIsolation: false,
                webgl: true,
                enableRemoteModule: true,
            },
            hasShadow: true,
            width: width,
            height: height,
            minWidth: 1000,
            minHeight: 800,
            icon: process.execPath + '.png', // for AppImage
            title: "Incrypto"
        }) 
    }
    else {
        // console.log("not an AppImage. Can grab picture file at " + basepath + '/../icons/hacker-25899.png')
        mainWindow = new BrowserWindow({
            webPreferences: {
                preload: path.join(__dirname, '../javascript/preload.js'),
                allowRunningInsecureContent: true, // this setting is not ideal, but for now, necessary
                nodeIntegration: true,
                contextIsolation: false,
                webgl: true,
                enableRemoteModule: true,
            },
            hasShadow: true,
            width: width,
            height: height,
            minWidth: 1000,
            minHeight: 800,
            icon: basepath + '/../icons/hacker-25899.png', // works in linux with a png! / windows with a png as well!
            title: "Incrypto"
        }) 
    } // macs icon is set near the top of this file

    // and load the index.html of the app.
    if (store.get("lastUser", "") == "") {
        mainWindow.loadURL(url.format({
            // pathname: path.join(__dirname, 'html/index.html'),
            pathname: path.join(__dirname, '../html/register.html'), // start with registration page if noone has logged in
            protocol: 'file:',
            slashes: true
        }))
    }
    else {
        mainWindow.loadURL(url.format({
            // pathname: path.join(__dirname, 'html/index.html'),
            pathname: path.join(__dirname, '../html/login.html'), // start with login page if previous user
            protocol: 'file:',
            slashes: true
        }))
    }

    mainWindow.on('resize', () => {
        // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
        // the height, width, and x and y coordinates.
        let { width, height } = mainWindow.getBounds();
        
        // Now that we have them, save them using the `set` method.
        if (width < 1000) {
            width = 1000;
        }
        if (height < 800) {
            height = 800;
        }
        store.set('windowWidth', width);
        store.set('windowHeight', height);
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open the DevTools.
    // mainWindow.webContents.openDevTools(); // uncomment this for DevTools

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        windows.delete(mainWindow)
        mainWindow = null
    })

    function createCustomMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {label: "Log in/Log out",
                        click() {
                            // app.relaunch(); // will make app relaunch the next time it closes
                            // app.quit();
                            switchToLoginPage();
                        }},
                    // {label: "Change Chatroom"},
                    {label: "Account Registration",
                        click() {
                            switchToRegistrationPage();
                        }},
                    {label: "Clear All Local Data",
                        click() {
                            store.clear();
                            fs.rmdir(__dirname + '/keys', { recursive: true }, (err) => {
                                if (err) {
                                    throw err;
                                }
                                else {
                                    console.log(`Keys were deleted!`);
                                    switchToLoginPage();
                                }
                            });
                        }},
                    // {label: "Get New Keys",
                    //     click() {
                    //         var path = "./keys/PrivateKey_" + myName;
                    //         var path2 = "./keys/PublicKey_" + myName;
                    //         try {
                    //             fs.unlinkSync(path);
                    //             fs.unlinkSync(path2)
                    //             console.log("Files removed:", path + ", " + path2);
                    //             switchToLoginPage();
                    //         } catch (err) {
                    //             console.error(err);
                    //         }
                    //     }},
                    {label: "Quit",
                        click() {
                            app.quit();}}
                ]
            },{
                label: 'Edit',
                submenu: [
                    {role: 'undo'},
                    {role: 'redo'},
                    {type: 'separator'},
                    {role: 'cut'},
                    {role: 'copy'},
                    {role: 'paste'}
                ]
                },{
                label: 'View',
                submenu: [
                    // { label: 'Theme',
                    //     click() {
                    //         // Enter Theme switcher here @Blake
                    //     }},
                    { role: 'reload'},
                    { role: 'toggledevtools'},
                    { type: 'separator'},
                    { role: 'resetzoom'},
                    { role: 'zoomin'},
                    { role: 'zoomout'},
                    { type: 'separator'},
                    {role: 'togglefullscreen'}
                ]
                },{
                role: 'window',
                submenu: [
                    {role: 'minimize'},
                    {role: 'close'}
                ]
                },
                // {
                //     label: 'Encryption',
                //     submenu: [
                //         {label: 'Change code editor',
                //             submenu: [
                //                 {label: "VS Code (default)",
                //                     click() {
                //                         codeEditor = "code"
                //                         store.set("codeEditor", "code");
                //                     }},
                //                 {label: "Visual Studio",
                //                     click() {
                //                         codeEditor = "visualstudio"
                //                         store.set("codeEditor", "visualstudio");
                //                     }},
                //                 {label: "Atom Editor",
                //                     click() {
                //                         codeEditor = "atom"
                //                         store.set("codeEditor", "atom");
                //                     }},
                //                 {label: "Sublime Text",
                //                     click() {
                //                         codeEditor = "sublime"
                //                         store.set("codeEditor", "sublime");
                //                     }},
                //                 {label: "Web Storm",
                //                     click() {
                //                         codeEditor = "webstorm"
                //                         store.set("codeEditor", "webstorm");
                //                     }},
                //                 {label: "Php Storm",
                //                     click() {
                //                         codeEditor = "phpstorm"
                //                         store.set("codeEditor", "phpstorm");
                //                     }},
                //                 {label: "Idea 14 CE",
                //                     click() {
                //                         codeEditor = "idea14ce"
                //                         store.set("codeEditor", "idea14ce");
                //                     }},
                //                 {label: "Vim (MacOS only)",
                //                     click() {
                //                         codeEditor = "vim"
                //                         store.set("codeEditor", "vim");
                //                     }},
                //                 {label: "Emacs (MacOS only)",
                //                     click() {
                //                         codeEditor = "emacs"
                //                         store.set("codeEditor", "emacs");
                //                     }}
                //             ]
                //         },
                        // {label: 'Enter Algorithm (for use before compilation)',
                        //     click() {
                        //         openEncryptionFileForEditing();
                        //     },
                        // },
                        // {label: 'Change your message encryption',
                        //     submenu: [
                        //         {label: "Default Encryption", click() {changeMessageEncryptionType("defaultEncryption")}},
                        //         {label: "Plain Text", click() {changeMessageEncryptionType("plain_text")}},
                        //         {label: "Binary", click() {changeMessageEncryptionType("binary")}},
                        //     ]
                        // }
                    // ]
                // },
                {
                    role: 'help',
                    submenu: [
                        {label: 'Learn More',
                            click() {
                                shell.openExternal("https://github.com/christensenjairus/Incrypto")
                            }}
                    ]
                }
            ]
            
            const menu = Menu.buildFromTemplate(template)
            Menu.setApplicationMenu(menu)
        }
        windows.add(mainWindow);
        createCustomMenu();
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function openEncryptionFileForEditing() {
    var editor = openInEditor.configure({
        editor: codeEditor
    });
    try {
        editor.open('./javascript/Encryption.js:52:4').then(function() {
            // console.log('Success!');
        }, function(err) {
            // console.error('Something went wrong: ' + err);
            const options = {
                type: 'question',
                buttons: ['I understand'],
                defaultId: 0,
                title: "Can't open that editor",
                message: "There's been an error with using this application. Try another one."
            }
            console.log(dialog.showMessageBox(null, options, (response) => {
            //can do something here with the response
            }))
        });
    } catch (e) {
        dialog.showMessageBox("This must be done before compilation (can't be done if already compiled)")
    }
}

function changeMessageEncryptionType(type) {
    store.set("encryptionType", type);
    EncryptionType = type;
    switchToChatPage();
}

function switchToLoginPage() {
    replaceCurrentWindow("login.html")
    // console.log("supposed to switch to login page here")
    // switchToLoginPage();
}

function switchToRegistrationPage() {
    replaceCurrentWindow("register.html")
}

function switchToChatPage() {
    replaceCurrentWindow("chat.html")
}

// function createChildWindow(file) {
//     let width = store.get('windowWidth', 800); // use size of last use, but 800 is default
//     let height = store.get('windowHeight', 600); // use size of last use, but 600 is default
//     childWindow = new BrowserWindow({
//         width: width,
//         height: height,
//         // modal: true,
//         show: false,
//         icon: basepath + '/icons/hacker-25899.png',
//         parent: mainWindow, // Make sure to add parent window here
    
//         // Make sure to add webPreferences with below configuration
//         webPreferences: {
//             preload: path.join(__dirname, './javascript/preload.js'),
//             allowRunningInsecureContent: true, // this setting is not ideal, but for now, necessary
//             nodeIntegration: true,
//             contextIsolation: false,
//             webgl: true,
//             enableRemoteModule: true,
//             hasShadow: true,
//         },
//     });
    
//     // Child window loads settings.html file
//     // childWindow.loadFile("settings.html");
//     childWindow.loadURL(url.format({
//         pathname: path.join(__dirname, 'html/' + file),
//         protocol: 'file:',
//         slashes: true
//     }))
    
//     childWindow.once("ready-to-show", () => {
//         childWindow.show();
//     });

//     childWindow.on('resize', () => {
//         // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
//         // the height, width, and x and y coordinates.
//         let { width, height } = mainWindow.getBounds();
        
//         // Now that we have them, save them using the `set` method.
//         store.set('windowWidth', width);
//         store.set('windowHeight', height);
//     });

//     // Open the DevTools.
//     // childWindow.webContents.openDevTools(); // uncomment this for DevTools

//     // Emitted when the window is closed.
//     childWindow.on('closed', function() {
//         // Dereference the window object, usually you would store windows
//         // in an array if your app supports multi windows, this is the time
//         // when you should delete the corresponding element.
//         windows.delete(mainWindow)
//         mainWindow = null
//     })
// }

function replaceCurrentWindow(file) {
    // mainWindow.loadURL(url.format({
    //     pathname: path.join(__dirname, 'html/' + file),
    //     protocol: 'file:',
    //     slashes: true
    // }))
    mainWindow.loadURL('file://' + __dirname + '/../html/' + file)
}

ipcMain.handle('login', async (event) => {
    switchToChatPage();
    // mainWindow.webContents.openDevTools(); // open dev tools on chat launch
    return;
})

ipcMain.handle('logout', (event) => {
    // const result = await doSomeWork(someArgument)
    switchToLoginPage();
    // mainWindow.loadFile('${ __dirname}/html/login.html');
    // console.log("should log you out now")
    // mainWindow.webContents.openDevTools(); // open dev tools on chat launch
    // return result

    // mainWindow.loadURL('file://' + __dirname + '/html/login.html')
})

ipcMain.handle('toregister', (event) => {
    // const result = await doSomeWork(someArgument)
    switchToRegistrationPage();
})

ipcMain.handle('forceLogout', (event) => {
    app.relaunch();
    app.exit();
})

let myName = false;
let myColor = false;

ipcMain.handle('getName', (event) => {
    return myName;
})

ipcMain.handle('setName', (event, name) => {
    myName = name;
    // console.log("name saved in main.js file: " + name)
    return true;
})

let EncryptionType = store.get("encryptionType", "Default_Encryption");
let sessionID = store.get(myName + "_sessionID", "")
let serverName = store.get("serverName");

ipcMain.handle('setEncryptionType', (event, name) => {
    EncryptionType = name;
    return true;
})

ipcMain.handle('setSessionID', (event, name) => {
    // console.log("sessionID set to " + name)
    sessionID = name;
    return true;
})

ipcMain.handle('getSessionID', (event) => {
    // console.log("sessionID grabbed")
    return sessionID;
})

ipcMain.handle('getServerName', (event) => {
    // console.log("serverName grabbed")
    return serverName;
})

ipcMain.handle('setServerName', (event, name) => {
    // console.log("serverName set to " + name)
    serverName = name;
    return true;
})

ipcMain.handle('getEncryptionType', (event) => {
    return EncryptionType;
})

ipcMain.handle('getColor', (event) => {
    // console.log("giving color: "+myColor)
    return myColor;
})

ipcMain.handle('setColor', (event, color) => {
    // myName = name;
    myColor = color;
    // console.log("color saved in main.js file: " + color)
    return true;
})

ipcMain.handle('setSeeAllMessages', (event, value) => {
    seeAllMessages = value;
    return;
})

ipcMain.handle('getSeeAllMessages', (event) => {
    return seeAllMessages;
})

let badgeCnt = 0;

app.on('browser-window-focus', (event, window) => {
    // window.$focus = true;
    // dockNotificationCache[window.id] = 0;
    // console.log("window has been focused on!")
    if (process.platform === 'darwin' ||
        (process.platform === 'linux' && app.isUnityRunning &&
        app.isUnityRunning())) {
        app.setBadgeCount(0);
        badgeCnt = 0;
    }
});

ipcMain.handle('incBadgeCnt', async (event, count) => {
    if (process.platform === 'darwin' ||
        (process.platform === 'linux' && app.isUnityRunning &&
        app.isUnityRunning())) {
        app.setBadgeCount(count + badgeCnt);
        badgeCnt += count;
    }
    if (process.platform === 'darwin') {
        app.dock.bounce(); // this doesn't work!
    }
    // app.dock.bounce(); // doesn't work either
    mainWindow.once('focus', () => mainWindow.flashFrame(false))
    mainWindow.flashFrame(true)
})

ipcMain.handle('setBadgeCnt', async (event, count) => {
    if (process.platform === 'darwin' ||
        (process.platform === 'linux' && app.isUnityRunning &&
        app.isUnityRunning())) {
        app.setBadgeCount(count);
        badgeCnt = 0;
    }
})

ipcMain.handle('changeMessageE_Type', (event, nameOfNewE_Type) => {
    changeMessageEncryptionType(nameOfNewE_Type);
})