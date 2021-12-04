# Incrypto

Incrypto is a cross-platform Electron-based messaging app (both server and client) that allows you to make and use your own encryption algorithms. It's built using electron, Bootstrap, JavaScript, CSS, HTML, Node, and websockets that communicate with JSON.

**Supported platforms: Windows, Linux, MacOS.**

## Getting Started
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
#### Install Incrypto
* Open a terminal (or powershell) and navigate using `cd` to the Incrypto folder that you've just downloaded. Enter it with `cd Incrypto`
* On Linux, run `./InstallOnLinux.sh`
   * You may need to give the file permission to be executed --> `chmod 755 ./InstallOnLinux.sh`
* On Windows, ...
* On Mac, ...

After these steps, Incrypto will be searchable in your OS and have a desktop icon.

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
##### What Electron does and main.js file 
##### How it switches between windows 
##### Ipc Renderer
### App local storage
### App organization
### Frontend.js and its functions
### Socket communication and JSON
### Server structure
### How to compile
On Windows, open an Administrative PowerShell window and run `npm i -g windows-build-tools`. This will install the compilation tools for an exe and set the right environment variables in your system. From there, run `<PLACEHOLDER>`.
`set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
`npm i -g electron-forge`
(do all your encryption file changes...)
`npm package`
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
