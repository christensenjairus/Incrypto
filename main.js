/*
    THIS IS THE GUTS OF THE APP. IT CONTROLS WINDOWS, SETTINGS, BAR MENU, ETC. 
    You can run functions in this file from other files using IpcRenderer. (see example at end where we log in)
*/


const {app, BrowserWindow, Menu, MenuItem} = require('electron')
const shell = require('electron').shell
const {dialog} = require('electron')
const Store = require('electron-store')
// const fs = require('fs')
const store = new Store({
    // name: "serverConfig.json"
})
var openInEditor = require('open-in-editor');
const {ipcMain} = require('electron')
require('electron-reload')(__dirname) // this will allow electron to reload on changes

// set app shortcuts
const createDesktopShortcut = require('create-desktop-shortcuts');
var basepath = __dirname;
const linuxAppAdd = createDesktopShortcut({
    linux: {
        filePath: basepath + '/JustRun.sh',
        outputPath: '~/.local/share/applications/',
        name: 'Incrypto',
        type: 'Application',
        terminal: false,
        chmod: true,
        icon: basepath + '/icons/hacker-25899.png',
        comment: "Encrypted Messaging App" 
    }
});
const desktopShortcutsCreated = createDesktopShortcut({
    windows: { filePath: 'C:\\Windows\\System32\\cmd.exe'/*filePath: basepath + '/JustRun.bat'*/,
                name: 'Incrypto',
                comment: 'Encrypted Messaging App',
                icon: basepath + '/icons/hacker-25899.ico',
                workingDirectory: basepath,
                windowMode: "normal",
                arguments: '/k JustRun.bat start /max' },
    linux:   { filePath: basepath + '/JustRun.sh',
                name: 'Incrypto',
                type: 'Application',
                terminal: false,
                chmod: true,
                icon: basepath + '/icons/hacker-25899.png',
                comment: "Encrypted Messaging App" 
            },
    osx:     { filePath: basepath + '/JustRun.sh',
                name: 'Incrypto',
                overwrite: true     }
});
if (desktopShortcutsCreated && linuxAppAdd) {
    console.log('Setting desktop icons worked correctly!');
} else {
    console.log('Could not create the icon or set its permissions (in Linux if "chmod" is set to true, or not set)');
}

const path = require('path')
const url = require('url')
// app.setAppUserModelId(process.execPath); // during development only?
app.setAppUserModelId("Incrypto");
// app.setBadgeCount(1);

