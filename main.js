
const {app, BrowserWindow, Menu, MenuItem} = require('electron')
const shell = require('electron').shell
const {dialog} = require('electron')
const Store = require('electron-store')
const store = new Store()
// const appConfig = require('electron-settings')
// used for opening a script
var openInEditor = require('open-in-editor');
const {ipcMain} = require('electron')

const path = require('path')
const url = require('url')

let codeEditor = "code";

// const store = new Store({
//     // We'll call our data file 'user-preferences'
//     configName: 'user-preferences',
//     defaults: {
//       // 800x600 is the default size of our window
//         windowBounds: { width: 800, height: 600 },
//         username: ""
//     }
// });

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

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

function createWindow(width, height, bounds) {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, './javascript/preload.js'),
            allowRunningInsecureContent: true, // this setting is not ideal, but for now, necessary
            nodeIntegration: true,
            contextIsolation: false,
        },
        // width: 1050,
        // height: 620
        width: width,
        height: height,
        windowBounds: bounds
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

    // Open the DevTools.
    // mainWindow.webContents.openDevTools(); // uncomment this for DevTools

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })

    function createCustomMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {label: "Log out",
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
                    {label: "Clear All Local User Data",
                        click() {
                            store.clear();
                            switchToRegistrationPage();
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
                                    }},
                                {label: "Visual Studio",
                                    click() {
                                        codeEditor = "visualstudio"
                                    }},
                                {label: "Atom Editor",
                                    click() {
                                        codeEditor = "atom"
                                    }},
                                {label: "Sublime Text",
                                    click() {
                                        codeEditor = "sublime"
                                    }},
                                {label: "Web Storm",
                                    click() {
                                        codeEditor = "webstorm"
                                    }},
                                {label: "Php Storm",
                                    click() {
                                        codeEditor = "phpstorm"
                                    }},
                                {label: "Idea 14 CE",
                                    click() {
                                        codeEditor = "idea14ce"
                                    }},
                                {label: "Vim (MacOS only)",
                                    click() {
                                        codeEditor = "vim"
                                    }},
                                {label: "Emacs (MacOS only)",
                                    click() {
                                        codeEditor = "emacs"
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
                        {label: 'Learn More'}
                    ]
                }
            ]
            
            const menu = Menu.buildFromTemplate(template)
            Menu.setApplicationMenu(menu)
        }
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
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'html/login.html'),
        protocol: 'file:',
        slashes: true
    }))
}

function switchToRegistrationPage() {
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'html/register.html'),
        protocol: 'file:',
        slashes: true
    }))
}