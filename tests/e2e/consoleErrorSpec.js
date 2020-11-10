/**
 * Tarkastetaan consolin messaget (käytännössä siis virheet)
 * Voitaisiin tehdä myös joka testin yhteydessä, mutta tekisi raportista epäluettavan.
 */
var util = require('./page-objects/util-page');

describe('Tarkastetaan konsoliin kirjoitetut viestit', function() {

      it('Tarkasta konsolin virheet', function() {
          util.checkConsoleErrors().then(function(browserLog) {
              expect(browserLog).toBeUndefined();
          }, function(problem) {
              console.log("Problem getting browserLog: " + problem);
          });                     
      });
      
});