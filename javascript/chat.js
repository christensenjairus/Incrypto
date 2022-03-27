/*
SCRIPT FOR CONTROLLING CHAT CLIENT AND INDEX.HTML
*/

const fs = require('fs');
let debug = false; // turn this on & use it with 'if(debug)' to display more console.log info
var serverName = false;
var displayAll = false;
var myName;
var myColor;
var chatRoom = [];
var chatRoomName = false;
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
var dtOfLastMessage = "";
var myChatRoomNames = [];
var sendToAll = false;
var numberOfChats = 25;
var isStarting = true;
var guidsOfNotificationMessages = []; // store the guids of the messages that we've notified the user of. That way they are not notified of the same message later.
var timesRecievedLogoutMessage = 0; // will be used to prevent double logout messages
// var path = require('path').join(process.cwd(),'keys')
var path = require('path').join(__dirname,'../keys')
// alert(path)
fs.mkdirSync(path, { recursive: true })

let savedInputText = "";

function logout() {
    ipcRenderer.invoke('logout');
}

function refresh() {
    ipcRenderer.invoke('login')
}

async function changeToChatRoom(name) {
    await store.set('chatRoomName_' + myName, name)
    refresh();
}

async function toggleDebugMode() {
    if (debug == true) await store.set('debug_' + myName, false)
    else await store.set('debug_' + myName, true)
    refresh();
}

async function setNumberOfChats() {
    var inputFromUser = await ipcRenderer.invoke('promptForNumberOfChats');
    if (inputFromUser == null || inputFromUser == "") return;
    if (isNaN(inputFromUser) == true) return;
    await store.set("numberOfChats_" + myName, parseInt(inputFromUser))
    refresh();
}

async function createNewChatRoom() {
    var inputFromUser = await ipcRenderer.invoke('promptForNewChat');
    if (inputFromUser == null || inputFromUser == "") return;
    var newRoomName = "Chatroom_" + inputFromUser;
    await createChatRoom(myName, serverName, sessionID, newRoomName)
    await joinChatRoom(myName, serverName, sessionID, newRoomName)
    changeToChatRoom(newRoomName);
}

async function leaveRoom() {
    var result = await leaveChatRoom(myName, serverName, sessionID, chatRoomName)
    if (result.data == false) {
        if (chatRoomName == "Chatroom_Global") {
            ipcRenderer.invoke('alert','',"'Global' is the default chatroom. Without it you could not find your new friends", "error", false);
        }
        else {
            ipcRenderer.invoke('alert','',"We could not remove you from this chatroom", "error", false);
        }
        return;
    }
    changeToChatRoom("Chatroom_Global")
}

