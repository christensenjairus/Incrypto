/*
    THIS IS THE GUTS OF THE APP. IT CONTROLS WINDOWS, SETTINGS, BAR MENU, ETC. 
    You can run functions in this file from other files using IpcRenderer. (see example at end where we log in)
*/


const {app, BrowserWindow, Menu, MenuItem} = require('electron')
const shell = require('electron').shell
const {dialog} = require('electron')
const Store = require('electron-store')
const store = new Store({
    // name: "serverConfig.json"
})
var openInEditor = require('open-in-editor');
const {ipcMain} = require('electron')
// require('electron-reload')(__dirname) // this will allow electron to reload on changes

const path = require('path')
const url = require('url')

let codeEditor = store.get("codeEditor", "code"); // VS Code is the default

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
const windows = new Set();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    let width = store.get('windowWidth', 800); // use size of last use, but 800 is default
    let height = store.get('windowHeight', 600); // use size of last use, but 600 is default
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
        width: width,
        height: height,
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
                                {label: "VS Code",
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
                            }}
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
    editor.open('./javascript/Encryption.js:0:0').then(function() {
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

function switchToLoginPage() {
    replaceCurrentWindow("login.html")
}

function switchToRegistrationPage() {
    replaceCurrentWindow("register.html")
}

function switchToChatPage() {
    replaceCurrentWindow("index.html")
}

function createChildWindow(file) {
    let width = store.get('windowWidth', 800); // use size of last use, but 800 is default
    let height = store.get('windowHeight', 600); // use size of last use, but 600 is default
    childWindow = new BrowserWindow({
        width: width,
        height: height,
        // modal: true,
        show: false,
        parent: mainWindow, // Make sure to add parent window here
    
        // Make sure to add webPreferences with below configuration
        webPreferences: {
            preload: path.join(__dirname, './javascript/preload.js'),
            allowRunningInsecureContent: true, // this setting is not ideal, but for now, necessary
            nodeIntegration: true,
            contextIsolation: false,
            webgl: true,
            enableRemoteModule: true,
        },
    });
    
    // Child window loads settings.html file
    // childWindow.loadFile("settings.html");
    childWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'html/' + file),
        protocol: 'file:',
        slashes: true
    }))
    
    childWindow.once("ready-to-show", () => {
        childWindow.show();
    });

    childWindow.on('resize', () => {
        // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
        // the height, width, and x and y coordinates.
        let { width, height } = mainWindow.getBounds();
        
        // Now that we have them, save them using the `set` method.
        store.set('windowWidth', width);
        store.set('windowHeight', height);
    });

    // Open the DevTools.
    // childWindow.webContents.openDevTools(); // uncomment this for DevTools

    // Emitted when the window is closed.
    childWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        windows.delete(mainWindow)
        mainWindow = null
    })
}

function replaceCurrentWindow(file) {
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'html/' + file),
        protocol: 'file:',
        slashes: true
    }))
}

ipcMain.handle('login', async (event, someArgument) => {
    // const result = await doSomeWork(someArgument)
    switchToChatPage();
    // mainWindow.webContents.openDevTools(); // open dev tools on chat launch
    // return result
    return true;
})

let myName = false;

ipcMain.handle('getName', async (event, someArgument) => {
    return myName;
})

ipcMain.handle('setName', async (event, someArgument) => {
    myName = someArgument;
    console.log("name saved in main.js file: " + someArgument)
    return true;
})