let codeEditor = store.get("codeEditor", "code"); // VS Code is the default

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
    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, './javascript/preload.js'),
            allowRunningInsecureContent: true, // this setting is not ideal, but for now, necessary
            nodeIntegration: true,
            contextIsolation: false,
            webgl: true,
            enableRemoteModule: true,
        },
        hasShadow: true,
        width: width,
        height: height,
        minWidth: 320,
        minHeight: 600,
        icon: basepath + '/icons/hacker-25899.png',
        title: "Incrypto"
    }) 

    // and load the index.html of the app.
    if (store.get("lastUser", "") == "") {
        mainWindow.loadURL(url.format({
            // pathname: path.join(__dirname, 'html/index.html'),
            pathname: path.join(__dirname, 'html/register.html'), // start with registration page if noone has logged in
            protocol: 'file:',
            slashes: true
        }))
    }
    else {
        mainWindow.loadURL(url.format({
            // pathname: path.join(__dirname, 'html/index.html'),
            pathname: path.join(__dirname, 'html/login.html'), // start with login page if previous user
            protocol: 'file:',
            slashes: true
        }))
    }

    mainWindow.on('resize', () => {
        // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
        // the height, width, and x and y coordinates.
        let { width, height } = mainWindow.getBounds();
        
        // Now that we have them, save them using the `set` method.
        if (width < 320) {
            width = 320;
        }
        if (height < 600) {
            height = 600;
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
                            switchToLoginPage();
                        }},
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
                    { label: 'Theme',
                        click() {
                            // Enter Theme switcher here @Blake
                        }},
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
                },{
                    label: 'Encryption',
                    submenu: [
                        {label: 'Change code editor',
                            submenu: [
                                {label: "VS Code (default)",
                                    click() {
                                        codeEditor = "code"
                                        store.set("codeEditor", "code");
                                    }},
                                {label: "Visual Studio",
                                    click() {
                                        codeEditor = "visualstudio"
                                        store.set("codeEditor", "visualstudio");
                                    }},
                                {label: "Atom Editor",
                                    click() {
                                        codeEditor = "atom"
                                        store.set("codeEditor", "atom");
                                    }},
                                {label: "Sublime Text",
                                    click() {
                                        codeEditor = "sublime"
                                        store.set("codeEditor", "sublime");
                                    }},
                                {label: "Web Storm",
                                    click() {
                                        codeEditor = "webstorm"
                                        store.set("codeEditor", "webstorm");
                                    }},
                                {label: "Php Storm",
                                    click() {
                                        codeEditor = "phpstorm"
                                        store.set("codeEditor", "phpstorm");
                                    }},
                                {label: "Idea 14 CE",
                                    click() {
                                        codeEditor = "idea14ce"
                                        store.set("codeEditor", "idea14ce");
                                    }},
                                {label: "Vim (MacOS only)",
                                    click() {
                                        codeEditor = "vim"
                                        store.set("codeEditor", "vim");
                                    }},
                                {label: "Emacs (MacOS only)",
                                    click() {
                                        codeEditor = "emacs"
                                        store.set("codeEditor", "emacs");
                                    }}
                                    
                            ]
                        },
                        {label: 'Enter algorithm',
                            click() {
                                openEncryptionFileForEditing();
                            },
                        },
                        // {label: 'Change your message encryption',
                        //     submenu: [
                        //         {label: "Default Encryption", click() {changeMessageEncryptionType("defaultEncryption")}},
                        //         {label: "Plain Text", click() {changeMessageEncryptionType("plain_text")}},
                        //         {label: "Binary", click() {changeMessageEncryptionType("binary")}},
                        //     ]
                        // }

                    ]
                },{
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
    editor.open('./javascript/Encryption.js:52:4').then(function() {
        // console.log('Success!');
    }, function(err) {
        // console.error('Something went wrong: ' + err);
        const options = {
            type: 'question',
            buttons: ['I understand'],
            defaultId: 0,
            title: "Can't open that editor",
            message: "You don't seem to have the selected code editor installed"
        }
        console.log(dialog.showMessageBox(null, options, (response) => {
        //can do something here with the response
        }))
    });
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
    mainWindow.loadURL('file://' + __dirname + '/html/' + file)
}

ipcMain.handle('login', async (event, someArgument) => {
    // const result = await doSomeWork(someArgument)
    switchToChatPage();
    // mainWindow.webContents.openDevTools(); // open dev tools on chat launch
    // return result
    return true;
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

ipcMain.handle('forceLogout', (event) => {
    app.relaunch();
    app.exit();
})

let myName = false;
let myColor = false;

ipcMain.handle('getName', (event, someArgument) => {
    return myName;
})

ipcMain.handle('setName', (event, name) => {
    myName = name;
    // console.log("name saved in main.js file: " + name)
    return true;
})

let EncryptionType = store.get("encryptionType", "Default_Encryption");

ipcMain.handle('setEncryptionType', (event, name) => {
    EncryptionType = name;
    return true;
})

ipcMain.handle('getEncryptionType', (someArgument) => {
    return EncryptionType;
})

ipcMain.handle('getColor', (event, someArgument) => {
    // console.log(myColor + ' grabbed')
    return myColor;
})

ipcMain.handle('setColor', (event, color) => {
    // myName = name;
    myColor = color;
    // console.log("color saved in main.js file: " + color)
    return true;
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