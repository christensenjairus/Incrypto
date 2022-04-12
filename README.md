# Incrypto

Incrypto is a cross-platform Electron-based encrypted messaging app (both server and client). It is designed to be anonymous and secure. The encryption is based on a public-key model and uses symmetric encryption to distribute the public/private keys of each user. Once obtained, the public keys can then be used to encrypt messages that only one user could read while the private keys decrypt the messages sent to the user. Incrypto also has chatrooms that can be set with a pin.

Incrypto Server is an HTTP server with various API endpoints. Incrypto uses a Mongo database to store messages and user information. All database information needed for the client to function are, of course, run through the server endpoints. A description of the endpoints and database schema are given below.

Incryto is built using Electron, JavaScript, and Node.

![image](https://user-images.githubusercontent.com/58751387/160722726-163aa6cc-2ed0-4f6d-8ae7-1b2e35d8948e.png)
![image](https://user-images.githubusercontent.com/58751387/160723078-8009889b-0cee-476b-befc-4ee1aa2210d2.png)
![image](https://user-images.githubusercontent.com/58751387/160723786-c869dbaf-e7a2-42c1-a0f0-29edf1b06357.png)
![image](https://user-images.githubusercontent.com/58751387/160879358-83ce86bd-edd5-4ad5-a6c6-6d77caa522ee.png)
![image](https://user-images.githubusercontent.com/58751387/160724188-c79c0b20-d442-4dd1-a658-aa0ea2b01f51.png)

**Supported platforms: Windows, Linux, MacOS.**

## Getting Started
### Incrypto can be used in two ways. 
1. **Quick**: Run it from the terminal using `npm start` or `electron .` . 
2. **Recommended**: *Ease of use long-term.* Make your own installer and use Incrypto like any other desktop app! (Desktop Icons, Start Menu, etc). This method will create an .exe, .dmg, .zip, .deb, .rpm, snap, or an AppImage to be used natively in your operating system.

### Prerequisite packages
You'll need Node.js and NPM in order to run the app. Git will be required for cloning this repository, but not if you download it directly, of course.

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
# You could also do 
	npm install -g npm@latest
# Now, close this shell. This is important because the current shell will remember the old location of npm, which we don't want.
```

## Download this repository
You can do this in 2 ways
1. Click the download button on Github OR
2. Run the following command
```bash
git clone https://github.com/christensenjairus/Incrypto.git
```
## Run Incrypto
* Open a terminal (or powershell) and navigate using `cd` to the Incrypto folder that you've just downloaded. Enter it with `cd Incrypto`
* Run `npm i` to install the node_modules.
* Then, you can run it using **either** electron (non compile) or electron-forge (compile).
	* `electron .` will simply run it. You'll need electron installed globally for this. Install it with `npm i -g electron` and then `electron .` will run the app.
	* `electron-forge` will compile it first. Run `npm i -g electron-forge` to install the compilation engine allowing `npm start` to function. Then run `npm start` to run the app. This can also be done by running `run.sh`.

On Windows, you may need to enable scripts to be run in order for this to work

        `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force`

These commands will ***not install*** the app, only *run* it, which is great for manipulating the `encryption.js` file (see "Encryption File and Rules" below)

## To Package & Install Incrypto (Making your own Installer)
Each operating system (Linux, Windows, MacOS) can compile binaries for their own OS.

**Move or delete the `out` and `dist` directories before compilation, or else your packages will be much larger than they need to be**
* RPMs (Linux), DEBs (Linux), and EXEs (Windows) will need Electron-Forge installed globally
	* `npm i -g electron-forge`
* On Windows, you may need to enable scripts to be run in order for this to work
	* `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force`
* DMGs (MacOS), AppImages (Linux), and Snaps (Linux) can be created with Electron-Builder
	* `npm i -g electron-builder`

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

* * *
# Things to Know as a User
### Connecting to Server
Verify that you can connect to the server by opening a web browser and inputing either the DNS name or IP address. Know that Incrypto Server runs on port 5050, so unless your administrator intentionally routed that port elsewhere, you will need to include the port number. You'll know it works when you see "Incrypto Server is Running" in the browser. Input this data into the "Server Name" box in the login or registration pages.
Examples: `localhost:5050`, `yourDomain.com:5050` or, if you've routed the server to port 80 or 443, you can exclude the port number `incrypto.christensencloud.us`.
### User Fundamentals
* If the background of a user in the left-hand column is green, the client will encrypt your message to that user. If red, it will not encrypt your text for that user, but they'll recieve the ciphertext of the message anyway if they have "See all messages" enabled. 
* `Options > Get new keys` will create a new public/private key pair on the server, then send the client the private key to save. Because the client does not save old private keys, all your old messages will become ciphertext in the chat window. This is to be expected. The messages you've sent to others, however, are still readable by them, because their keys have not changed.
* Upon any problems with the app, click `File > Clear All Local Data` and log in again. This will delete the old key files and grab the updated ones from the server.
* If you send a message, and it appears as ciphertext to you, it's because your private key is outdated. You must either acquire the updated keys with `File > Clear All Local Data` and log in again, or generate a brand new set of keys with `Options > Get new keys`.

## Run Incrypto Server
You will need to setup MongoDB on either your local server or on Mongo Atlas. The Community Edition is enough. Once installed, get the connection string, as we'll be putting it in the `.env` file.
Once you have the connection string, while in a terminal (or powershell), navigate into the Incrypto folder using `cd` (as done previously) and run...
```bash
node ./Server_Standalone/server.js
```
You may need to run this as `sudo` or as an Administrator.
This will create a .env file for you that you will need to edit to connect to your Mongo Database. The .env created assumes that you'll be using a local database, use the standard port number (27017), and be running version 1.3.1 of mongosh. 
Change this file as needed, entering your connection string, then run the above command again.

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
// chat.js
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
`index.js` saves data in a `config.json` file stored in another part of the computer (`~/.config/Incrypto/` in Linux or %AppData%\Incrypto\ on Windows). This data is used for standard operation of the app and can be acquired through interprocess communication (see last section).

Data here keeps track of...
* For everyone:
	* Who was last logged in
	* Their color
	* Stored window size
* For each user:
	* Debug mode selection
	* Number of chats to display on load
	* Their shared secret with the server
	* Their session ID with the server
* For each user and chatroom:
	* If the user wants to see all messages
	* Typed (but not sent) messages
	* Time that the last message was retrieved
	* Guid of the last seen message by the user
	* Time of the last message displayed onscreen
	* If a message will send to everyone or to noone by default

```JSON
{
	"chatRoomName_line6": "Chatroom_99897_The Cyber Boys",
	"line6_sessionID": "d7e4a492-bdd7-c65c-dd36-336e1e3570fd",
	"lastUser": "line6",
	"serverName": "incrypto.christensencloud.us",
	"windowWidth": 1161,
	"windowHeight": 800,
	"sharedSecret_line6": "98832800053402946017112990209023788728467865289641864316384135405322941423563750469131352354437772894810223924123675616798896099316726709446713945512543601062542169545171599880694069728751736918677598543014133772056074007193712172029080687700580818551315928029224424772855748535566741808340892276244385951439",
	"timeOfLastMessage_line6_Chatroom_00000_Global": 1648583553985,
	"savedInput_line6_Chatroom_00000_Global": "C6IQugnnEeK2vQzLo4Udzxihs9TSzMl/AO7hIa/IIYg8OEXd/C/J3BdDOyMvH+LTgAx7z2/y73JbzTVk0ioOxemzJUCSoy6ETZki+nKAdMKu2ZWlMKZIbgCFLrvlV6ZTZiAGCOe0s1/QXDeNtfkYXiQuvq8wK+PcsgK1/4Z3pONU/PT7Zw1FkldKnd8oMjglQ5enZC0IX3n6B4AEtUIQabq7c2sMZ+SDwkyD8Pt9j7Jedqajrz667MrMXNQXHE1bc+1G/IVYl6ccbfFch/KpSGNylNZGflK/tx4a/6srLbO0ObEqfgzWypdfKE6SvBdqIBjw6HBVzgVPRZdEOyfuDg==",
	"guidOfLastSeenMessage_line6_Chatroom_00000_Global": "af72ca7a-2afb-84d9-43d7-9d8c3f56b8ac",
	"timeOfLastMessage_line6_Chatroom_12345_Cyber Den": 1648581311606,
	"savedInput_line6_Chatroom_12345_Cyber Den": "XMaC9tpXwmFgFIHK1SM1ee5qc/1VOrsVe5RBGrdKOb/Eiv2c5d015HOekAi9G1rEUhJpJa16yQRw67TswhpyQyx1CDsIFWk2RmvXb3S0WWMwO19NslKt9xzEYzxnvVhy7EtqE9MgvQleoBTO5rdaNGCs2Kc100mHkV+uBrfSV5lqZUdrAd/2DAqpleL8Zx3bXfbqnC1bXpmGHJ/Cr6GwE7Pt474MEcJeKElJTwWP86m1QGHF78OMSNdtETI8aOcbZwkM9C6zd7GQ1b845Jlp/IeRSjJ3KeRAYUH1Zffdtmh81C/A2C53DbC0k+uheEXmhc513jbTjZi0PJlHs2mQ5w==",
	"guidOfLastSeenMessage_line6_Chatroom_12345_Cyber Den": "7e8450f8-4b51-6f6f-95b2-4f4063a1797a",
	"timeOfLastMessage_line6_Chatroom_99897_The Cyber Boys": 1648583553985,
	"savedInput_line6_Chatroom_99897_The Cyber Boys": "RU9pJxWM2/CpmaObHz3uRMqmVaK4Vq0/k5PBxWLJnqbD6eGSn//WfZy2GdMjVwZCRL2xT/1e/lHjV6HBC7Brk/9LtqU+MkcP3tdaKsGXV+2pJEmzgOHt16pV15ceonTxE+iZmUkxv+CW0W1jKSUPqI3oNZfirjoIISIkngJnoy/PCzgd5SxxhlER+u3TdO6TstPJ/7LE+Ayd2ZFY3YbjNn9gTrt7Tojx8fHDBeQ9zWXkBmZliO59KMmQAyVFJ5IoqLuQ7fMwIUuyCsZ07f0WClam68zxLk6zOWhqnuYhHrAyAYD7glZrwRvDsFqXH0SBUDfdCI7rG3RkAcOgAZRviA==",
	"guidOfLastSeenMessage_line6_Chatroom_99897_The Cyber Boys": "",
	"displayAll_line6_Chatroom_99897_The Cyber Boys": true,
	"numberOfChats_line6": 155,
	"sendToAll_line6_Chatroom_99897_The Cyber Boys": true,
	"debug_line6": true
}          
```
### Chat.js and its functions
'chat.js` is the main brains behind the chat functions of the app. It (like `login.js`) uses HTTP requests to the server to get chat information. It then manipulates the DOM to account for the data it receives from the server.
It takes care of...
* Navbar functionality
* Adding options and chatrooms to the Navbar dropdowns
* Adding HTML to `chat.html` to add messages to DOM
* Showing notifications to the user when a message is recieved
* Logging the user out if the server sends an "invalid Session ID" message (the user is logged in somewhere else)
* Encrypting messages sent by the user
* Decrypting the messages sent by other users
* Asks the server for new messages in the chatroom (every 3 seconds)
* Asks the server for new messages in the other chatrooms (every 3 seconds)
* Asks the server for the users in the chatroom and their public keys (every 10 seconds)

# Server structure
The server works with a Mongo Database to give the clients their requested data through various API endpoints. The endpoints are in the `server.js` file. The logical functions for the API endpoints and the MongoDB queries, however, are stored in the `logic_server.js` file. Thus, the server is split between two files for logical separation. 

To see and use my Postman project, use this link: https://go.postman.co/workspace/Incrypto~b22136e5-8a73-4e28-be76-dd53bca80d72/collection/13394027-091be813-1183-44ed-a6d2-e3e6ca060d74?action=share&creator=13394027

The API endpoints and their requirements will be listed below.
* GET `/`: has no requirements. Will return `Incrypto Server is Running` so that connectivity can be verified in a web browser.
* GET `/api/ping`: has no requirements. Will return `PONG!`.
* POST `/api/login`: 

Requires: 
```JSON
{
    "username": "Eric1",
    "password": "Eric1"
}
```

Returns: 
```JSON
{
    "type": "AuthResponse",
    "color": "pink",
    "result": "success",
    "sessionID": "ea64445f-7d48-6ad9-adb4-e0756c867778"
}
```
```JSON
{ 
    "type": "AuthResponse", 
    "result": "failure", 
    "sessionID": "server_error" 
}
```
```JSON
{
    "type": "AuthResponse",
    "result": "failure",
    "sessionID": "incorrect_credentials"
}
```
		
* POST `/api/register`:

Requires: 
```JSON
{
    "username": "Eric1",
    "password": "hashed password here",
    "time": "",
    "chatRooms": [{"name":"Chatroom_00000_Global", "lastActivity": ""}]
}
```

Returns:
```JSON
{
    "type": "AuthResponse",
    "color": "#0000FF",
    "result": "success",
    "sessionID": "d1e73467-a326-aa4c-8b85-43f22bcd2606"
}
```
```JSON
{
    "type": "AuthResponse",
    "result": "failure",
    "sessionID": "no username"
}
```
```JSON
{
    "type": "AuthResponse",
    "result": "failure",
    "sessionID": "no password"
}
```
```JSON
{
    "type": "AuthResponse",
    "result": "failure",
    "sessionID": "username_exists"
}
```

* POST `/api/message/`:

Requires: 
```JSON
{
    "username": "Eric1",
    "sessionID": "8cef4c3c-735c-0f77-a82e-88af42217332",
    "msg": "ciphertext_here",
    "color": "blue",
    "time": null,
    "chatRoomName": "Chatroom_00000_Global",
    "guid": "someguid_here"
}
```

Returns:
```JSON
{
    "error":"incorrectSessionID"
}
```
```
Recieved
```
```
Error
```

* POST `/api/message/new`:

Requires: 
```JSON
{
    "chatRoomName": "Chatroom_00000_Global",
    "username": "Eric1",
    "sessionID": "8cef4c3c-735c-0f77-a82e-88af42217332",
    "timeOfLastMessage": "",
    "numberOfChats": 2
}
```

Returns: 
```JSON
[
    {
        "_id": "6243860cd8a9cd524b36e3f0",
        "time": 1648592396093,
        "text": [
            {
                "recipient": "line6",
                "text": "ZkNmPuph0XDvLzOkozhAhIrXTbu2vkB2Yj8W6cGk3VsHSydyGuamF5TmqnOuCMgwY9WJL/2MR8Fg8sporkdYLskhsnN3Aij+NNJLgcERGvodadSenrJmLkqDGq4GU9x7iUvsXA/OxVEXVp6L+ZYFvDOrWNBpzLfRbneawdwFK2wZdHdj2EkzD7O2dRMWmUeSh8mW6J3awDRpwRNUiIWFhvfBIRBxMf6mtC/YD6JmJxLmptwSQwSr5zInpTAghy3Wi+alBryJqVKn80iw+Ogpi3uRmCydheMw1I1f/2vOddCbKPq3lOp9RTDxbPvEc+Enh+ABLIt1lP8uwCkaFUB64w=="
            },
            {
                "recipient": "Adam",
                "text": "Vyd0956j2TL2OaocWpDlay2M5CICrGB1kOJmoYE/mmVhfy18O8onxBEXC2B8UFTroYE+uAnTnG2NgOgZ24NtOT2efhZPdhNYybyDlVcGKGtIJt/5Jm+nCSFCnPa36YjBmz8IAtJhMuB2Mi9NpPnpDitwk4eehyViWMEIEGp7XCVlrxn5OxgyndVJYHtXQiuB2a3XV2cIVaSUN1spdNqgpf3TKTEvPcSbdtnqnw1VqLkyxJYy3CzAlW+0bsXIkxdhZ18lNIvcuYxUkp4irQquBQPcWhZOJMmZn7hH4ExAvJoiVWqMjhQWqnMTgs+ODMP5wC9a5w76oJiJuAP1azyJVw=="
            }
        ],
        "username": "line6",
        "color": "#0000FF",
        "guid": "fd54e483-7d1d-e61f-b4ce-5269bcea72ea"
    },
    ...
]
```
```JSON
{
    "error":"incorrectSessionID"
}
```

* POST `/api/users/chatroom`:

Requires:
```JSON
{
    "username": "Eric1",
    "sessionID": "8cef4c3c-735c-0f77-a82e-88af42217332",
    "chatRoomName": "Chatroom_00000_Global"
}
```

Returns:
```JSON
[
    {
        "username": "Eric1",
        "chatRooms": [
            {
                "name": "Chatroom_00000_Global",
                "lastActivity": ""
            }
        ],
        "pubKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqBM/RblCk9FguiwEfQje\nrH94vPLyGOH1Tr+QIK/ETcAXj6aJqDFwK/Q/AAxIcD//ambHkhw+NeF5ylrkuAbU\nWxoxQaZN8r7C2hfj7381SgXOXGce6jXDvsz4/DI4u3mB4GOz2FkrBZ+59w2b7a1e\nev3L4ulmlW/I9FOyLMB5GB5DU6cjnc4Gq/YZDwxmGk/d3Xi0YvoBilkm00Me/kFK\nkQzZQ9vL2emMVIK1vdC3BxhtSotpt2Sxyh0uDGGZ0fKZs1EKj5TR8ItPVtnbJlgM\nHq3VYG1VQXnjHK6N50ibfbw3FxPemoYygSz9kFh8PpmyBHJ9I6nKJYPiTHNUHaYM\nsQIDAQAB\n-----END PUBLIC KEY-----\n"
    },
    ...
]
```
```JSON
{
    "error":"incorrectSessionID"
}
```

* POST `/api/message/new`:

Requires: 
```JSON
{
    "chatRoomName": "Chatroom_00000_Global",
    "username": "Eric1",
    "sessionID": "8cef4c3c-735c-0f77-a82e-88af42217332",
    "timeOfLastMessage": "",
    "numberOfChats": 2
}
```

Returns: 
```JSON
[
    {
        "_id": "6243860cd8a9cd524b36e3f0",
        "time": 1648592396093,
        "text": [
            {
                "recipient": "line6",
                "text": "ZkNmPuph0XDvLzOkozhAhIrXTbu2vkB2Yj8W6cGk3VsHSydyGuamF5TmqnOuCMgwY9WJL/2MR8Fg8sporkdYLskhsnN3Aij+NNJLgcERGvodadSenrJmLkqDGq4GU9x7iUvsXA/OxVEXVp6L+ZYFvDOrWNBpzLfRbneawdwFK2wZdHdj2EkzD7O2dRMWmUeSh8mW6J3awDRpwRNUiIWFhvfBIRBxMf6mtC/YD6JmJxLmptwSQwSr5zInpTAghy3Wi+alBryJqVKn80iw+Ogpi3uRmCydheMw1I1f/2vOddCbKPq3lOp9RTDxbPvEc+Enh+ABLIt1lP8uwCkaFUB64w=="
            },
            {
                "recipient": "Adam",
                "text": "Vyd0956j2TL2OaocWpDlay2M5CICrGB1kOJmoYE/mmVhfy18O8onxBEXC2B8UFTroYE+uAnTnG2NgOgZ24NtOT2efhZPdhNYybyDlVcGKGtIJt/5Jm+nCSFCnPa36YjBmz8IAtJhMuB2Mi9NpPnpDitwk4eehyViWMEIEGp7XCVlrxn5OxgyndVJYHtXQiuB2a3XV2cIVaSUN1spdNqgpf3TKTEvPcSbdtnqnw1VqLkyxJYy3CzAlW+0bsXIkxdhZ18lNIvcuYxUkp4irQquBQPcWhZOJMmZn7hH4ExAvJoiVWqMjhQWqnMTgs+ODMP5wC9a5w76oJiJuAP1azyJVw=="
            }
        ],
        "username": "line6",
        "color": "#0000FF",
        "guid": "fd54e483-7d1d-e61f-b4ce-5269bcea72ea"
    },
    ...
]
```
```JSON
{
    "error":"incorrectSessionID"
}
```

* POST `/api/color`:

Requires: 
```JSON
{
    "username": "Eric1",
    "sessionID": "8cef4c3c-735c-0f77-a82e-88af42217332",
    "color": "pink"
}
```

Returns: 
```JSON
{
    "error":"incorrectSessionID"
}
```
```
Recieved
```
```
Error
```

* POST `/api/users/chatroom/create` and `/api/users/chatroom/join:

Requires: 
```JSON
{
    "username": "Eric1",
    "sessionID": "8cef4c3c-735c-0f77-a82e-88af42217332",
    "chatRoomName": "Chatroom_00001_Testing"
}
```

Returns: 
```JSON
{
    "error":"incorrectSessionID"
}
```
```
true
```
```
false
```

* POST `/api/keys/getKeys` and `/api/createKeys`:

Requires: 
```JSON
{
    "username": "Eric1",
    "sessionID": "8cef4c3c-735c-0f77-a82e-88af42217332"
}
```

Returns: 
```
<The literal encoded private key of the user (to be decoded with a hash of the shared key)>
```
```JSON
{
    "error":"incorrectSessionID"
}
```

* POST `/api/keys/negociate`:

Requires: 
```JSON
{
    "username": "Eric1",
    "sessionID": "8cef4c3c-735c-0f77-a82e-88af42217332"
}
```

Returns: 
```JSON
{
    "base": "160607009132274210864679289234916530719611964260360771605330257536473420217737163749838999318902130907937198072960458541951666323154114061655745457961124517287540955603694045646658435315299155839508207823382672761687083733668273842699849158843409120550621782770557270860891563810931666068470587893076549763999",
    "mod": "169495612686488769837916190766250950561548849167585132632916352449643076529971575728048189019550040457384239125130179767033080585782059701641272451247609586447742868302988835736359812967319087489461038721877980536715362852489126541422543966642938531687114498939108084927184714633794319825947540235595897148919"
}
```
```JSON
{
    "error":"incorrectSessionID"
}
```

* POST `/api/keys/diffieHellman`:

Requires: 
```JSON
{
    "username": "Eric1",
    "sessionID": "8cef4c3c-735c-0f77-a82e-88af42217332",
    "clientPartial": "352021"
}
```

Returns: 
```JSON
{
    "serverPartial": "118514740694891343797541083335979228348129452643039422878988268439266489159851495914763829646000128822105194648414963617818855160397637730006865588792643009801845261060790207380703007081349714393382483613388571793635194878282988641085258355835275047329828165339461581692950665794824784383374963904762413118364"
}
```
```JSON
{
    "error":"incorrectSessionID"
}
```
# Database Schema
This database will be shown in the following state:
* Two messages sent to the Global chatroom
* Two users in the users table

![image](https://user-images.githubusercontent.com/58751387/160726169-b3ad145a-5311-481c-bcba-e2b8b7510581.png)
## Users Collection:
![image](https://user-images.githubusercontent.com/58751387/160726298-7002d7fe-e63a-4569-8b1e-a48c6591baf0.png)
## Chat Collection:
![image](https://user-images.githubusercontent.com/58751387/160726347-e32e066d-9896-4e00-9a74-b189d563b3d5.png)

* * *
# Things for our Dev Team to know
#### TODO:
* Save keys in store instead of files
* Chatrooms dropdown needs to stay orange despite flashing
* Linux AppImage and Snap package icon needs to be set
* NEW line pops up until you send a message...
* Always throws a 404 on the first login or register after install
* Sometimes active lights don't work, or turn off occasionally. Raise the timeout time.
