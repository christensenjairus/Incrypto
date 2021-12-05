# Incrypto

Incrypto is a cross-platform Electron-based messaging app (both server and client) that allows you to make and use your own encryption algorithms. It's built using electron, Bootstrap, JavaScript, CSS, HTML, Node, and websockets that communicate with JSON.

**Supported platforms: Windows, Linux, MacOS.**

## Getting Started
### Two main options for running Incrypto:
1. **Easy**: Download and install a pre-built package. **This will offer no encryption flexibility.** You will have to use our default encryption algorithms. **The prebuilt packages are in the PREBUILT_PACKAGES folder. This will not be explained furthur.**
2. **Recommended**: Clone the repository, run the app, and eventually make your own installer. **Follow steps below.**.
   * This is recommended because it offers the full flexibility of the app
   * It also enables you to distrubute your custom compiled packages so that your friends can have your encryption/decryption algorithms without exposing how they work.

#### Prerequisite packages
You'll need Node.js and NPM in order to run the app. Git is optional (for cloning this repository, not downloading it)

**For Mac and Windows** use these links and install and NodeJS and Git (optional) on your computer.
* [Node.js](https://nodejs.org/en/download/current/) (comes with [npm](http://npmjs.com)) 
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
* Run `npm start` to run the app. (this will *not* install it)

#### To Package & Install Incrypto
Each operating system (Linux, Windows, MacOS) can compile binaries for their own OS.
* They will all need Electron-Forge installed globally
`npm i -g electron-forge`
   * On Windows, you may need to enable scripts to be run in order for this to work --> ``

* **On Linux**
   * **To make DEB & RPM**: You may wish to comment out one of the two compilation options in package.json. By default, it **has both DEB & RPM.** If you don't want one of these compilation options, **edit the linux "make_targets" around line 26 of package.json**.
      * You will need...
         * `dpkg` to compile deb packages, 
         * `rpm`, or more specifically the `rpmbuild` command (or `alpmbuild` on Arch-based) for compiling RPM packages, 
   * **To make AppImage or Snap**: You can create appimages and snaps with `electron-builder` instead of `electron-forge`. *You can edit the encryption file from these*. 
      * You'll first need to install it globally with `npm i -g electron-builder`
      * Then run `sudo electron-builder` while in the Incrypto directory. It will leave the appimage and snap in the "dist" directory. 
      * To install the *snap*, you'll need to run `sudo snap install dist/Incrypto_1.0.0_amd64.snap --dangerous`.
      * To use the *AppImage*, store it somewhere where you won't delete it and simply run it.
* **On Windows**
   * Run `electron-forge make` and it will output `Incrypto_Setup.exe` in `out\make\squirrel.windows\x64\`

#### Run Incrypto Server
While in a terminal (or powershell), navigate into the Incrypto folder using `cd` (as done previously)
```bash
node ./Server_Standalone/server.js
```
You may need to run this as `sudo` or as an Administrator.

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.
* * *
# Things to Know as a User
### Basic Navigation
### Connecting to Server
### Changing chat color
### Encryption File and Rules
* * *
# Things to Know as a Developer
### Electron backbone
##### What Electron does and index.js file 
##### How it switches between windows 
##### Ipc Renderer
### App local storage
### App organization
### Frontend.js and its functions
### Socket communication and JSON
### Server structure
## How to compile

* * *
# Things for our Dev Team to know
#### Building Windows App
- [How to found here](https://ourcodeworld.com/articles/read/365/how-to-create-a-windows-installer-for-an-application-built-with-electron-framework) - some online document that might work

#### Client-Server Javascript Communication Resources
- [WebSocket Example](https://www.cronj.com/blog/node-js-websocket-examples-chat-features-client-server-communication/)

#### TODO:
* Login/register buttons on login/register pages
* Make webserver use WSS instead of WS protocol
* Implement keys and key validation
* Run on port 443 and use HTTPS instead of HTTP
* BUG: Windows requires that you click outside the chat first before you can type anything in the chat right when chat loads