$(function() { // this syntax means it's a function that will be run once once document.ready is true
    "use strict";
    content = document.getElementById("chatbox");
    input = $('#input');
    mystatus = $('#status');
    
    // -------------------------------------- USERS -----------------------------------------------------------
    
    async function refreshUsers(chatRoomName) {
        getChatRoomUsers(myName, chatRoomName, serverName, sessionID).then(async response => {
            if (response.data.error == "incorrectSessionID") {
                return;
            }
            var users = response.data;
            for (var i = 0; i < users.length; ++i) {
                if (document.getElementById(users[i].username) == null && myName != users[i].username) { // if this user just joined or is unknown to us
                    if (sendToAll == true) document.getElementById("peoplebox").innerHTML += `<div style="background-color:`+ green + `; color:white" onclick="toggleEncryptionForUser('`+ users[i].username+`')" id="` + users[i].username + `"><img src="../icons/icons8-hacker-60.png" width="30" class="img1" /><span class="dot" id="`+users[i].username + `_dot"></span>  ` + users[i].username +`</div>`
                    else document.getElementById("peoplebox").innerHTML += `<div style="background-color:`+ red + `; color:white" onclick="toggleEncryptionForUser('`+ users[i].username+`')" id="` + users[i].username + `"><img src="../icons/icons8-hacker-60.png" width="30" class="img1" /><span class="dot" id="`+users[i].username + `_dot"></span>  ` + users[i].username +`</div>`
                    userArray.push(users[i]);
                    if (sendToAll == true) userArray.find(user => user.username == users[i].username).encryptForUser = true;
                    else userArray.find(user => user.username == users[i].username).encryptForUser = false;
                    // console.log("adding "+ users[i].username + " to people array")
                }
                else if (userArray.find(user => user.username == myName) == null) { // if I'm not found on list, add me. This should only happen once!
                    userArray.push(users[i]);
                    userArray.find(user => user.username == myName).encryptForUser = true;
                    users[i].chatRooms.forEach(chatRoom => {
                        myChatRoomNames.push(chatRoom.name)
                    })
                    if (debug) console.log("MyChatRoomNames: " + myChatRoomNames)
                    await setupChatRefreshes();
                    // add options for switching chatrooms to Navbar
                    var dropdown = document.getElementById('chatRoomChangeDropdown');
                    myChatRoomNames.forEach(name => {
                        if (name != chatRoomName) {
                            dropdown.innerHTML += `<a class="dropdown-item" href="#" onclick="changeToChatRoom('` + name + `')">` + name.substring(9) + `</a>`
                        }
                    })
                    if (chatRoomName != "Chatroom_Global") dropdown.innerHTML += `<a class="dropdown-item" href="#" onclick="leaveRoom()" style="color:red">Leave this chatroom</a>`
                    dropdown.innerHTML += `<a class="dropdown-item" href="#" onclick="createNewChatRoom()" style="color:green">Create or join a chatroom</a>`
                }
                if (users[i].pubKey != null) { // check everyones public key every time
                    try {
                        // console.log("checking " + users[i].username + " public key")
                        if (fs.existsSync(require('path').join(__dirname,'../keys/PublicKey_' + users[i].username))) {
                            // console.log("public key exists")
                            var pubkey = fs.readFileSync(require('path').join(__dirname,'../keys/PublicKey_' + users[i].username))
                            if (pubkey != users[i].pubKey) { // file exists but is not correct
                                fs.writeFileSync(require('path').join(__dirname,'../keys/PublicKey_' + users[i].username), users[i].pubKey)
                                // console.log("is not correct")
                            }
                            else {
                                // console.log("is correct")
                            }
                        }
                        else {
                            // create the file
                            fs.writeFileSync(require('path').join(__dirname,'../keys/PublicKey_' + users[i].username), users[i].pubKey)
                            // console.log("public key did not exist, create it")
                        }
                    } catch (e) {
                        console.log("Keys files unable to save. Creating new keys directory...")
                        var path = require('path').join(__dirname,'../keys')
                        fs.mkdirSync(path, { recursive: true })
                    }
                }
            }
            refreshActiveUsers(response);
        })
    }
    
    // ---------------------------------------- CHATS -------------------------------------------------------
    
    async function refreshChat(timeOfLastMessage, messageChatRoomName, numberOfChatsToGrab) {
        // var time = (new Date()).getTime();
        getNewMessages(myName, timeOfLastMessage, messageChatRoomName, serverName, sessionID, numberOfChatsToGrab).then(async response => {
            if (response.data.error == "incorrectSessionID") {
                if (timesRecievedLogoutMessage == 0) {
                    ipcRenderer.invoke('alert','Logging you out...',"You've logged in somewhere else. You will be logged out here.", "", false);
                    timesRecievedLogoutMessage++;
                }
                ipcRenderer.invoke('logout');
                return;
            }
            // console.log("RESPONSE: " + response.data)
            var messages = response.data;
            if (messages.length > 0) store.set("timeOfLastMessage_" + sessionID, messages[messages.length - 1].time); // use time from right before we asked last time
            let newJSON = [];
            for (var i = messages.length - 1; i >= 0; --i) {
                // if (document.getElementById(messages[i].guid) == null) { // only if not already added! (sometimes two messages come through)
                newJSON.push(messages[i])
            }
            // }
            // if (Decrypt(messages[i].author, messages[i].encryption) == myName) myColor = messages[i].color;
            
            await appendChat(newJSON, messageChatRoomName)
            if (myColor) {
                mystatus.text(myName).css('color', myColor);
                document.getElementById('color').value = myColor;
            }
            else mystatus.text(myName).css('color', "#0000FF");
            input.focus();
            scroll();
        })
    }

    async function setupChatRefreshes() {
        // run it now
        myChatRoomNames.forEach(async messageChatRoomName => {
            if (messageChatRoomName != chatRoomName) {
                await refreshChat("", messageChatRoomName, 5) // check last 5 messages every 3 seconds in other chatrooms
            }
            else {
                await refreshChat(store.get("timeOfLastMessage_" + sessionID, ""), messageChatRoomName, numberOfChats)
                scroll();
            }
        })
        if (debug) console.log("Done refreshing chat")
        // set the same function to refresh every 3 seconds
        setInterval(function() {
            myChatRoomNames.forEach(messageChatRoomName => {
                if (messageChatRoomName != chatRoomName) {
                    refreshChat("", messageChatRoomName, 5) // check last 5 messages every 3 seconds in other chatrooms
                }
                else {
                    refreshChat(store.get("timeOfLastMessage_" + sessionID, ""), messageChatRoomName, numberOfChats)
                    scroll();
                }
            })
        }, 3000)
    }
    
    async function refreshActiveUsers(response) {
            var chatRoomUsers = response.data
            chatRoomUsers.forEach(user => {
                if ((userArray.find(user => user.username == user.username) != null) && (user.username != myName)) {
                    if (user.chatRooms.find(chatRoom => chatRoom.name == chatRoomName) != null) {
                        if (user.chatRooms.find(chatRoom => chatRoom.name == chatRoomName).lastActivity < ((new Date).getTime() - 11000)) {
                            toggleActiveForUser(user.username, false)
                            // console.log(user.username + " is off")
                        }
                        else {
                            toggleActiveForUser(user.username, true)
                            // console.log(user.username + " is on")
                        }
                    }
                }
            })
    }
    
    function toggleActiveForUser (username, activeBoolean) {
        let element;
        if ((element = document.getElementById(username+"_dot")) != null && element.style != null) {
            if (activeBoolean == true) {
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
        // SET ALL VARIABLES NEEDED FOR CHAT
        myName = await ipcRenderer.invoke('getName')
        debug = await store.get('debug_' + myName, false);
        if (debug) console.log("isStarting: " + isStarting);
        if (debug) console.log("MyName: " + myName)
        if (debug == true) console.log("Debug: enabled")
        displayAll = await ipcRenderer.invoke('getSeeAllMessages');
        if (debug) console.log("DisplayAll: " + displayAll)
        myColor = await ipcRenderer.invoke('getColor')
        if (debug) console.log("MyColor: " + myColor)
        mystatus.text(myName).css('color', myColor);
        document.getElementById('color').value = myColor;
        sessionID = await ipcRenderer.invoke('getSessionID')
        if (debug) console.log("SessionID: " + sessionID)
        serverName = await ipcRenderer.invoke('getServerName')
        if (debug) console.log("ServerName: " + serverName)
        chatRoomName = await store.get("chatRoomName_" + myName, "Chatroom_Global")
        if (debug) console.log("ChatRoomName: " + chatRoomName)
        document.getElementById("brand").innerText += chatRoomName.substring(9)
        sendToAll = await store.get("sendToAll_" + myName, true);
        if (debug) console.log("SendToAll: " + sendToAll)
        numberOfChats = await store.get("numberOfChats_" + myName, 25);
        if (debug) console.log("NumberOfChats: " + numberOfChats)
        try {
            myPrivateKey = fs.readFileSync(require('path').join(__dirname,'../keys/PrivateKey_' + myName));
        }
        catch (e) {
            if (debug) console.log("No shared secret is found. Creating shared secret with server...")
            myPrivateKey = await sendGetKeys(myName, serverName, sessionID);
        }
        
        // initialize chat & users
        refreshUsers(chatRoomName) // populate the people initially
        refreshChat("", chatRoomName, numberOfChats) // populate the chat initially
        
        // refresh users every 10 seconds
        setInterval(function() {
            refreshUsers(chatRoomName)
        }, 10000)
    }
    prepareChat();
    setTimeout(() => {
        if (debug) console.log("isStarting: " + false) // only show this once
        isStarting = false; // once chat is initially loaded, we are "not starting" anymore
    }, 2000) // do not get notifications for the first 2 seconds upon page load -> I'd like to decrease this
    
    async function appendChat(newJSON, messageChatRoomName) {
        for (var i=0; i < newJSON.length; i++) {
            if (newJSON[i].text.find(message => message.recipient == myName) != null) {
                addMessage(newJSON[i].username, newJSON[i].text.find(message => message.recipient == myName).text, newJSON[i].color, newJSON[i].time, newJSON[i].guid, newJSON[i], messageChatRoomName); 
            }
            else {
                addMessage(newJSON[i].username, newJSON[i].text[0].text, newJSON[i].color, newJSON[i].time, newJSON[i].guid, newJSON[i], messageChatRoomName); // just take the first encrypted part and send it
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
                ipcRenderer.invoke('alert','Character Limit Reached',"You have entered more than our 215 character limit", "error", false);
                return;
            }
            
            var timesToEncrypt = 0;
            userArray.forEach(person => {
                if (person.encryptForUser == true) timesToEncrypt++;
            })
            if (timesToEncrypt == 1) {
                ipcRenderer.invoke('alert',"Select any red name on the left column before sending.", "Without selecting a person to encrypt it for, it's a useless message.","", false);
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
            if (tmp1 !== msg) await ipcRenderer.invoke('alert',"","To protect against cross site scripting, we will remove what we view as dangerous text from your message.", "", false);
            // msg = tmp1;
            tmp1 = msg;
            
            await sendMessage(myName, msg, myColor, chatRoomName, serverName, sessionID).then(async response => {
                if (response.data == 'Recieved') {
                    await refreshChat(store.get("timeOfLastMessage_" + sessionID, ""), chatRoomName, numberOfChats)
                    scroll();
                    savedInputText = "";
                    document.getElementById('input').value = "";
                    ipcRenderer.invoke('setBadgeCnt', 0);
                    return;
                }
                else {
                    ipcRenderer.invoke('alert','',"There was an issue sending your message", "", false);
                }
            })
            
            document.getElementById('input').focus();
        }
        else {
            var count = $(this).val().length;
            // console.log("count is: " + count)
            var remaining = 213 - count;
            if(remaining <= 0) {
                // document.getElementById('charcount_text').innerHTML = '4000 character limit reached.' ;
                document.getElementById('input').value = document.getElementById('input').value.substring(0, 213);
            } 
        }
    });
    
    var colorPicker = document.getElementById('color')
    // colorPicker.addEventListener("input", watchColorPicker, false);
    colorPicker.addEventListener("change", watchColorPicker, false);
    
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
        var result = changeColor(myName, myColor, serverName, sessionID);
        document.getElementById('color').value = myColor
    });
    content.addEventListener('click', async () => {
        document.getElementById('input').focus();
    });
    
    var dropdown = document.getElementById('dropdownOptions');
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="displayAllMessages">Display all messages</a>'
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="displayOnlyUnencryptedMessages">Display readable messages</a>'
    dropdown.innerHTML += `<div class="dropdown-item" href="#" onclick="setNumberOfChats()">Set number of chats loaded</div>`
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="sendToAllButton" style="color:green">Send to All</a>'
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="sendToNoneButton" style="color:red">Send to None</a>'
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="remakeKeys">Get New Keys</a>'
    dropdown.innerHTML += `<div class="dropdown-item" href="#" onclick="toggleDebugMode()">Toggle debug mode</div>`
    dropdown.innerHTML += `<div class="dropdown-item" href="#" id="logoutButton">Logout</div>`
    document.getElementById("displayAllMessages").addEventListener('click', () => {
        ipcRenderer.invoke('setSeeAllMessages', true);
        ipcRenderer.invoke('login');
    });
    document.getElementById("displayOnlyUnencryptedMessages").addEventListener('click', () => {
        ipcRenderer.invoke('setSeeAllMessages', false);
        ipcRenderer.invoke('login')
    });
    document.getElementById('remakeKeys').addEventListener('click', async () => {
        document.getElementById('body').innerHTML = ' <div class="loader" id="loader"></div> ' // add loading bar
        var path = require('path').join(__dirname,'../keys/PrivateKey_' + myName);
        var path2 = require('path').join(__dirname,'../keys/PublicKey_' + myName);
        try {
            fs.unlinkSync(path);
            fs.unlinkSync(path2)
            console.log("Files removed:", path + ", " + path2);
        } catch (err) {
            console.log(err);
        }
        // console.log("Remaking key at button\nserverName is: " + serverName)
        await sendCreateKeys(myName, serverName, sessionID);
        
        ipcRenderer.invoke('login')
    })
    document.getElementById('sendToAllButton').addEventListener('click', async () => {
        await store.set("sendToAll_" + myName, true);
        ipcRenderer.invoke('login')
    })
    document.getElementById('sendToNoneButton').addEventListener('click', async () => {
        await store.set("sendToAll_" + myName, false);
        ipcRenderer.invoke('login')
    })
    document.getElementById('logoutButton').addEventListener('click', () => {
        logout();
    })
});

