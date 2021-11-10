/*
    ENTER ENCRYPTION AND DECRYPTION FUNCTIONS HERE
    
    RULES: 
        1. Decryption algorithm name must be idential to encryption name, but with "_REVERSE" appended to the end.
        2. Encryption_Types is an array holding the name. That name should be identical to the encryption function name. (not the decryption name)
*/

// ADD YOUR ENCRYPTION NAME HERE ------------------------------
const Encryption_Types = ["defaultEncryption", "plain_text", "example", "binary"]; // <--- add name in here
// ------------------------------------------------------------

// CREATE YOUR FUNCTIONS WITH THE EXACT SAME NAME HERE
function defaultEncryption(textin) {
    return "encrypted";
}

function defaultEncryption_REVERSE(textin) {
    return "decrypted";
}

function plain_text(textin) {
    return textin;
}

function plain_text_REVERSE(textin) {
    return textin;
}

function binary(textin) {
    let textout = "";
    const textToBinary = (str = '') => {
        let res = '';
        res = str.split('').map(char => {
            return char.charCodeAt(0).toString(2);
        }).join(' ');
        return res;
    };
    return textToBinary(textin);
}

function binary_REVERSE(textin) {
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
