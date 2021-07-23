const expect = require('chai').expect;
const { calculateBmi } = require('../calculateBmi');

describe('#calculateBmi()', function() {

    context('with incorrect fileSource', function() {
      it('should return with error code ENOENT', async function() {
          try {
            await calculateBmi('./public/raDataS.json');
          } catch (error) {
            expect(error.code).to.equal('ENOENT');
          }
      });
    });
    
    context('with incorrect json', function() {
      it('should return with syntax error', async function() {
        try {
            await calculateBmi('./public/incorrectJson.json');
        } catch (error) {
            expect(error).to.be.instanceof(Error);
        }
      });
    });

    context('with correct fileSource and json', function() {
        it('should successfully calculate bmi and write data to file', async function() {
            const result = await calculateBmi('./public/rawDataS.json');
            expect(result).to.equal('Success');
        });
    });
});