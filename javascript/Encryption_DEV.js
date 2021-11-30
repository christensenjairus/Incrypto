/*
    ENTER ENCRYPTION AND DECRYPTION FUNCTIONS HERE
    
    RULES: 
        1. Decryption algorithm name must be idential to encryption name, but with "_REVERSE" appended to the end.
        2. Encryption_Types is an array holding the name. That name should be identical to the encryption function name. (not the decryption name)
*/

// ADD YOUR ENCRYPTION NAME HERE ------------------------------
const Encryption_Types = ["Default_Encryption", "Plain_Text", "Binary", "Addition"]; // <--- add name in here
// ------------------------------------------------------------

// CREATE YOUR FUNCTIONS WITH THE EXACT SAME NAME HERE
function Default_Encryption(textin) {
    function strToHex(textin){
        var hex, i;
    
        var result = [];
        for (i=0; i < textin.length; i++) {
            hex = textin.charCodeAt(i).toString(16);
            result[i] = ("000"+hex).slice(-4);            
        }
        return result.join("");
    }
        
    return strToHex(textin);
}

function Default_Encryption_REVERSE(textin) {
    function hexToString(textin){
        var j;
        var hexes = textin.match(/.{1,4}/g) || [];
        var binCode = [];
        for (i = 0; i < hexes.length; i++) {
            binCode.push(String.fromCharCode(parseInt(hexes[i], 16)));
        }
        return binCode.join("");
    }
    return hexToString(textin);
}

function Plain_Text(textin) {
    return textin;
}

function Plain_Text_REVERSE(textin) {
    return textin;
}

function Binary(textin) {
    let textout = "";
    function textToBinary (str = '') {
        let res = '';
        res = str.split('').map(char => {
            return char.charCodeAt(0).toString(2);
        }).join(' ');
        return res;
    };
    return textToBinary(textin);
}

function Binary_REVERSE(textin) {
    function binaryAgent(str) {
        var newBin = str.split(" ");
        var binCode = [];
        for (i = 0; i < newBin.length; i++) {
            binCode.push(String.fromCharCode(parseInt(newBin[i], 2)));
        }
        return binCode.join("");
    }
    return binaryAgent(textin);
}

function Addition(textin) {
    //simple encryption of adding a key value to each char value (ASCII addition)
    let newText = textin.value() + 3;
    alert(newText);
    return newText;
}

function Addition_REVERSE(textin) {
    //the reverse
    let revText = textin.value() - 3;
    alert(newText);
    return newText;
}
