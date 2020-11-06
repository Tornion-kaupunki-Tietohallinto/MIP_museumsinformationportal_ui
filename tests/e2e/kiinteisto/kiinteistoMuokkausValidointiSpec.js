// page objects
var util = require('../page-objects/util-page');

//Muuttujat 
var kiinteistoModaaliId = 'Kiinteisto_modal';
var muokattuKunta = 'Kaarina';
var muokattuKyla = 'Aerla';
var muokattuKiinteistotunnnus = '202-458-1110-1110';
var muokattuNimi = 'PROTRACTOR_kiinteisto_muokattu';
var muokattuOsoite = 'PROTRACTOR_osoite_muokattu';
var muokattuPostinumero ='PROTRACTOR_postinumero_muokattu';

describe('Kiinteistot testit Mukattu Validointi', function() {
	  
	  it('Avaa kiinteistot tab', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('0_subtab')).click();
        var firstCell = element(by.repeater('kiinteisto in $data').row(1));
        expect(firstCell).not.toBeUndefined();    
	  });

	it('Hae ja validoi muokattu kiinteisto', function() {
	  
		//hae kiinteisto
		element(by.model('kiinteistotTable.filter().properties.nimi')).clear();
		element(by.model('kiinteistotTable.filter().properties.nimi')).sendKeys(muokattuNimi);
		protractor.promise.delayed(1000);
	  
		element(by.cssContainingText('table tr td', muokattuKunta)).click();
	  
		//kunta tarkistus
		var expKunta = element(by.css('[ng-click="showKuntaModal();"]'));
		expect(expKunta.getText()).toEqual(muokattuKunta);
	  
		//kylä tarkistus
		var expKyla = element(by.css('[ng-click="showKylaModal();"]'));
		expect(expKyla.getText()).toEqual(muokattuKyla);		  

		//kiinteistotunnus tarkistus
		expect(element(by.cssContainingText('.col-sm-9', muokattuKiinteistotunnnus)).getText()).toEqual(muokattuKiinteistotunnnus);
	  
		//kiinteisto nimi tarkistus
		expect(element(by.cssContainingText('.col-sm-9', muokattuNimi)).getText()).toEqual(muokattuNimi);
	  
		//osoite tarkistus
		expect(element(by.cssContainingText('.col-sm-9', muokattuOsoite)).getText()).toEqual(muokattuOsoite);
	  
		//postinumero tarkistus
		expect(element(by.cssContainingText('.col-sm-9', muokattuPostinumero)).getText()).toEqual(muokattuPostinumero);
	  
		//Sulje Modaali
		util.suljeModaali(kiinteistoModaaliId);	
		browser.sleep(2000);
	  
	});

});