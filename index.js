const { calculateBmi } = require('./calculateBmi');
const fileSource = './public/rawDataS.json';

init();
async function init() {
    try {
        console.log('Process Initiated');
        await calculateBmi(fileSource);
    } catch (error) {
        console.log('ERROR: ', error);
        process.exit(1);
    }
}