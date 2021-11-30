/*
    ENTER ENCRYPTION AND DECRYPTION FUNCTIONS HERE
    
    RULES: 
        1. Decryption algorithm name must be idential to encryption name, but with "_REVERSE" appended to the end.
        2. Encryption_Types is an array holding the name. That name should be identical to the encryption function name. (not the decryption name)
*/

// ADD YOUR ENCRYPTION NAME HERE ------------------------------
const Encryption_Types = ["defaultEncryption", "plain_text", "example"]; // <--- add name in here
// ------------------------------------------------------------

// CREATE YOUR FUNCTIONS WITH THE EXACT SAME NAME HERE
function defaultEncryption(textin) {
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

function defaultEncryption_REVERSE(textin) {
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

function plain_text(textin) {
    return textin;
}

function plain_text_REVERSE(textin) {
    return textin;
}
