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
    return "encrypted text here"
}

function defaultEncryption_REVERSE(textin) {
    return "decrypted text here"
}

function plain_text(textin) {
    return textin;
}

function plain_text_REVERSE(textin) {
    return textin;
}

