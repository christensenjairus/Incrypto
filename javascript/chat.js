/*
SCRIPT FOR CONTROLLING CHAT CLIENT AND INDEX.HTML
*/

const DEBUG = true; // turn this on & use it with 'if(DEBUG)' to display more console.log info
var serverName;
var displayAll = true;
var myName;
var myColor;
var chatRoom = [];
var chatRoomName = "ChatRoom1"
var EncryptionFunction;
var sessionID;

async function prepareChat() {
    serverName = await store.get("serverName", ""); // default to "" if no valid input
    await ipcRenderer.invoke('getSeeAllMessages').then((result) => { 
        displayAll = result;
    });
    await ipcRenderer.invoke('getName').then((result) => { 
        myName = result;
    });
    await ipcRenderer.invoke('getColor').then((result) => { 
        myColor = result;
    });
    sessionID = await store.get(myName + "_key", "");
    console.log("SessionID: " + sessionID)
    EncryptionFunction = await store.get("encryptionType", Encryption_Types[0]);  // TODO: switch this back to default Encryption
    //default encryption type is first in file
    await ipcRenderer.invoke('getEncryptionType').then((result) => {
        EncryptionFunction = result;
    })
    console.log("encryption type is " + EncryptionFunction)
}
prepareChat();

var content = document.getElementById("chatbox");
var input = document.getElementById("input");
var mystatus = document.getElementById("status");

// var textEntry = $('textEntry');
let savedInputText = "";

function logout() {
    ipcRenderer.invoke('logout');
}

$(function() { // this syntax means it's a function that will be run once once document.ready is true
    "use strict";
    content = document.getElementById("chatbox");
    input = $('#input');
    mystatus = $('#status');
    
    async function refreshChat(timeOfLastFetch, chatRoomName, isStarting) {
        var time = (new Date()).getTime();
        getNewMessages(timeOfLastFetch, chatRoomName, serverName).then(async response => {
            store.set("timeOfLastFetch_" + sessionID, time); // use time from right before we asked last time
            var messages = response.data;
            let newJSON = [];
            for (var i = 0; i < messages.length; ++i) {
                newJSON.push(messages[i])
                if (!isStarting && Decrypt(messages[i].author, messages[i].encryption) != myName) {
                    showNotification(Decrypt(messages[i].author, messages[i].encryption), Decrypt(messages[i].text, messages[i].encryption));
                }
                // if (Decrypt(messages[i].author, messages[i].encryption) == myName) myColor = messages[i].color;
            }
            await appendChat(newJSON)
            if (myColor) mystatus.text(myName).css('color', myColor);
            else mystatus.text(myName).css('color', "#0000FF");
            input.focus();
            scroll();
        })
        // setTimeout(refreshChat(store.get("timeOfLastFetch_" + sessionID, ""), chatRoomName, false), 3000)
    }
    // setTimeout(refreshChat(store.get("timeOfLastFetch_" + sessionID, ""), chatRoomName, false), 3000)
    refreshChat("", chatRoomName, true) // populate the chat initially
    // refresh every 3 seconds
    setInterval(function() {
        refreshChat(store.get("timeOfLastFetch_" + sessionID, ""), chatRoomName, false)
        scroll();
    }, 3000)
    
    function appendChat(newJSON) {
        let dtOfLastMessage = "";
        if (chatRoom.length != 0) dtOfLastMessage = chatRoom[chatRoom.length - 1].time;
        
        for (var i=0; i < newJSON.length; i++) {
            addMessage(newJSON[i].author, newJSON[i].text, newJSON[i].color, newJSON[i].time, dtOfLastMessage, newJSON[i].encryption, newJSON[i].guid); 
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
    
    /*
    * Add message to the chat window
    */
    function addMessage(author, message, color, dt, dtOfLastMessage, encryptionType, guid) {
        
        let UnencryptedMessage = Decrypt(message, encryptionType);
        author = Decrypt(author, encryptionType);
        
        let purifiedMessage = DOMPurify.sanitize(UnencryptedMessage);
        if (purifiedMessage === "") return;
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
            if (author == myName) {
                content.innerHTML += `<div class="d-flex align-items-center text-right justify-content-end" id="` + guid + `">
                <div class="pr-2"> <span class="name">Me</span>
                <p class="msg" style="background-color:` + color + `; color:white">` + message + `</p>
                </div>
                <div><img src="../icons/icons8-hacker-64.png" width="30" class="img1" /></div>
                </div>`
            } else {
                content.innerHTML += `<!-- Sender Message-->
                <div class="d-flex align-items-center" id="` + guid + `">
                <div class="text-left pr-1"><img src="../icons/icons8-hacker-60.png" width="30" class="img1" /></div>
                <div class="pr-2 pl-1"> <span class="name">` + author + `</span>
                <p class="msg" style="background-color:` + color + `; color:white">` + message + `</p>
                </div>
                </div>`;
            };
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
            msg = tmp1;
            msg = Encrypt(msg);
            if (msg == "") return; // if encryption fails
            
            await sendMessage(myName, Encrypt(myName), msg, myColor, EncryptionFunction, sessionID, chatRoomName, serverName).then(async response => {
                if (response.data == 'Recieved') {
                    await refreshChat(store.get("timeOfLastFetch_" + sessionID, ""), chatRoomName, false)
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
    });
    
    
    document.getElementById('status').addEventListener('click', async () => {
        // console.log("Color was " + myColor)
        myColor = getRandomColor(); // generate random color
        // console.log("Color is now " + myColor)
        mystatus.text(myName).css('color', myColor);
        ipcRenderer.invoke('setColor', myColor);
        document.getElementById('input').focus();
        var result = http.changeColor(myName, myColor, serverName);
    });
    content.addEventListener('click', async () => {
        document.getElementById('input').focus();
    });
    
    // add NAVBAR functionality
    document.getElementById('logoutButton').addEventListener('click', () => {
        logout();
    })
    
    var dropdown = document.getElementById('dropdown');
    for (let i = 0; i < Encryption_Types.length; ++i) {
        dropdown.innerHTML += '<a class="dropdown-item" href="#" id="encryption_type_' + i + '")>' + Encryption_Types[i] + '</a>'
    }
    for (let i = 0; i < Encryption_Types.length; ++i) {
        document.getElementById("encryption_type_" + i).addEventListener('click', () => {
            changeE_Type(Encryption_Types[i]);
        })
    }
    
    dropdown = document.getElementById('dropdownOptions');
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="displayAllMessages">All messages</a>'
    dropdown.innerHTML += '<a class="dropdown-item" href="#" id="displayOnlyUnencryptedMessages">Filter unencrypted messages</a>'
    document.getElementById("displayAllMessages").addEventListener('click', () => {
        ipcRenderer.invoke('setSeeAllMessages', true);
        ipcRenderer.invoke('login');
    });
    document.getElementById("displayOnlyUnencryptedMessages").addEventListener('click', () => {
        ipcRenderer.invoke('setSeeAllMessages', false);
        ipcRenderer.invoke('login')
    });
    
});


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

function Encrypt(textin) {
    let toReturn = "";
    try {
        toReturn = eval(EncryptionFunction + '("' + textin + '")');
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