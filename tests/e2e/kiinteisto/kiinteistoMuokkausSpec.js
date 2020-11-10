/**
 * Kiintoisto testit.
 * hae ja muokkaa.
 */
// page objects
var kiinteisto = require('./kiinteisto-page');
var util = require('../page-objects/util-page');

//Muuttujat 
var kiintKunta = 'Aura';
var kiintNimi = 'PROTRACTOR_kiinteisto';
var kiinteistoModaaliId = 'Kiinteisto_modal';
var kiintMuokattuKunta = 'Kaarina';
var kiintMuokattuKyla = 'Aerla';
var kiintMuokattuKiinteistotunnnus = '019-401-1110-1110';
var kiintMuokattuNimi = 'PROTRACTOR_kiinteisto_muokattu';
var kiintMuokattuOsoite = 'PROTRACTOR_osoite_muokattu';
var kiintMuokattuPostinumero ='PROTRACTOR_postinumero_muokattu';

describe('Kiinteistot testit Muokkaus', function() {
	  
	  it('Avaa kiinteistot tab', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('0_subtab')).click();
        var firstCell = element(by.repeater('kiinteisto in $data').row(1));
        expect(firstCell).not.toBeUndefined();    
	  });
	  
	it('Hae ja muokkaa luotu kiinteisto', function() {
	  
		//hae Kiinteisto uudestaan
		element(by.model('kiinteistotTable.filter().properties.nimi')).clear();
		element(by.model('kiinteistotTable.filter().properties.nimi')).sendKeys(kiintNimi);
		protractor.promise.delayed(1000);
		element(by.cssContainingText('table tr td', kiintKunta)).click();
	   
		//aloita muokkaus
		element(by.buttonText('Toiminnot')).click();
		var muokkaaLink = element(by.css('[ng-click="editMode()"]'));
		expect(element(by.linkText('Muokkaa')).getTagName()).toBe('a');
		muokkaaLink.click();
	  
		//muokkaa kunta
		kiinteisto.valitseKuntaKaarina();
	  
		//muokkaa kyla
		kiinteisto.valitseKyla();
	  
		//muokka kiinteistonumero ja loput perustiedot
		element(by.model('kiinteistotunnus_osat[2]')).sendKeys('1110');
		element(by.model('kiinteistotunnus_osat[3]')).sendKeys('1110');
		kiinteisto.setNimi(kiintMuokattuNimi);
		kiinteisto.setOsoite(kiintMuokattuOsoite);
		kiinteisto.setPostinumero(kiintMuokattuPostinumero);
	  
	 	element(by.css('[data-ng-click="addToInventointiprojektiDeleteList(inventointiprojekti.id, inventointiprojekti.inventoijat[0].inventoija_id)"]')).click();
	  		  
	 	//tallenna
	 	element(by.buttonText('Toiminnot')).click();
	 	var saveLink = element(by.id('kiinteisto_tallenna'));
	 	expect(element(by.linkText('Tallenna')).getTagName()).toBe('a');
	 	saveLink.click().then(function() {
	 		//Sulje Modaali
	 		util.suljeModaali(kiinteistoModaaliId);
	 	});
	});
});
