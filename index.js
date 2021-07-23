const { calculateBmi } = require('./calculateBmi');
const fileSource = './public/rawDataS.json';

init();
async function init() {
    try {
        await calculateBmi(fileSource);
    } catch (error) {
        console.log('ERROR: ', error);
        process.exit(1);
    }
}