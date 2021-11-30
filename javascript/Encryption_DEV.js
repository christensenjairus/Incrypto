/*
    ENTER ENCRYPTION AND DECRYPTION FUNCTIONS HERE
    
    RULES: 
        1. Decryption algorithm name must be idential to encryption name, but with "_REVERSE" appended to the end.
        2. Encryption_Types is an array holding the name. That name should be identical to the encryption function name. (not the decryption name)
*/

// ADD YOUR ENCRYPTION NAME HERE ------------------------------
const Encryption_Types = ["defaultEncryption", "plain_text", "example", "binary", "addition"]; // <--- add name in here
// ------------------------------------------------------------

// CREATE YOUR FUNCTIONS WITH THE EXACT SAME NAME HERE
function defaultEncryption(textin) {
    function strToHex(textin){
        var hex, i;
    
        var result = [];
        for (i=0; i < textin.length; i++) {
            hex = textin.charCodeAt(i).toString(16);
            result[i] = ("000"+hex).slice(-4); //pretty sure this is the problem it needs to be an array i think but my brain is already fried from getting this far haha
            //alert(result);
            
        }
        return result.join("");
    }
        
    return strToHex(textin);
}

function defaultEncryption_REVERSE(textin) {
    function hexToString(textin){
        var j;
        var hexes = textin.match(/.{1,4}/g) || [];
        //alert(hexes);
        /*var back = "";
        for(j = 0; j < hexes.length; j++) {
            back += String.fromCharCode(parseInt(hexes[j], 16));
        }
    
        return back;*/
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

function binary(textin) {
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

function addition(textin) {
    //simple encryption of adding a key value to each char value (ASCII addition)
    let newText = textin.value() + 3;
    alert(newText);
    return newText;
}

function addition_REVERSE(textin) {
    //the reverse
    let revText = textin.value() - 3;
    alert(newText);
    return newText;
}
