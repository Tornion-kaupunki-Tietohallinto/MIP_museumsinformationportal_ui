/**
 * Rakennuksen testit.
 * Hae ja muokkaa
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
var setMuokattuPostinumero ='PROTRACTOR_postinumero_muokattu';
var rakInventointinumero = '2';

describe('rakennus testit Muokkaus', function() {
	  
	  it('Avaa kiinteistot tab rakennus luontia varten', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('1_subtab')).click();
	  });
	  
	  it('Muokkaa rakennus', function() {
		  //hae kiinteisto
		  element(by.model('rakennuksetTable.filter().properties.kiinteisto_nimi')).clear();
		  element(by.model('rakennuksetTable.filter().properties.kiinteisto_nimi')).sendKeys(kiintMuokattuNimi);
		  protractor.promise.delayed(1000);
		  
		  element(by.cssContainingText('table tr td', rakMuokattuKunta)).click();
		  
		  //aloita muokkaus
		  element(by.buttonText('Toiminnot')).click();
		  var muokkaaLink = element(by.css('[ng-click="editMode()"]'));
		  expect(element(by.linkText('Muokkaa')).getTagName()).toBe('a');
		  muokkaaLink.click();
		  
		  rakennus.setMuokattuPostinumero(setMuokattuPostinumero);
		  element(by.model('rakennus.properties.rakennustunnus')).sendKeys(rakMuokattuKiinteistotunnnus+'-'+rakInventointinumero);		  
		  
		  //tallenna
		  element(by.buttonText('Toiminnot')).click();
		  var saveLink = element(by.css('[ng-click="(form.$invalid || disableButtons || !rakennus.properties.sijainti) || save()"]'));
		  expect(element(by.linkText('Tallenna')).getTagName()).toBe('a');
		  saveLink.click().then(function() {
			  //Sulje Modaali
			  util.suljeModaali(rakennusModaaliId);
		  });
	  });	    

});
	  