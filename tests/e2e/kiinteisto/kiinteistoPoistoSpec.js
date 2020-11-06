// page objects
var util = require('../page-objects/util-page');

//Muuttujat 
var kunta = 'Aura';
var nimi = 'PROTRACTOR_kiinteisto';
var kiinteistoModaaliId = 'Kiinteisto_modal';
var muokattuKunta = 'Kaarina';
var muokattuNimi = 'PROTRACTOR_kiinteisto_muokattu';

describe('Kiinteistot testit poisto', function() {
	  
	  it('Avaa kiinteistot tab', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('0_subtab')).click();
        var firstCell = element(by.repeater('kiinteisto in $data').row(1));
        expect(firstCell).not.toBeUndefined();    
	  });
	  
	  it('Poista kiinteisto', function() {
	  
		  //hae kiinteisto
		  element(by.model('kiinteistotTable.filter().properties.nimi')).clear();
		  element(by.model('kiinteistotTable.filter().properties.nimi')).sendKeys(muokattuNimi);
		  protractor.promise.delayed(1000);
		  
		  element(by.cssContainingText('table tr td', muokattuKunta)).click();
		  browser.sleep(2000);
		  
		  //poista
		  element(by.buttonText('Toiminnot')).click();
		  var deleteLink = element(by.css('[ng-click="deleteKiinteisto(modalNameId)"]'));
		  expect(element(by.linkText('Poista')).getTagName()).toBe('a');
		  deleteLink.click();
		  
		  browser.ignoreSynchronization = true;
		  
		  // Boxin odottelu
		  browser.wait(protractor.ExpectedConditions.alertIsPresent(), 5000);
	  
		  var alertBox = browser.switchTo().alert();
		  expect(alertBox.getText()).toEqual('Vahvista poisto');
		  // Ok klikki
		  alertBox.accept();	
		  
	  });
});