/*
SCRIPT FOR CONTROLLING CHAT CLIENT AND INDEX.HTML
*/

const fs = require('fs');
const { MongoGridFSChunkError } = require('mongodb');
const DEBUG = true; // turn this on & use it with 'if(DEBUG)' to display more console.log info
var serverName;
var displayAll = true;
var myName;
var myColor;
var chatRoom = [];
var chatRoomName = "ChatRoom1"
var EncryptionFunction;
var sessionID = "";
var myPrivateKey = "";
var userArray = [];
var content = document.getElementById("chatbox");
var input = document.getElementById("input");
var mystatus = document.getElementById("status");
var active = "#00e33d";
var notActive = "#f70505";
var red = "#6b0700";
var green = "#015400";
var path = require('path').join(process.cwd(),'keys')
// alert(path)
fs.mkdirSync(path, { recursive: true })

let savedInputText = "";

function logout() {
    ipcRenderer.invoke('logout');
}

$(function() { // this syntax means it's a function that will be run once once document.ready is true
    "use strict";
    content = document.getElementById("chatbox");
    input = $('#input');
    mystatus = $('#status');
    
    // -------------------------------------- USERS -----------------------------------------------------------
    
    async function refreshUsers(chatRoomName) {
        getAllUsers(myName, chatRoomName, serverName, sessionID).then(async response => {
            if (response.data.error == "incorrectSessionID") {
                alert("You've logged in somewhere else. You will be logged out here.")
                ipcRenderer.invoke('logout');
                return;
            }
            var users = response.data;
            for (var i = 0; i < users.length; ++i) {
                if (document.getElementById(users[i].username) == null && myName != users[i].username) { // if this user just joined or is unknown to us
                    document.getElementById("peoplebox").innerHTML += `<div style="background-color:#6b0700; color:white" onclick="toggleEncryptionForUser('`+ users[i].username+`')" id="` + users[i].username + `"><img src="../icons/icons8-hacker-60.png" width="30" class="img1" />` + users[i].username +`        <span class="dot" id="`+users[i].username + `_dot"></span></div>`
                    userArray.push(users[i]);
                    userArray.find(user => user.username == users[i].username).encryptForUser = false;
                    userArray.find(user => user.username == users[i].username).active = false;
                    // console.log("adding "+ users[i].username + " to people array")
                }
                else if (userArray.find(user => user.username == myName) == null) { // if I'm not found on list, add me
                    userArray.push(users[i]);
                    userArray.find(user => user.username == myName).encryptForUser = true;
                }
                if (users[i].pubKey != null) { // check everyones public key every time
                    // console.log("checking " + users[i].username + " public key")
                    if (fs.existsSync('./keys/PublicKey_' + users[i].username)) {
                        // console.log("public key exists")
                        var pubkey = fs.readFileSync('./keys/PublicKey_' + users[i].username)
                        if (pubkey != users[i].pubKey) { // file exists but is not correct
                            fs.writeFileSync('./keys/PublicKey_' + users[i].username, users[i].pubKey)
                            // console.log("is not correct")
                        }
                        else {
                            // console.log("is correct")
                        }
                    }
                    else {
                        // create the file
                        fs.writeFileSync('./keys/PublicKey_' + users[i].username, users[i].pubKey)
                        // console.log("public key did not exist, create it")
                    }
                }
            }
            // console.log("Users Array:")
            // console.log(userArray)
        })
        refreshActiveUsers();
        // console.log("User Array: ")
        // console.log(userArray)
    }
    
    // ---------------------------------------- CHATS -------------------------------------------------------
    
    async function refreshChat(timeOfLastMessage, chatRoomName, isStarting) {
        // var time = (new Date()).getTime();
        getNewMessages(myName, timeOfLastMessage, chatRoomName, serverName, sessionID).then(async response => {
            if (response.data.error == "incorrectSessionID") {
                alert("You've logged in somewhere else. You will be logged out here.")
                ipcRenderer.invoke('logout');
                return;
            }
            // console.log("RESPONSE: " + response.data)
            var messages = response.data;
            if (messages.length > 0) store.set("timeOfLastMessage_" + sessionID, messages[messages.length - 1].time); // use time from right before we asked last time
            let newJSON = [];
            for (var i = 0; i < messages.length; ++i) {
                // if (document.getElementById(messages[i].guid) == null) { // only if not already added! (sometimes two messages come through)
                newJSON.push(messages[i])
                if (!isStarting && messages[i].username != myName) {
                    if (messages[i].text.find(recipient => recipient.recipient == myName) == null && displayAll == true) { // show a notification if the user is looking at all the messages despite some being encrypted
                        showNotification(messages[i].username, Custom_AES_REVERSE(messages[i].text[0].text));
                    }
                    else {
                        showNotification(messages[i].username, Custom_AES_REVERSE(messages[i].text.find(recipient => recipient.recipient == myName).text));
                    }
                }
                
            }
            // }
            // if (Decrypt(messages[i].author, messages[i].encryption) == myName) myColor = messages[i].color;
            
            await appendChat(newJSON)
            if (myColor) {
                mystatus.text(myName).css('color', myColor);
                document.getElementById('color').value = myColor;
            }
            else mystatus.text(myName).css('color', "#0000FF");
            input.focus();
            scroll();
        })
    }
    
    async function refreshActiveUsers() {
        getActiveUsers(myName, serverName, sessionID).then(response => {
            var activeUsers = response.data
            // console.log(activeUsers);
            activeUsers.forEach(activeUser => {
                if ((userArray.find(user => user.username == activeUser.username) != null) && (activeUser.username != myName)) {
                    if (activeUser.active != userArray.find(user => user.username == activeUser.username).active) {
                        // console.log(activeUser.username + "Toggling active for " + activeUser.username)
                        toggleActiveForUser(activeUser.username)
                    }
                }
            })
        })
    }
    
    function toggleActiveForUser (username) {
        let element;
        if ((element = document.getElementById(username+"_dot")) != null && element.style != null) {
            if (element.style.backgroundColor != notActive) {
                element.style.backgroundColor = active;
                // console.log("making " + username + " active")
            }
            else {
                element.style.backgroundColor = notActive;
                // console.log("making " + username + " not active")
            }
        }
        else {
            // console.log("dot not found")
        }
    }
    
    async function prepareChat() {
        // serverName = await store.get("serverName", ""); // default to "" if no valid input
        await ipcRenderer.invoke('getSeeAllMessages').then((result) => { 
            displayAll = result;
        });
        await ipcRenderer.invoke('getName').then((result) => { 
            myName = result;
        });
        await ipcRenderer.invoke('getColor').then((result) => { 
            // console.log("color recieved")
            myColor = result;
            mystatus.text(myName).css('color', myColor);
            document.getElementById('color').value = myColor;
        });
        await ipcRenderer.invoke('getSessionID').then((result) => {
            sessionID = result;
        })
        await ipcRenderer.invoke('getServerName'). then((result) => {
            serverName = result;
        })
        // console.log("SessionID: " + sessionID)
        // EncryptionFunction = await store.get("encryptionType", Encryption_Types[0]);  // TODO: switch this back to default Encryption
        //default encryption type is first in file
        // await ipcRenderer.invoke('getEncryptionType').then((result) => {
        //     EncryptionFunction = result;
        // })
        try {
            myPrivateKey = fs.readFileSync('./keys/PrivateKey_' + myName);
        }
        catch (e) {
            // do nothing, will do this later
            // alert("getting new key pair")
            console.log("Running this because no shared key is noticed on boot.\nserverName is: " + serverName)
            myPrivateKey = await getMyKeysFromServer(myName, serverName, sessionID); // doesn't need to happen every time!
            // NOT SURE WHERE THE CODE BELOW SHOULD GO.
            // path = require('path').join('./','/PrivateKey_',myName)
            alert("If this is a new computer, you'll need to make a new key to read your messages. This is done to protect the users private key. However, Others will still be able to read what you sent them since their public keys have not changed.\n\nCreate new keys with Options > Get New Keys.")
        }
        
        // initialize chat & users
        refreshUsers(chatRoomName) // populate the people initially
        refreshChat("", chatRoomName, true) // populate the chat initially
        
        // refresh users every 10 seconds
        setInterval(function() {
            refreshUsers(store.get(chatRoomName))
        }, 10000)
        
        // refresh every 3 seconds
        setInterval(function() {
            refreshChat(store.get("timeOfLastMessage_" + sessionID, ""), chatRoomName, false)
            scroll();
        }, 3000)
    }
    prepareChat();
    
    function appendChat(newJSON) {
        if (chatRoom.length != 0) dtOfLastMessage = chatRoom[chatRoom.length - 1].time;
        
        for (var i=0; i < newJSON.length; i++) {
            if (newJSON[i].text.find(message => message.recipient == myName) != null) {
                addMessage(newJSON[i].username, newJSON[i].text.find(message => message.recipient == myName).text, newJSON[i].color, newJSON[i].time, newJSON[i].guid, newJSON[i], dtOfLastMessage); 
            }
            else {
                addMessage(newJSON[i].username, newJSON[i].text[0].text, newJSON[i].color, newJSON[i].time, newJSON[i].guid, newJSON[i], dtOfLastMessage); // just take the first encrypted part and send it
            }
            dtOfLastMessage = newJSON[i].time;
        }
        
        if (chatRoom.length > 1) chatRoom.concat(newJSON);
        else chatRoom = newJSON;
        newJSON = [];
    }
    
    function scroll() {
        var div = $('#chatbox');
        div.animate({
            scrollTop: div[0].scrollHeight
        }, 100);
        document.getElementById('input').focus();
    }
    
    function jump() {
        var div = $('#chatbox');
        div.scrollTop = div.scrollHeight;
        document.getElementById('input').focus();
    }
    
    var dtOfLastMessage = "";
    
    /*
    * Add message to the chat window
    */
    function addMessage(author, message, color, dt, guid, entireMessage, dtOfLastMessage) {
        if (document.getElementById(guid) != null) return; // this message is already in the chat
        let UnencryptedMessage;
        // console.log("Encrypted Message FROM " + author + ": " + message)
        UnencryptedMessage = Custom_AES_REVERSE(message);
        // if (message == UnencryptedMessage) return;
        // console.log("Unencrypted Message: " + UnencryptedMessage)
        // author = Custom_AES_REVERSE(author, encryptionType);
        
        var peopleWhoCanUnencrypt = "(Visible to";
        entireMessage.text.forEach(element => {
            if (element.recipient != myName) {
                peopleWhoCanUnencrypt += " " + element.recipient + ","
            }
        });
        if (peopleWhoCanUnencrypt != "(Visible to") {
            peopleWhoCanUnencrypt = peopleWhoCanUnencrypt.substring(0, peopleWhoCanUnencrypt.length - 1)
            peopleWhoCanUnencrypt += ")"
        }
        else peopleWhoCanUnencrypt = "";

        
        let purifiedMessage = DOMPurify.sanitize(UnencryptedMessage);
        // let purifiedMessage = UnencryptedMessage;
        // console.log("before purification")
        // let remainderOfMessage = UnencryptedMessage;
        // let purifiedMessage = "";
        // while (remainderOfMessage.length != 0) {
        //     try {
        //         remainderOfMessage = remainderOfMessage.substr(0, 216);
        //         purifiedMessage += DOM.sanitize(remainderOfMessage);
        //     } catch (e) {
        //         purifiedMessage += DOMPurify.sanitize(remainderOfMessage);
        //         remainderOfMessage = "";
        //     }
        // }
        // // chunkedMessage.forEach(chunk => {
        // //     purifiedMessage += sanitizeHTML(chunk)
        // // })
        // // let purifiedMessage = sanitizeHTML(UnencryptedMessage);
        if (purifiedMessage === "") return;
        // console.log("after purification");
        // console.log("author is " + Decrypt(author, encryptionType));
        // console.log("encryption type is " + encryptionType)
        const time = new Date(dt);
        const lastTime = new Date(dtOfLastMessage);
        let difference = time - lastTime;
        if ((UnencryptedMessage !== message) || displayAll === true) { // either we've decypted the message, or displayAll is toggled
            message = purifiedMessage;
            if (difference > 20000) {
                content.innerHTML += `<div class="text-center"><span class="between">` + time.toLocaleString() + `</span></div>`;
            }
            if (lightOrDark(color) == "dark") {
                if (author == myName) {
                    content.innerHTML += `<div class="d-flex align-items-center text-right justify-content-end" id="` + guid + `">
                    <div class="pr-2"> <span class="name">Me ` + peopleWhoCanUnencrypt + `</span>
                    <p class="msg bubbleright" style="background-color:` + color + `; color:white">` + message + `</p>
                    </div>
                    <div><img src="../icons/icons8-hacker-64.png" width="30" class="img1" /></div>
                    </div>`
                } else {
                    content.innerHTML += `<!-- Sender Message-->
                    <div class="d-flex align-items-center" id="` + guid + `">
                    <div class="text-left pr-1"><img src="../icons/icons8-hacker-60.png" width="30" class="img1" /></div>
                    <div class="pr-2 pl-1"> <span class="name">` + author + `</span>
                    <p class="msg bubbleleft" style="background-color:` + color + `; color:white">` + message + `</p>
                    </div>
                    </div>`;
                };
            }
            else {
                if (author == myName) {
                    content.innerHTML += `<div class="d-flex align-items-center text-right justify-content-end" id="` + guid + `">
                    <div class="pr-2"> <span class="name">Me ` + peopleWhoCanUnencrypt + `</span>
                    <p class="msg bubbleright" style="background-color:` + color + `; color:black">` + message + `</p>
                    </div>
                    <div><img src="../icons/icons8-hacker-64.png" width="30" class="img1" /></div>
                    </div>`
                } else {
                    content.innerHTML += `<!-- Sender Message-->
                    <div class="d-flex align-items-center" id="` + guid + `">
                    <div class="text-left pr-1"><img src="../icons/icons8-hacker-60.png" width="30" class="img1" /></div>
                    <div class="pr-2 pl-1"> <span class="name">` + author + `</span>
                    <p class="msg bubbleleft" style="background-color:` + color + `; color:black">` + message + `</p>
                    </div>
                    </div>`;
                };
            }
            dtOfLastMessage = time;
            // console.log("time updated with message: " + message)
        }
    }
    
    /**
    * Send message when user presses Enter key
    */
    input.keydown(async function(e) {
        if (e.keyCode === 13) {
            let msg = $(this).val();
            if (!msg) {
                return;
            }
            if (msg.length > 214) {
                alert("You have entered more than our 215 character limit")
                return;
            }
            
            var timesToEncrypt = 0;
            userArray.forEach(person => {
                if (person.encryptForUser == true) timesToEncrypt++;
            })
            if (timesToEncrypt == 1) {
                alert("Select any red name on the left column before sending.")
                return;
            }
            
            // protect against xss and bad characters
            let characterInString = false;
            msg = msg.split('').map(char => {
                if (char === '"') char = '\'\''; // replace " with two 's
                else if (char === '\\') char = '/'; // replace backslashes with forward slashes
                else if (char != " ") characterInString = true;
                return char;
            }).join('');
            if (!characterInString) return; // the message is only spaces
            let tmp1 = DOMPurify.sanitize(msg); // remove cross site scripting possibilities
            if (tmp1 !== msg) alert("To protect against cross site scripting, we will remove what we view as dangerous text from your message.")
            // msg = tmp1;
            tmp1 = msg;
            
            await sendMessage(myName, msg, myColor, chatRoomName, serverName, sessionID).then(async response => {
                if (response.data == 'Recieved') {
                    await refreshChat(store.get("timeOfLastMessage_" + sessionID, ""), chatRoomName, false)
                    scroll();
                    savedInputText = "";
                    document.getElementById('input').value = "";
                    ipcRenderer.invoke('setBadgeCnt', 0);
                    return;
                }
                else {
                    alert("There was an issue sending your message");
                }
            })
            
            document.getElementById('input').focus();
        }
        else {
            var count = $(this).val().length;
            console.log("count is: " + count)
            var remaining = 213 - count;
            if(remaining <= 0) {
                // document.getElementById('charcount_text').innerHTML = '4000 character limit reached.' ;
                document.getElementById('input').value = document.getElementById('input').value.substring(0, 213);
            } 
        }
    });
    
    var colorPicker = document.getElementById('color')
    colorPicker.addEventListener("input", watchColorPicker, false);
    // colorPicker.addEventListener("change", watchColorPicker, false);
    
    function watchColorPicker(event) {
        // document.querySelectorAll("p").forEach(function(p) {
        //     p.style.color = event.target.value;
        // });
        myColor = event.target.value;
        mystatus.text(myName).css('color', myColor);
        ipcRenderer.invoke('setColor', myColor);
        document.getElementById('input').focus();
        var result = changeColor(myName, myColor, serverName, sessionID);
    }
    
    document.getElementById('status').addEventListener('click', async () => {
        // console.log("Color was " + myColor)
        myColor = getRandomColor(); // generate random color
        // console.log("Color is now " + myColor)
        mystatus.text(myName).css('color', myColor);
        ipcRenderer.invoke('setColor', myColor);
        document.getElementById('input').focus();
        var result = changeColor(myName, myColor, serverName);
        document.getElementById('color').value = myColor
    });
    content.addEventListener('click', async () => {
        document.getElementById('input').focus();
    });
    
    // add NAVBAR functionality
    document.getElementById('logoutButton').addEventListener('click', () => {
        logout();
    })
    
    var dropdown = document.getElementById('dropdown');
    // for (let i = 0; i < Encryption_Types.length; ++i) {
    //     dropdown.innerHTML += '<a class="dropdown-item" href="#" id="encryption_type_' + i + '")>' + Encryption_Types[i] + '</a>'
    // }
    // for (let i = 0; i < Encryption_Types.length; ++i) {
    //     document.getElementById("encryption_type_" + i).addEventListener('click', () => {
    //         changeE_Type(Encryption_Types[i]);
    //     })
    // }
    
    dropdown = document.getElementById('dropdownOptions');
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="displayAllMessages">All messages</a>'
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="displayOnlyUnencryptedMessages">Only readable messages</a>'
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="remakeSharedKey">Get New Keys</a>'
    document.getElementById("displayAllMessages").addEventListener('click', () => {
        ipcRenderer.invoke('setSeeAllMessages', true);
        ipcRenderer.invoke('login');
    });
    document.getElementById("displayOnlyUnencryptedMessages").addEventListener('click', () => {
        ipcRenderer.invoke('setSeeAllMessages', false);
        ipcRenderer.invoke('login')
    });
    document.getElementById('remakeSharedKey').addEventListener('click', async () => {
        var path = "./keys/PrivateKey_" + myName;
        var path2 = "./keys/PublicKey_" + myName;
        try {
            fs.unlinkSync(path);
            fs.unlinkSync(path2)
            console.log("Files removed:", path + ", " + path2);
        } catch (err) {
            console.log(err);
        }
        console.log("Remaking key at button\nserverName is: " + serverName)
        await remakeSharedKey(myName, serverName, sessionID);
        
        ipcRenderer.invoke('login')
    })
});

