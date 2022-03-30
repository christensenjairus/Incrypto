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
var doNotAutoScroll = false;
let savedInputText = "";
let guidOfLastSeenMessage = "";
let guidOfLastMessage = "";
let isNewMessage = false;
// var path = require('path').join(process.cwd(),'keys')
var path = require('path').join(__dirname,'../keys')
// alert(path)
fs.mkdirSync(path, { recursive: true })


$(function() { // this syntax means it's a function that will be run once once document.ready is true
    "use strict";
    content = document.getElementById("chatbox");
    input = $('#input');
    mystatus = $('#status');
    
    prepareChat();
    setTimeout(() => {
        if (debug) console.log("isStarting: " + false) // only show this once
        isStarting = false; // once chat is initially loaded, we are "not starting" anymore
        isNewMessage = true;
        guidOfLastSeenMessage = guidOfLastMessage;
        store.set("guidOfLastSeenMessage_" + myName + "_" + chatRoomName, guidOfLastMessage)
    }, 2000) // do not get notifications for the first 2 seconds upon page load -> I'd like to decrease this

    setInterval(() => {
        // save typed message
        savedInputText = document.getElementById('input').value
        savedInputText = Custom_AES(savedInputText, myName)
        store.set("savedInput_" + myName + "_" + chatRoomName, savedInputText)
        // if (debug) console.log("Saved Text: " + savedInputText)
    }, 1000)
    
    // create various document elements and listeners
    var dropdown = document.getElementById('dropdownOptions');
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="displayAllMessages">Display all messages</a>'
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="displayOnlyUnencryptedMessages">Display readable messages</a>'
    dropdown.innerHTML += `<div class="dropdown-item" href="#" onclick="setNumberOfChats()">Set number of chats loaded</div>`
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="sendToAllButton" style="color:green">Send to All</a>'
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="sendToNoneButton" style="color:red">Send to None</a>'
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="remakeKeys">Get new keys</a>'
    dropdown.innerHTML += `<div class="dropdown-item" href="#" onclick="toggleDebugMode()">Toggle debug mode</div>`
    dropdown.innerHTML += `<div class="dropdown-item" href="#" onclick="refresh()">Refresh chat</div>`
    dropdown.innerHTML += `<div class="dropdown-item" href="#" id="logoutButton">Logout</div>`
    document.getElementById("displayAllMessages").addEventListener('click', () => {
        // ipcRenderer.invoke('setSeeAllMessages', true);
        store.set("displayAll_" + myName + "_" + chatRoomName, true)
        displayAll = true;
        ipcRenderer.invoke('login');
    });
    document.getElementById("displayOnlyUnencryptedMessages").addEventListener('click', () => {
        // ipcRenderer.invoke('setSeeAllMessages', false);
        store.set("displayAll_" + myName + "_" + chatRoomName, false)
        displayAll = false;
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
        await store.set("sendToAll_" + myName + "_" + chatRoomName, true);
        toggleEncryptionForAllUsers(true)
        // ipcRenderer.invoke('login')
    })
    document.getElementById('sendToNoneButton').addEventListener('click', async () => {
        await store.set("sendToAll_" + myName + "_" + chatRoomName, false);
        toggleEncryptionForAllUsers(false)
        // ipcRenderer.invoke('login')
    })
    document.getElementById('logoutButton').addEventListener('click', () => {
        logout();
    })
    var colorPicker = document.getElementById('color')
    colorPicker.addEventListener("change", watchColorPicker, false);
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
    // set scroll listener to make autoscroll turn off until someone sends another message
    document.getElementById('chatbox').addEventListener('scroll', function(event) {
        var element = event.target;
        if (element.scrollHeight - element.scrollTop === element.clientHeight)
        {
            // console.log('scrolled');
            doNotAutoScroll = true;
        }
    });
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
                    await refreshChat(store.get("timeOfLastMessage_" + myName + "_" + chatRoomName, ""), chatRoomName, numberOfChats)
                    scroll();
                    savedInputText = "";
                    store.set("savedInput_" + myName + "_" + chatRoomName, "")
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
            // check it's length
            var count = $(this).val().length;
            var remaining = 213 - count;
            if(remaining <= 0) {
                document.getElementById('input').value = document.getElementById('input').value.substring(0, 213);
            } 
        }
    });
});

