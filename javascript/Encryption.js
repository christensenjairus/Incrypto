/*
    ENTER ENCRYPTION AND DECRYPTION FUNCTIONS HERE
    
    RULES: 
        1. Decryption algorithm name must be idential to encryption name, but with "_REVERSE" appended to the end.
        2. Encryption_Types is an array holding the name. That name should be identical to the encryption function name. (not the decryption name)
*/

// ADD YOUR ENCRYPTION NAME HERE ------------------------------
const Encryption_Types = ["Default_Encryption", "Plain_Text", /*"Example"*/]; // <--- add name in here
// ------------------------------------------------------------

function Default_Encryption(textin) {
    function strToHex(textin){
        var hex
    
        var result = [];
        for (let i=0; i < textin.length; i++) {
            hex = textin.charCodeAt(i).toString(16);
            result[i] = ("000"+hex).slice(-4);            
        }
        return result.join("");
    }
        
    return strToHex(textin);
}

function Default_Encryption_REVERSE(textin) {
    function hexToString(textin){
        var hexes = textin.match(/.{1,4}/g) || [];
        var binCode = [];
        for (let i = 0; i < hexes.length; i++) {
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

// CREATE YOUR FUNCTIONS WITH THE EXACT SAME NAME HERE

// function Example () {
    
// }

// function Example_Reverse() {
    
// }

// Make sure to add your encryption's name into the array on line 10