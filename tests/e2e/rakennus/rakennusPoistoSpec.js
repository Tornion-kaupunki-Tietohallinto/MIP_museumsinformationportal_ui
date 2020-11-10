/**
 * Rakennuksen testit.
 * Poista
 */

// page objects
var util = require('../page-objects/util-page');

//Muuttujat 
var kunta = 'Aura';
var nimi = 'PROTRACTOR_kiinteisto';
var kiinteistoModaaliId = 'Kiinteisto_modal';
var rakMuokattuKunta = 'Kaarina';
var muokattuNimi = 'PROTRACTOR_kiinteisto_muokattu';
var kiintMuokattuNimi = 'PROTRACTOR_kiinteisto_muokattu';

describe('Rakennus testit poisto', function() {
	  
	  it('Avaa kiinteistot tab', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('1_subtab')).click();  
	  });
	  
	  it('Poista rakennus', function() {
	  
		  //hae kiinteisto
		  element(by.model('rakennuksetTable.filter().properties.kiinteisto_nimi')).clear();
		  element(by.model('rakennuksetTable.filter().properties.kiinteisto_nimi')).sendKeys(kiintMuokattuNimi);
		  protractor.promise.delayed(1000);
		  
		  element(by.cssContainingText('table tr td', rakMuokattuKunta)).click();
	  
		  //poista
		  element(by.buttonText('Toiminnot')).click();
		  var deleteLink = element(by.css('[ng-click="deleteRakennus(modalNameId)"]'));
		  expect(element(by.linkText('Poista')).getTagName()).toBe('a');
		  deleteLink.click();
		  	  
		  browser.ignoreSynchronization = true;
		  // Boxin odottelu
		  browser.wait(protractor.ExpectedConditions.alertIsPresent(), 5000);
	  
		  var alertBox = browser.switchTo().alert();
		  expect(alertBox.getText()).toEqual('Vahvista poisto');
		  // Ok klikki
		  alertBox.accept();		
		  browser.sleep(3000);
	  });
});