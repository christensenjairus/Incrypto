# Incrypto

Incrypto is a cross-platform Electron-based messaging app (both server and client) that allows you to make and use your own encryption algorithms. It's built using electron, Bootstrap, JavaScript, CSS, HTML, Node, and websockets that communicate with JSON.

**Supported platforms: Windows, Linux, MacOS.**

## Getting Started
### Incrypto can be used in two ways.
1. **Quick**: Run it from the terminal. This is great for making and debugging encryption algorithms.
2. **Recommended**: Run the app but eventually make your own installer. *You should recompile it* ***after*** *you edit* `encryption.js`. **Ease of use long term**.
   * This is recommended because it offers the full flexibility of Incrypto, including being able to run like any other app (Desktop Icons, Start Menu, etc)
   * It also enables you to distrubute your custom compiled packages so that your friends can easily have your encryption/decryption algorithms without having to go through the trouble of copying and pasting from `encryption.js` (which they will be able to see if they look for it, in most cases)

### Prerequisite packages
You'll need Node.js and NPM in order to run the app. Git is optional (for cloning this repository, not downloading it)

**Remember to run the following commands in order of appearance**

**For Mac and Windows** use these links and install and NodeJS and Git (optional) on your computer.
* [Node.js](https://nodejs.org/en/download/current/) (comes with [npm](http://npmjs.com)) 
   * Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.
* [Git](https://git-scm.com) (when installing, the default options are fine))

**For Linux**, use these commands to install NodeJS and Git
```bash
#  -> (on Ubuntu)
        sudo apt install aptitude
        sudo aptitude install nodejs npm git
#  -> (on Manjaro)
        sudo pacman -S nodejs npm git
#  -> (on CentOS/Redhat)
        sudo yum install nodejs npm git
        
# Now, update Node and NPM to the latest stable version globally
        sudo npm install -g n
        sudo n stable
# Now, close this shell. This is important because the current shell will remember the old location of npm, which we don't want.
```

#### Download this repository
You can do this in 2 ways
1. Click the download button on Github OR
2. Run the following command
```bash
git clone https://github.com/christensenjairus/Incrypto.git
```
#### Run Incrypto
* Open a terminal (or powershell) and navigate using `cd` to the Incrypto folder that you've just downloaded. Enter it with `cd Incrypto`
* Run `npm i` to install the node_modules.
* Then, you can run it using **either** electron (non compile) or electron-forge (compile).
	* `electron .` will simply run it. You'll need electron installed globally for this. Install it with `npm i -g electron` and then `electron .` will run the app.
	* `electron-forge` will compile it first. Run `npm i -g electron-forge` to install the compilation engine allowing `npm start` to function. Then run `npm start` to run the app.

On Windows, you may need to enable scripts to be run in order for this to work

        `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force`

These commands will ***not install*** the app, only *run* it, which is great for manipulating the `encryption.js` file (see "Encryption File and Rules" below)

#### To Package & Install Incrypto (Making your own Installer)
Each operating system (Linux, Windows, MacOS) can compile binaries for their own OS.
* RPMs (Linux), DEBs (Linux), and EXEs (Windows) will need Electron-Forge installed globally

    `npm i -g electron-forge`
   * On Windows, you may need to enable scripts to be run in order for this to work

        `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force`
* DMGs (MacOS), AppImages (Linux), and Snaps (Linux) can be created with Electron-Builder

    `npm i -g electron-builder`

More details and instructions on compilation are given below

* **On Linux**
   * **To make DEB & RPM**: You may wish to comment out one of the two compilation options in package.json. By default, it **has both DEB & RPM.** If you don't want one of these compilation options, **edit the linux "make_targets" around line 26 of package.json**.
      * You will need...
         * `dpkg` to compile deb packages, 
         * `rpm`, or more specifically the `rpmbuild` command (or `alpmbuild` on Arch-based) for compiling RPM packages.

      * To compile, run `electron-forge make` and the .DEB and .RPM files will be in the `out/make/` directory.
   * **To make an AppImage or Snap**: *You can edit the encryption file from these*. 
      * To compile, run `sudo electron-builder` while in the Incrypto directory. It will leave the appimage and snap in the 'dist/' directory. (you may need to run this command twice on the first go)
      * To install the *snap*, you'll need to run `sudo snap install dist/Incrypto_1.0.0_amd64.snap --dangerous`.
      * To use the *AppImage*, store it somewhere where you won't delete it and simply run it. You'll need to run or click on this file every time to run it.

* **On MacOS**
   * To compile, run `sudo electron-builder` while in the `Incrypto` folder and the .DMG will appear in the `dist/` directory
* **On Windows**
   * To compile, run `electron-forge make` while in the `Incrypto` directory and `Incrypto_Setup.exe` will be in `out\make\squirrel.windows\x64\`

### Run Incrypto Server
While in a terminal (or powershell), navigate into the Incrypto folder using `cd` (as done previously)
```bash
node ./Server_Standalone/server.js
```
You may need to run this as `sudo` or as an Administrator.

* * *
# Things to Know as a User
### Connecting to Server
Incrypto server needs to be running on a computer that's within network reach of your computer. This means that if you ping it, it will respond. The "Server Name" on the Incrypto login and registration pages can take both the network hostname of that computer or it's IP address. If the server is running on your own computer, "localhost" will work.
### Basic Navigation
Accounts - The "File" or "Electron" (on Mac) menu item on the top left-hand corner of the app has options to move around. It's here that you can go to "Login" from "Account Registration" and vice versa.

![image](https://user-images.githubusercontent.com/58751387/144778297-13e3edc9-3194-4a4a-9bd0-14637e8fc9eb.png)

### Changing chat color
Simply click on your username at the top right-hand corner of the app.

![image](https://user-images.githubusercontent.com/58751387/144778261-2230553f-510f-4bea-ab0c-a8576cfca68f.png)

### Encryption File and Rules
This file exists so that you as the user can add and manipulate encryption algorithms of your own. You could say this is the most important concept of a make-your-own-encryption app like Incrypto. There are two algorithms for every encryption type - one to encrypt and one to decrypt.

The `Encryption.js` file has multiple rules that you should know before manipulating it. These rules go as follows:
1. Decryption algorithm name must be idential (in case as well) to encryption the name, but with '_REVERSE' appended to the end.
   * Thus, if my new encryption type is a function titled "Example" then there must be another function titled "Example_REVERSE".

2. Encryption_Types is an array holding the names of all the encryption algorithms so they can be selected from the chat page. The encryption name in this array should be identical to the encryption function name. (not the decryption name)

Thus, the steps to add an encryption type would be, 
1. add name to Encryption_Types array, 
2. create encryption function with the very same name, 
3. create decryption function with your name and "_REVERSE" added onto the end. 

See Encryption.js for an example.
* * *
# Things to Know as a Developer
### Electron backbone
"Electron is an open source library developed by GitHub for building cross-platform desktop applications with HTML, CSS, and JavaScript. Electron accomplishes this by combining Chromium and Node.js into a single runtime and apps can be packaged for Mac, Windows, and Linux."

Electron, because it's running on Node.js, allows for the code to act the same on each machine it runs on. There are differences when it comes to User Interface, but the code in Incrypto is exactly the same on each operating system. Small changes needed to be made while packaging the app, but for the most part the code will act identially on other machines.
#### What Electron does and index.js file 
Electron uses a web-based user interface, so the code for Incrypto is built like a website, with HTML, CSS, and JavaScript. Refer to webpage programming concepts when it comes to ***every .html, .css, and .js file*** except for `index.js`, `renderer.js`, and `preload.js` which are files that the Electron backbone uses. 

`index.js` is of supreme importance when it comes to Electron. We've organized the app so that all the app logic (not included in the webpages) is in `index.js`. The normal webpages that electron runs and surrounds (`login`, `chat`, `register`) cannot do many of the global functions that Electron's index.js can do. 

Index.js takes care of...
* Storing your settings locally
* Creating desktop shortcuts and adding the app to the Windows Start Menu
* Creating (and adding the options to) the settings bar at the top of app. "File", "Edit", "View", etc.
* Window logic
* Setting the icon and name of the app
* Window sizing
* Storing user data
#### Switching Between Windows and Inter-Process Comminication
Because the individual webpages can't switch windows, they need to communicate somehow with the Electron instance. (ex. frontend.js needing index.js to switch the pages so that user can log out) This is done through interprocess comminication. Any webpage can call an instance of `ipcRenderer` and use it's `.invoke()` method to call an `ipcMain` function in `index.js`. 

For example, in frontend.js, there's this code: 
```js
// frontend.js
ipcRenderer.invoke('logout');
```
Which will call this function in `index.js`
```js
// index.js
ipcMain.handle('logout', (event) => {
    switchToLoginPage();
})
```
This same structure is used to get data from `index.js` as well as ipcMain can pass back a value. This is how values are set/get in the local storage file that `index.js` keeps track of.
```js
// frontend.js
var myColor;
ipcRenderer.invoke('getColor').then((result) => { 
    myColor = result;
});
```
```js
// index.js
ipcMain.handle('getColor', (event) => {
    return myColor;
})
```

### App local storage
`index.js` saves data in a `config.json` file stored in another part of the computer (`~/.config/Incrypto/` in Linux). This data is used for standard operation of the app and can be acquired through interprocess communication (see last section).

Data here keeps track of...
* Who was last logged in
* Their color
* Last encryption type used
* Selected code editor
* Stored Window Size
```JSON
{
	"lastUser": "line6",
	"serverName": "jrcb-jairus.byu.edu",
	"windowWidth": 1280,
	"windowHeight": 1440,
	"line6_Color": "#3F9CA3",
	"encryptionType": "Default_Encryption",
	"codeEditor": "atom"
}              
```
### Frontend.js and its functions
'frontend.js` is the main brains behind the chat functions of the app. It (like `login.js`) opens a websocket and passes JSON through that socket. It then manipulates the DOM to account for the data it receives from the server.
It takes care of...
* Navbar functionality
* Adding encryption types to the "Encryption Types" navbar dropdown
* Sending ping messages / recieving pong messages (every 100ms) in order to know that the websocket is still open (and changing DOM if websocket closed)
* Opening a connection to the server
* Recieving messages whenever they're received from the websocket
* Adding HTML to `chat.html` to add messages to DOM
* Showing notifications to the user when a message is recieved
* Logging the user out if the server sends a "logout" message (the user is logged in somewhere else)
* Encrypting messages sent by the user
* Decrypting the messages sent by other users
* Ask the server for a full message refresh (every 30 seconds)
* Sending a "color change" request to the server whenever the user clicks their username to change their chat color.

### Socket communication and JSON
When the user logs in, `login.js` sends JSON with this format (Registration has a similar format)
```JSON
{"type":"AuthRequest","user":"line6","passwordHash":-1234153003,"encryption":"plain_text","time":1638759642869}
```
To which the server responds (with this format) - **The key is randomly generated upon each login**
```JSON
{"type":"AuthResponse","color":"#FB811A","result":"success","key":"6d73ab1b-e990-4b2e-eac9-a4dcc2b84983"}
```
When the user sends a message, `frontend.js` sends JSON with this format
```JSON
{"type":"message","user":"line6","userEnc":"006c0069006e00650036","msg":"0074006500730074","userColor":"#FB811A","encryption":"Default_Encryption","key":"none","time":1638759480542}
```
Every time someone sends a message, everyone receives JSON with this format
```JSON
{"type":"message","user":"line6","userEnc":"006c0069006e00650036","msg":"0074006500730074","userColor":"#FB811A","encryption":"Default_Encryption","key":"none","time":1638759480542}
```
Every 30 seconds, the client will ask for a full history refresh in which it will send
```JSON
{"type":"historyRequest","user":"line6","color":"#FB811A","encryption":"plain_text","key":"none","time":1638759772046}
```
The server sends the entire chat in JSON format
```JSON
{"type":"history","data":[{"time":1638460329819,"text":"00200020","author":"0062006c0061006b0065007000320032","color":"#2F74E9","encryption":"Default_Encryption"},{"time":1638603330171,"text":"0069006e0074006500720065007300740069006e00670020006c006f006c","author":"006c0069006e00650036","color":"#FB811A","encryption":"Default_Encryption"}]}
```
In a color change request, frontend.js will send an array of all the possible encrypted usernames of that user. The server changes all the colors of the messages associated with that username and sends an entire history refresh to every client once its done.

### Server structure
The server has a similar structure to `frontend.js` in that it runs on as websocket completely based on events. Those events are listed below. For reference, the server stores the chat and each message in a file called `chat.json` which is stored in the `Incrypto` folder. Remember that the server will only store what each client sends it. Since the chat has only encrypted usernames and encrypted text, an intruder would need to know your decryption algorithm in order to read your chat messages. The server stores user data (including usernames, hashed passwords, and user's colors) in a `config.json` that's stored elsewhere on the computer, much like the `config.json` for each client. 

#### Server Events
Upon receiving a message, it will sort through what type of message it is and act accordingly.

| Message Type | Server Action and Response |
| --- | --- |
| ping | send a pong message back |
| colorChange | All the messages associated with that user change to the new specified color then send out the entire chat to everyone so that they're chats are refreshed, reflecting the color change |
| historyRequest | (every client sends a historyRequest every 30 seconds so that their chats are refreshed) Send the entire chat back to that one user |
| AuthRequest | Check its own `config.json` file to know if the user logging in is valid. Send a response either telling the client that their credentials are incorrect, or sending them a new randomly generated key upon a successful login |
| RegistrationRequest | similar to an AuthRequest, but make sure no users have the same hashed password before returning a randomly generated key |
| message | Add text to the chat and the server will send out that (and only that one) message to everyone |

* * *
# Things for our Dev Team to know
#### TODO:
* Find a way to remove out and dist directories from all compilation options
* Login/register buttons on login/register pages
* `npm start` doesn't set correct desktop icon in Linux
* Dock icon isn't set correctly in macOS
* MacOS `npm start` displays text strangely
* Linux AppImage icon needs to be set (Snap too)
* Make webserver use WSS instead of WS protocol
* Implement keys and key validation
* Run on port 443 and use HTTPS instead of HTTP
* BUG: Windows requires that you click outside the chat first before you can type anything in the chat right when chat loads