// --------------------------------------------------- FUNCTIONS ----------------------------------------------------------

async function prepareChat() {
    // SET ALL VARIABLES NEEDED FOR CHAT
    myName = await ipcRenderer.invoke('getName')
    debug = await store.get('debug_' + myName, false);
    if (debug) console.log("isStarting: " + isStarting);
    if (debug) console.log("MyName: " + myName)
    if (debug == true) console.log("Debug: enabled")
    myColor = await ipcRenderer.invoke('getColor')
    if (debug) console.log("MyColor: " + myColor)
    mystatus.text(myName).css('color', myColor);
    document.getElementById('color').value = myColor;
    sessionID = await ipcRenderer.invoke('getSessionID')
    if (debug) console.log("SessionID: " + sessionID)
    serverName = await ipcRenderer.invoke('getServerName')
    if (debug) console.log("ServerName: " + serverName)
    chatRoomName = await store.get("chatRoomName_" + myName, "Chatroom_00000_Global")
    if (debug) console.log("ChatRoomName: " + chatRoomName)
    document.getElementById("brand").innerText += chatRoomName.substring(15)
    displayAll = await store.get("displayAll_" + myName + "_" + chatRoomName, false)
    if (debug) console.log("DisplayAll: " + displayAll)
    sendToAll = await store.get("sendToAll_" + myName + "_" + chatRoomName, true); // any chatroom except global should have everyone in green
    if (chatRoomName == "Chatroom_00000_Global") sendToAll = false; // always have everyone be in red in the global chat.
    if (debug) console.log("SendToAll: " + sendToAll)
    savedInputText = await store.get("savedInput_" + myName + "_" + chatRoomName, "")
    savedInputText = Custom_AES_REVERSE(savedInputText)
    if (await store.get("savedInput_" + myName + "_" + chatRoomName, "") == savedInputText) savedInputText = ""; // if it doesn't decrypt right, don't have any saved text at all
    document.getElementById("input").value = savedInputText
    if (debug) console.log("Restored Text from input box: " + savedInputText)
    numberOfChats = await store.get("numberOfChats_" + myName, 25);
    guidOfLastSeenMessage = await store.get("guidOfLastSeenMessage_" + myName + "_" + chatRoomName, "");
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
                if (!isStarting) appendJoinedMessageToChat(users[i].username)
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
                        dropdown.innerHTML += '<a class="dropdown-item" href="#" onclick="changeToChatRoom(`' + name + '`)" id="' + name + '">' + name.substring(15) + `</a>` 
                        setNotificationCounter(name);
                    }
                    else {
                        resetNotificationCounter(name);
                    }
                })
                if (chatRoomName != "Chatroom_00000_Global") dropdown.innerHTML += `<a class="dropdown-item" href="#" onclick="showPin()" style="color:orange">Show pin for chatroom</a>`
                if (chatRoomName != "Chatroom_00000_Global") dropdown.innerHTML += `<a class="dropdown-item" href="#" onclick="leaveRoom()" style="color:red">Leave this chatroom</a>`
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
        mystatus.css('color', myColor).text(myName);
        refreshActiveUsers(response);
    }).catch(async error => {
        // mystatus.css('color', "red")
        mystatus.css('color', "red").text("Connecting to server...")
        // console.log("ERROR: " + error)
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
        if (messages.length > 0) store.set("timeOfLastMessage_" + myName + "_" + chatRoomName, messages[messages.length - 1].time); // use time from right before we asked last time
        let newJSON = [];
        for (var i = messages.length - 1; i >= 0; --i) {
            // if (document.getElementById(messages[i].guid) == null) { // only if not already added! (sometimes two messages come through)
            newJSON.push(messages[i])
        }
        // }
        // if (Decrypt(messages[i].author, messages[i].encryption) == myName) myColor = messages[i].color;
        mystatus.css('color', myColor).text(myName);
        await appendChat(newJSON, messageChatRoomName)
    }).catch(async error => {
        // console.log("ERROR: " + error)
        // document.getElementById('status').innerText = "Connecting to server..."
        mystatus.css('color', "red").text("Connecting to server...")
    })
}

