# Incrypto

This is an Electron-based messaging app (both server and client) that allows you to make and use your own encryption algorithms.

## To Use

To clone and run this repository you'll need Git and Node.js. I'll go over that on Linux, but on Mac and Windows use these links [Git](https://git-scm.com) (when installing, the default options are fine)), [Node.js](https://nodejs.org/en/download/current/) (comes with [npm](http://npmjs.com)) to install them all on your computer.

From your command line:

```bash
# Clone this repository
git clone https://github.com/christensenjairus/Incrypto.git
# Go into the repository
cd Incrypto
# On Linux, make sure git and npm is installed
#  -> (on Ubuntu)
        sudo apt install aptitude
        sudo aptitude install nodejs npm git
#  -> (on Manjaro)
        sudo pacman -S nodejs npm git
#  -> (on CentOS/Redhat)
        sudo yum install nodejs npm git
# Install dependencies (node_modules)
npm install
        # You may need `npm audit fix` --force
# Run the app
npm start
# Run the server-cli
node ./Server_Standalone/server.js
# Also, use Visual Studio's launch function to run the app in Electron or index.html in a chrome page.
```

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.

## Resources for Learning Electron

- [electron.atom.io/docs](http://electron.atom.io/docs) - all of Electron's documentation
- [electron.atom.io/community/#boilerplates](http://electron.atom.io/community/#boilerplates) - sample starter apps created by the community
- [electron/electron-quick-start](https://github.com/electron/electron-quick-start) - a very basic starter Electron app
- [electron/simple-samples](https://github.com/electron/simple-samples) - small applications with ideas for taking them further
- [electron/electron-api-demos](https://github.com/electron/electron-api-demos) - an Electron app that teaches you how to use Electron
- [hokein/electron-sample-apps](https://github.com/hokein/electron-sample-apps) - small demo apps for the various Electron APIs
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security#csp-meta-tag) - what should be implemented (and what to do to get around it in the meantime)

## Building Windows App
- [How to found here](https://ourcodeworld.com/articles/read/365/how-to-create-a-windows-installer-for-an-application-built-with-electron-framework) - some online document that might work

## Client-Server Javascript Communication Resources
- [WebSocket Example](https://www.cronj.com/blog/node-js-websocket-examples-chat-features-client-server-communication/)

# TODO:
* Create a logout button on the chat page that will end the client connection and run main.js switchToLoginPage() function
* Login/register buttons on login/register pages
* Dark mode
* Rearrange chat to have times on right, names on left
* Drop down menu on chat page that lists different encryption options
* Create basic encryption example in encryption.js and use that encryption as the default
* For Jairus: ---------------------------------------------v
* Implement username being encrypted to other users as well as messages
* Make webserver use WSS instead of WS protocol
* Implement keys and key validation
* Notifications have wrong logo and name
* Run on port 443 and use HTTPS instead of HTTP
* BUG: Windows requires that you click outside the chat first before you can type anything in the chat right when chat loads
