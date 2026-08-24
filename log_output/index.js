
const random = require('crypto');

const randomID = random.randomUUID();

//Function to print random ID
function printRandom() {

    const time = new Date().toISOString();
    console.log(`${time}: ${randomID}`);
}

setInterval(printRandom, 5000);

printRandom();