function toggleEncryptionForUser(id){
    // console.log("toggling user "+ id)
    if (userArray.find(user => user.username == id).encryptForUser == false) {
        document.getElementById(id).style.backgroundColor = green;
        // store.set("encryptForUser_" + id, true)
        userArray.find(user => user.username == id).encryptForUser = true;
        input.focus();
    }
    else {
        document.getElementById(id).style.backgroundColor = red;
        // store.set("encryptForUser_" + id, false)
        userArray.find(user => user.username == id).encryptForUser = false;
        input.focus();
    }
}

function createGuid() {  
    function _p8(s) {  
        var p = (Math.random().toString(16)+"000000000").substr(2,8);  
        return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;  
    }  
    return _p8() + _p8(true) + _p8(true) + _p8();  
}

var sanitizeHTML = function (str) {
	return str.replace(/[^\w. ]/gi, function (c) {
		return '&#' + c.charCodeAt(0) + ';';
	});
};

function lightOrDark(color) {
    // Variables for red, green, blue values
    var r, g, b, hsp;
    // Check the format of the color, HEX or RGB?
    if (color.match(/^rgb/)) {
        // If RGB --> store the red, green, blue values in separate variables
        color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
        r = color[1];
        g = color[2];
        b = color[3];
    } 
    else {
        // If hex --> Convert it to RGB: http://gist.github.com/983661
        color = +("0x" + color.slice(1).replace( 
            color.length < 5 && /./g, '$&$&'));
            r = color >> 16;
            g = color >> 8 & 255;
            b = color & 255;
        }
        // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
        hsp = Math.sqrt(
            0.299 * (r * r) +
            0.587 * (g * g) +
            0.114 * (b * b)
            );
            // Using the HSP value, determine whether the color is light or dark
            if (hsp>127.5) {
                return 'light';
            } 
            else {
                return 'dark';
            }
        }
        
        async function remakeSharedKey(myName, serverName, sessionID) {
            console.log("remaking keys with server")
            myPrivateKey = await sendGetKeys(myName, serverName, sessionID, true); // doesn't need to happen every time!
        }

        async function getMyKeysFromServer(myName, serverName, sessionID) {
            console.log("getting new keys from server")
            myPrivateKey = await sendGetKeys(myName, serverName, sessionID, false);
        }
        
        // _________________ Helper Functions ________________________________
        
        function getRandomColor() {
            var letters = '0123456789ABCDEF';
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }
        
        function changeE_Type(EncryptionType) {
            ipcRenderer.invoke('changeMessageE_Type', EncryptionType);
        }
        
        function showNotification(author, text) {
            const NOTIFICATION_TITLE = author
            const notification = {
                title: author,
                body: text,
                // icon: __dirname + "/../icons/hacker-25899.png"
                icon: "../icons/hacker-25899.png"
            }
            new Notification(NOTIFICATION_TITLE, notification).onclick = () => {
                document.getElementById('input').focus();
            };
            ipcRenderer.invoke('incBadgeCnt', 1);
        }
        
        function Encrypt(textin, username) {
            let toReturn = "";
            try {
                toReturn = eval(EncryptionFunction + '("' + textin + '", "' + username + '")');
            } catch(e) {
                alert("There's an issue with the selected encryption algorithm: " + e);
                // return textin;
                return "";
            }
            return toReturn;
        }
        
        function EncryptOther(textin, encryptionType) {
            let toReturn = "";
            try {
                toReturn = eval(encryptionType + '("' + textin + '")');
            } catch(e) {
                return textin;
            }
            return toReturn;
        }
        
        function Decrypt(textin, encryptionType) {
            let toReturn = "";
            try {
                toReturn = eval(encryptionType + '_REVERSE("' + textin + '")');
                // alert("success: toReturn=" + toReturn);
            } catch(e) {
                // alert("error in decryption: " + e);
                return textin;
            }
            return toReturn;
        }
        
        const NodeRSA = require('encrypt-rsa').default;
        const nodeRSA = new NodeRSA();
        
        function Custom_AES(textin, username) {
            try {
                return nodeRSA.encryptStringWithRsaPublicKey({ 
                    text: textin, 
                    keyPath: './keys/PublicKey_' + username 
                });
            }
            catch (e) {
                return "";
            }
        }
        
        function Custom_AES_REVERSE(textin) {
            try {
                // console.log("Decrypting with key from " + myName)
                return nodeRSA.decryptStringWithRsaPrivateKey({ 
                    text: textin, 
                    keyPath: './keys/PrivateKey_' + myName
                });
            } catch (e) {
                // console.log(e)
                return textin;
            }
        }
        
        