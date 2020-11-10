/**
 * Rakennuksen testit.
 * Lisää uusi
 */
// page objects
var rakennus = require('./rakennus-page');
var util = require('../page-objects/util-page');

//Muuttujat 
var rakKunta = 'Aura';
var rakKyla = 'Auvainen';
var rakKiinteistotunnnus = '019-401-1111-1111';
var rakNimi = 'PROTRACTOR_rakennus';
var kiintNimi = 'PROTRACTOR_kiinteisto';
var rakOsoite = 'PROTRACTOR_osoite';
var rakPostinumero = 'PROTRACTOR_postinumero';
var rakennusModaaliId = 'Rakennus_modal';
var kiinteistoModaaliId = 'Kiinteisto_modal';
var rakMuokattuKunta = 'Kaarina';
var rakMuokattuKyla = 'Aerla';
var rakMuokattuKiinteistotunnnus = '202-458-1110-1110';
var rakMuokattuNimi = 'PROTRACTOR_rakennus_muokattu';
var kiintMuokattuNimi = 'PROTRACTOR_kiinteisto_muokattu';
var rakMuokattuOsoite = 'PROTRACTOR_osoite_muokattu';
var rakMuokattuPostinumero ='PROTRACTOR_postinumero_muokattu';
var rakInventointinumero = '2';

describe('Rakennus testit Luonti', function() {
	  
	  it('Avaa kiinteistot tab rakennus luontia varten', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('0_subtab')).click();
          var firstCell = element(by.repeater('kiinteisto in $data').row(1));
          expect(firstCell).not.toBeUndefined();    
	  });
	  
	  it('Lisaa uusi rakennus', function() {
		  //hae kiinteisto
		  element(by.model('kiinteistotTable.filter().properties.nimi')).clear();
		  element(by.model('kiinteistotTable.filter().properties.nimi')).sendKeys(kiintMuokattuNimi);
		  
		  element(by.cssContainingText('table tr td', rakMuokattuKunta)).click();
		  
		  element(by.buttonText('Toiminnot')).click();		  
		  element(by.css('[ng-click="addRakennus()"]')).click();
		  
		  rakennus.activateKiintWindowClose();
		  util.suljeModaali(kiinteistoModaaliId);
		  rakennus.activateRakWindowLuonti();
		  
		  rakennus.setInventointinumero(rakInventointinumero);
		  element(by.model('rakennus.properties.rakennustunnus')).clear();
		  element(by.model('rakennus.properties.rakennustunnus')).sendKeys(rakMuokattuKiinteistotunnnus+'-'+rakInventointinumero);
		  rakennus.setPostinumero(rakPostinumero);
		  
		  //sijainti kartalle	
		  rakennus.setKarttaSijainti();
		  
		  //tallenna
		  element(by.buttonText('Toiminnot')).click();
		  var saveLink = element(by.css('[ng-click="(form.$invalid || disableButtons || !rakennus.properties.sijainti) || save()"]'));
		  expect(element(by.linkText('Tallenna')).getTagName()).toBe('a');
		  browser.sleep(3000);
		  saveLink.click().then(function() {
			  util.suljeModaali(rakennusModaaliId);
		  });
	  });	    

});
	  