async function setupChatRefreshes() {
    // run it now
    myChatRoomNames.forEach(async messageChatRoomName => {
        if (messageChatRoomName != chatRoomName) {
            await refreshChat("", messageChatRoomName, 5) // check last 5 messages every 3 seconds in other chatrooms
        }
        else {
            await refreshChat(store.get("timeOfLastMessage_" + myName + "_" + chatRoomName, ""), messageChatRoomName, numberOfChats)
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
                refreshChat(store.get("timeOfLastMessage_" + myName + "_" + chatRoomName, ""), messageChatRoomName, numberOfChats)
            }
        })
    }, 3000)
}

async function refreshActiveUsers(response) {
    var chatRoomUsers = response.data
    // logic for the active light next to a users name
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
    // logic for what to do if a user leaves the chat
    userArray.forEach(user => {
        if ((chatRoomUsers.find(chatRoomUser => chatRoomUser.username == user.username) == null) && (user.username != myName)) { // if the user isn't in the chat anymore
            if (document.getElementById(user.username) != null) { // if their box in the people box exists
                appendLeftMessageToChat(user.username);
                document.getElementById(user.username).remove()
            }
        }
    })
}

async function toggleEncryptionForAllUsers(booleanToChange) {
    userArray.forEach(user => {
        if ((userArray.find(user => user.username == user.username) != null) && (user.username != myName)) {
            if (user.encryptForUser != booleanToChange) {
                toggleEncryptionForUser(user.username);
            }
            else {
                // do nothing
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

/*
* Add message to the chat window
*/
function addMessage(author, message, color, dt, guid, entireMessage, messageChatRoomName) {
    if (document.getElementById(guid) != null) return; // end now if this message is already in the chat

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
                        showNotification(author + " (" + messageChatRoomName.substring(15) + ")", Custom_AES_REVERSE(entireMessage.text.find(recipient => recipient.recipient == myName).text));
                        incrementNotificationCounter(messageChatRoomName);
                        blink();
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
    
    var peopleWhoCanUnencrypt = "";
    if (entireMessage.text.length == userArray.length) { // If sent to everyone, don't say who it's sent to, its not necessary
        // if (debug) console.log("Everyone included")
    } 
    else if (entireMessage.text.length == userArray.length - 1) { // If one person is excluded
        // if (debug) console.log("One person excluded")
        // find the person who can't see your message
        var recipients = [];
        entireMessage.text.forEach(element => {
            recipients.push(element.recipient) 
            // if (debug) console.log("Message sent to " + element.recipient)
        });
        peopleWhoCanUnencrypt = " (Excluded";
        userArray.forEach(user => {
            if (recipients.find(recipient => recipient == user.username) == null) {
                peopleWhoCanUnencrypt += " " + user.username + ",";
                // if (debug) console.log("")
            }    
        })
        
        if (peopleWhoCanUnencrypt != " (Excluded") {
            peopleWhoCanUnencrypt = peopleWhoCanUnencrypt.substring(0, peopleWhoCanUnencrypt.length - 1)
            peopleWhoCanUnencrypt += ")"
        }
        else peopleWhoCanUnencrypt = "";
    }
    else { // list who can see it
        // count the people who can see your message
        peopleWhoCanUnencrypt = " (To";
        entireMessage.text.forEach(element => {
            if (element.recipient != myName && element.recipient != author) {
                peopleWhoCanUnencrypt += " " + element.recipient + ","
            }
        });
        if (peopleWhoCanUnencrypt != " (To") {
            peopleWhoCanUnencrypt = peopleWhoCanUnencrypt.substring(0, peopleWhoCanUnencrypt.length - 1)
            peopleWhoCanUnencrypt += ")"
        }
        else peopleWhoCanUnencrypt = "";
    }
    
    
    let purifiedMessage = DOMPurify.sanitize(UnencryptedMessage);
    if (purifiedMessage === "") return; // if message purification fails (usually was a bad message anyway!)

    const time = new Date(dt);
    const lastTime = new Date(dtOfLastMessage);
    let difference = time - lastTime;
    if ((UnencryptedMessage !== message) || displayAll === true) { // either we've decypted the message, or displayAll is toggled
        message = purifiedMessage;
        if (isNewMessage == true) {
            addNewMessageBanner();
            isNewMessage = false;
            // console.log("GUID OF LAST SEEN MESSAGE:" + guidOfLastSeenMessage)
        }
        if (!isStarting) store.set("guidOfLastSeenMessage_" + myName + "_" + chatRoomName, entireMessage.guid)
        guidOfLastMessage = entireMessage.guid;
        if (entireMessage.guid == guidOfLastSeenMessage) {
            isNewMessage = true;
            guidOfLastMessage = entireMessage.guid;
            // store.set("guidOfLastSeenMessage_" + myName + "_" + chatRoomName)
            if (debug) console.log("Last seen message by user: " + message)
        }
        if (difference > 40000) { // raised this from 20000
            content.innerHTML += `<div class="text-center"><span class="between">` + time.toLocaleString() + `</span></div>`;
        }
        if (lightOrDark(color) == "dark") {
            if (author == myName) {
                content.innerHTML += `<div class="d-flex align-items-center text-right justify-content-end" id="` + guid + `">
                <div class="pr-2"> <span class="name">Me` + peopleWhoCanUnencrypt + `</span>
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
                <div class="pr-2"> <span class="name">Me` + peopleWhoCanUnencrypt + `</span>
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
        if (isStarting == false) {
            doNotAutoScroll = false;
            scrollChat();
            // console.log("scrollChat")
        }
        else {
            jumpChat();
            // console.log("jumpChat")
        }
    }
    dtOfLastMessage = dt;
}

function incrementNotificationCounter(messageChatRoomName) {
    if (document.getElementById(messageChatRoomName) != null) {
        var numNotificationsForChatroom = store.get("numNotificationsForChatroom_" + myName + "_" + messageChatRoomName, 0);
        ++numNotificationsForChatroom;
        // console.log(numNotificationsForChatroom)
        if (document.getElementById(messageChatRoomName + "_number") != null) document.getElementById(messageChatRoomName + "_number").remove()
        document.getElementById(messageChatRoomName).innerHTML += `<div class="circle" id="`+messageChatRoomName+`_number" style="background:orange">`+numNotificationsForChatroom+`</div>`
        store.set("numNotificationsForChatroom_" + myName + "_" + messageChatRoomName, numNotificationsForChatroom);
    }
    // else{
    //     console.log("DID NOT DO IT")
    // }
}

function setNotificationCounter(messageChatRoomName) {
    if (document.getElementById(messageChatRoomName) != null) {
        var numNotificationsForChatroom = store.get("numNotificationsForChatroom_" + myName + "_" + messageChatRoomName, 0);
        if (numNotificationsForChatroom == 0) return;
        // console.log(numNotificationsForChatroom)
        if (document.getElementById(messageChatRoomName + "_number") != null) document.getElementById(messageChatRoomName + "_number").remove()
        document.getElementById(messageChatRoomName).innerHTML += `<div class="circle" id="`+messageChatRoomName+`_number" style="background:orange">`+numNotificationsForChatroom+`</div>`
        store.set("numNotificationsForChatroom_" + myName + "_" + messageChatRoomName, numNotificationsForChatroom);
    }
}

function resetNotificationCounter(messageChatRoomName) {
    store.set("numNotificationsForChatroom_" + myName + "_" + messageChatRoomName, 0);
}

function blink() { // will blink chatroom dropdown and leave it orange
    var f = document.getElementById('navbarDropdownMenuLink');
    setTimeout(function() {
        f.style.color = (f.style.color == 'orange' ? 'grey' : 'orange');
    }, 250);
    setTimeout(function() {
        f.style.color = (f.style.color == 'orange' ? 'grey' : 'orange');
    }, 500);
    setTimeout(function() {
        f.style.color = (f.style.color == 'orange' ? 'grey' : 'orange');
    }, 750);
    setTimeout(function() {
        f.style.color = (f.style.color == 'orange' ? 'grey' : 'orange');
    }, 1000);
    setTimeout(function() {
        f.style.color = (f.style.color == 'orange' ? 'grey' : 'orange');
    }, 1250);
    // console.log("BLINK")
}

function appendJoinedMessageToChat(username) {
    content.innerHTML += `<div class="text-center" style="color:green"><span class="between">` + username + ` joined the chat</span></div>`;
}

function appendLeftMessageToChat(username) {
    content.innerHTML += `<div class="text-center" style="color:red"><span class="between">` + username + ` left the chat</span></div>`;
}

function addNewMessageBanner() {
    if (document.getElementById('newBanner') == null && isStarting) {
        content.innerHTML += `<div class="text-center" style="color:Orange" id="newBanner"><span class="newBanner">NEW</span></div>`;
    }
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
    // refresh(); // don't need to refresh!
}

async function setNumberOfChats() {
    var inputFromUser = await ipcRenderer.invoke('promptForNumberOfChats');
    if (inputFromUser == null || inputFromUser == "") return;
    if (isNaN(inputFromUser) == true) return;
    await store.set("numberOfChats_" + myName, parseInt(inputFromUser))
    // refresh(); // don't need to refresh!
}

async function createNewChatRoom() {
    var inputFromUser = await ipcRenderer.invoke('promptForNewChat');
    if (inputFromUser == null) return
    inputFromUser = inputFromUser.replace(/`/g,'') // we use `, ", ' for the html, so we can't have a user use them in the chatroom name.
    inputFromUser = inputFromUser.replace(/"/g,'')
    inputFromUser = inputFromUser.replace(/'/g,'')
    inputFromUser = DOMPurify.sanitize(inputFromUser)
    if (inputFromUser == "") {
        ipcRenderer.invoke('alert','',"Chatroom name cannot be blank", "error", false);
        return;
    }
    var pin = await ipcRenderer.invoke('promptForPin');
    if (pin == null) return;
    if (pin == "" || isNaN(pin) == true || pin.length != 5) {
        ipcRenderer.invoke('alert','',"Pin number must be a 5 digit number", "error", false);
        return;
    }
    var newRoomName = "Chatroom_" + pin + "_" + inputFromUser;
    await createChatRoom(myName, serverName, sessionID, newRoomName)
    await joinChatRoom(myName, serverName, sessionID, newRoomName)
    changeToChatRoom(newRoomName);
}

async function showPin() {
    ipcRenderer.invoke('showPin', "Pin number for chatroom: " + chatRoomName.substring(15), "Pin number is: "+chatRoomName.substring(9,14))
}

async function leaveRoom() {
    var result = await leaveChatRoom(myName, serverName, sessionID, chatRoomName)
    if (result.data == false) {
        if (chatRoomName == "Chatroom_00000_Global") {
            ipcRenderer.invoke('alert','',"'Global' is the default chatroom. Without it you could not find your new friends", "error", false);
        }
        else {
            ipcRenderer.invoke('alert','',"We could not remove you from this chatroom", "error", false);
        }
        return;
    }
    changeToChatRoom("Chatroom_00000_Global")
}

// ----------------------- SCROLL LOGIC ------------------------------
    
function scrollChat() {
    var div = $('#chatbox');
    if (doNotAutoScroll == false) {
        div.animate({
            scrollTop: div[0].scrollHeight
        }, 100);
        document.getElementById('input').focus();
    }
}

function jumpChat() {
    var div = $('#chatbox');
    div.scrollTop(div[0].scrollHeight);
    document.getElementById('input').focus();
}

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
        