const fs = require('fs');
const Excel = require('exceljs');
const StreamArray = require( 'stream-json/streamers/StreamArray');

const bmiCategories = {
    underweight: 'Underweight',
    normalWeight: 'Normal weight',
    overWeight: 'Overweight',
    moderatelyObese: 'Moderately obese',
    severelyObese: 'Severely obese',
    verySeverelyObese: 'Very severely obese'
};

const healthRisks = {
    malnutritionRisk: 'Malnutrition risk',
    lowRisk: 'Low risk',
    enhancedRisk: 'Enhanced risk',
    mediumRisk: 'Medium risk',
    highRisk: 'High risk',
    veryHighRisk: 'Very high risk'
};

/**
 * Calculate BMI 
 */
exports.calculateBmi = function (fileSource) {
    return new Promise((resolve, reject) => {
        let bmiData;
        const obesityData = {
            totalPatient: 0,
            totalOverWeight: 0,
            totalUnderWeight: 0,
            totalNormalWeight: 0,
            totalIncorrectEntries: 0
        };
        
        const jsonStream = StreamArray.withParser();

        const fileStream = fs.createReadStream(fileSource);
        fileStream.on('error', (err) => {
            if(err) {
                console.log('ERROR: ', err);
                reject(err);
            }
        })

        // pipe readable stream to stream-json, so that it will convert it
        fileStream.pipe(jsonStream.input);

        const options = {
            filename: `./public/${Date.now()}_bmiData.xlsx`,
            useStyles: true,
            useSharedStrings: true
        };
        const workbook = new Excel.stream.xlsx.WorkbookWriter(options);
        const bmiWorksheet = workbook.addWorksheet('BMI report');
        const obesityWorksheet = workbook.addWorksheet('obesity data');

        bmiWorksheet.columns = [
            { header: 'Id', key: 'id', bgColor: 'yellow' },
            { header: 'Gender', key: 'gender' },
            { header: 'Height(cm)', key: 'heightCm' },
            { header: 'Weight(kg)', key: 'weightKg' },
            { header: 'BMI', key: 'bmi' },
            { header: 'BMI Category', key: 'bmiCategory' },
            { header: 'Health Risk', key: 'healthRisk' }
        ];

        ['A1','B1', 'C1', 'D1', 'E1', 'F1', 'G1'].map(key => {
            bmiWorksheet.getCell(key).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F6FF62' },
            bgColor: { argb: 'F6FF62' }
        };
        });

        obesityWorksheet.columns = [
            { header: 'Total Patients', key: 'totalPatient' },
            { header: 'Total Overweight', key: 'totalOverWeight' },
            { header: 'Total Underweight', key: 'totalUnderWeight' },
            { header: 'Total Normal weight', key: 'totalNormalWeight' },
            {header: 'Total Incorrect Entries', key: 'totalIncorrectEntries'}
        ];

        ['A1','B1', 'C1', 'D1', 'E1'].map(key => {
            obesityWorksheet.getCell(key).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F6FF62' },
                bgColor: { argb: 'F6FF62' }
            };
        });

        // json objects, Key is the array-index and value is the objects
        jsonStream.on('data', ({key, value}) => {

            // check if height and weight data is not negative
            if(value.heightCm && value.heightCm > 0 && value.weightKg && value.weightKg > 0) {
                bmiData = getBmiData(value.heightCm, value.weightKg);
                bmiWorksheet.addRow({ ...value, ...bmiData, id: key+1 }).commit();

                if(bmiData.bmiCategory == bmiCategories.underweight) {
                    ++obesityData['totalUnderWeight'];
                } else if(bmiData.bmiCategory == bmiCategories.normalWeight) {
                    ++obesityData['totalNormalWeight']
                } else {
                    ++obesityData['totalOverWeight'];
                }
            } else {
                ++obesityData['totalIncorrectEntries'];
            }
            ++obesityData['totalPatient'];
        });

        jsonStream.on('end', async () => {
            obesityWorksheet.addRow({...obesityData}).commit();
            await workbook.commit();
            console.log('Success');
            resolve('Success');
        });
        jsonStream.on('error', (err) => {
            console.log('ERROR: ', err);
            reject(err);
        });
    })
};

/**
 * Get Bmi, Bmi Category and Health risk data
 * @param {Number} heightCm height of the patient in cm
 * @param {Number} weightKg weight of the patient in kg
 * @returns {Object}
 */
function getBmiData(heightCm, weightKg) {
    heightCm = parseFloat(heightCm/100); // converting height in meters
    weightKg = parseFloat(weightKg);
    let bmi = weightKg / (heightCm * heightCm);
    bmi = bmi.toFixed(1);
    return { ...getBmiCategoryAndHealthRisk(bmi), bmi: bmi };
}

/**
 * Get Bmi Category and Health risk data based on the provided bmi
 * @param {Number} bmi
 * @returns {Object}
 */
function getBmiCategoryAndHealthRisk(bmi) {
    const result = {};
    
    if(bmi <= 18.4) {

        result['bmiCategory'] = bmiCategories.underweight;
        result['healthRisk'] = healthRisks.malnutritionRisk;

    } else if(bmi >= 18.5 && bmi <= 24.5) {

        result['bmiCategory'] = bmiCategories.normalWeight;
        result['healthRisk'] = healthRisks.lowRisk;

    } else if(bmi >= 25 && bmi <= 29.9) {

        result['bmiCategory'] = bmiCategories.overWeight;
        result['healthRisk'] = healthRisks.enhancedRisk;

    } else if(bmi >= 30 && bmi <= 34.9) {

        result['bmiCategory'] = bmiCategories.moderatelyObese;
        result['healthRisk'] = healthRisks.mediumRisk;

    } else if(bmi >= 35 && bmi <= 39.9) {

        result['bmiCategory'] = bmiCategories.severelyObese;
        result['healthRisk'] = healthRisks.highRisk;

    } else {

        result['bmiCategory'] = bmiCategories.verySeverelyObese;
        result['healthRisk'] = healthRisks.veryHighRisk;
    }
    return result;
}