/*
* Add message to the chat window
*/
function addMessage(author, message, color, dt, guid, entireMessage, messageChatRoomName) {
    if (document.getElementById(guid) != null) return; // end now if this message is already in the chat

    // --------------- NOTIFICATION LOGIC

    if (entireMessage.text.find(recipient => recipient.recipient == myName) != null) { // if it's to me
        if (Custom_AES_REVERSE(entireMessage.text.find(recipient => recipient.recipient == myName).text) != message) { // if it was decrypted successfully
            // if (debug) console.log("Searching message: " + Custom_AES_REVERSE(entireMessage.text.find(recipient => recipient.recipient == myName).text))
            if ((isStarting == false) && (author != myName)) { // if I didn't write it && if the page is just barely loading
                if (guidsOfNotificationMessages.find(messageguid => messageguid == guid) == null) { // if you haven't gotten the notification yet
                    if (messageChatRoomName == chatRoomName) { // Normal notification
                        if (document.hasFocus() == false) { // only get notifications if not clicked in the window
                            showNotification(author, Custom_AES_REVERSE(entireMessage.text.find(recipient => recipient.recipient == myName).text));
                        }
                    }
                    else {
                        showNotification(author + " (" + messageChatRoomName.substring(9) + ")", Custom_AES_REVERSE(entireMessage.text.find(recipient => recipient.recipient == myName).text));
                    }
                    guidsOfNotificationMessages.push(guid)
                }
            }
            else if (isStarting == true) { // add these old messages to the array so we don't get notified of them as soon as isStarting becomes false
                guidsOfNotificationMessages.push(guid)
                // if (debug) console.log("Pushed notification for: " + Custom_AES_REVERSE(entireMessage.text.find(recipient => recipient.recipient == myName).text))
            }
        }
    }

    // ----------------- ADDING MESSAGE TO GUI LOGIC

    if (messageChatRoomName != chatRoomName) return;
    let UnencryptedMessage = Custom_AES_REVERSE(message);
    
    // count the 
    var peopleWhoCanUnencrypt = "(To";
    entireMessage.text.forEach(element => {
        if (element.recipient != myName && element.recipient != author) {
            peopleWhoCanUnencrypt += " " + element.recipient + ","
        }
    });
    if (peopleWhoCanUnencrypt != "(To") {
        peopleWhoCanUnencrypt = peopleWhoCanUnencrypt.substring(0, peopleWhoCanUnencrypt.length - 1)
        peopleWhoCanUnencrypt += ")"
    }
    else peopleWhoCanUnencrypt = "";
    
    
    let purifiedMessage = DOMPurify.sanitize(UnencryptedMessage);
    if (purifiedMessage === "") return; // if message purification fails (usually was a bad message anyway!)

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
                <div class="pr-2 pl-1"> <span class="name">` + author/* + " " + peopleWhoCanUnencrypt */+ `</span>
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
                <div class="pr-2 pl-1"> <span class="name">` + author/* + " " + peopleWhoCanUnencrypt */+ `</span>
                <p class="msg bubbleleft" style="background-color:` + color + `; color:black">` + message + `</p>
                </div>
                </div>`;
            };
        }
    }
    dtOfLastMessage = dt;
}

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
        
        // _________________ Helper Functions ________________________________
        
        function getRandomColor() {
            var letters = '0123456789ABCDEF';
            var color = '#';
            for (var i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }
        
        function showNotification(author, text) {
            const NOTIFICATION_TITLE = author
            // text =  chatRoomName.substring(9) + ": " + text
            const notification = {
                title: author,
                body: text,
                // icon: __dirname + "/../icons/hacker-25899.png"
                icon: require('path').join(__dirname,'../icons/hacker-25899.png')
            }
            new Notification(NOTIFICATION_TITLE, notification).onclick = () => {
                document.getElementById('input').focus();
            };
            ipcRenderer.invoke('incBadgeCnt', 1);
        }
        
        const NodeRSA = require('encrypt-rsa').default;
        const nodeRSA = new NodeRSA();
        
        function Custom_AES(textin, username) {
            try {
                return nodeRSA.encryptStringWithRsaPublicKey({ 
                    text: textin, 
                    keyPath: require('path').join(__dirname,'../keys/PublicKey_' + username)
                });
            }
            catch (e) {
                return "";
            }
        }
        
        function Custom_AES_REVERSE(textin) {
            try {
                // console.log("Decrypting with key from " + myName)
                // const key = new NodeRSA(process.env.PrivateKey, 'pkcs8')
                // return key.decrypt(textin, 'utf8')
                return nodeRSA.decryptStringWithRsaPrivateKey({ 
                    text: textin, 
                    keyPath: require('path').join(__dirname,'../keys/PrivateKey_' + myName)
                    // keyCode: process.env.PrivateKey
                });
            } catch (e) {
                // console.log(e)
                return textin;
            }
        }
        