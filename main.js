
const {app, BrowserWindow, Menu, MenuItem} = require('electron')
const shell = require('electron').shell
const {dialog} = require('electron')
// used for opening a script
var openInEditor = require('open-in-editor');

const path = require('path')
const url = require('url')

let codeEditor = "code";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        webPreferences: {
            allowRunningInsecureContent: true, // this setting is not ideal, but for now, necessary
            // nodeIntegration: true,
            // contextIsolation: false,
        },
        width: 1050,
        height: 620
    }) 

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'html/index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Open the DevTools.
    mainWindow.webContents.openDevTools(); // uncomment this for DevTools

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
                    // {label: "Log out",
                    //     click() {
                    //         app.relaunch(); // will make app relaunch the next time it closes
                    //         app.quit();}},
                    // {label: "Change Chatroom"},
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


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function openEncryptionFileForEditing() {
    var editor = openInEditor.configure({
        editor: codeEditor
    });
    editor.open('./javascript/Encryption.js:0:0').then(function() {
        console.log('Success!');
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