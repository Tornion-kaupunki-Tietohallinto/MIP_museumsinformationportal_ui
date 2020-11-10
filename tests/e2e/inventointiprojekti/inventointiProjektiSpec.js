/**
 * Inventointiprojektin testit.
 * Lisää uusi, hae ja muokkaa tietoja.
 * Validoi tiedot.
 */
// page objects
var inventointiprojekti = require('./inventointiprojekti-page');
var util = require('../page-objects/util-page');

 // Muuttujat
 var invprojNimi = 'PROTRACTOR_Inventointiprojekti';
 var alkupvm = '01.02.2018';
 var loppupvm = '28.02.2018';
 var kuvaus = 'Automaatiotestin luoma kuvaus';
 var kuvausMuokattu = 'Automaatiotestin muokkaama kuvaus';
 var toimeksiantaja = 'ATR automaatio';
 var invprojRepeater = 'inventointiprojekti in $data';
 var invprojModaaliId = 'Inventointiprojekti_modal';
 var muutoshistoriaModaaliId = 'Muutoshistoria_modal';

 describe('Inventointiprojektin testit', function() {
     
	  it('Avaa inventointiprojektit tab', function() {
	      element(by.id('0_tab')).click(); //Rakennusinventointi päätabi
		  element(by.id('8_subtab')).click();
		  var row = element(by.repeater(invprojRepeater).row(0));
		  expect(row).not.toBeUndefined();
	  });
	  
	  it('Lisaa uusi inventointiprojekti ('+invprojNimi+")", function() {

		  // Plussa kuvake
		  element(by.css('[ng-click="selectInventointiprojekti()"]')).click();

		  // Tiedot kenttiin
		  inventointiprojekti.setNimi(invprojNimi);
		  inventointiprojekti.setAlkupvm(alkupvm);
		  inventointiprojekti.setLoppupvm(loppupvm);
		  inventointiprojekti.setKuvaus(kuvaus);
		  inventointiprojekti.setToimeksiantaja(toimeksiantaja);
		  		  
		  // Kunnan valinta
		  inventointiprojekti.valitseKunta();

		  // Tallenna
		  util.suoritaToiminto('tallenna');
		  
		  // Katselunäytön validoinnit
		  expect(element(by.id('invproj_nimi')).getText()).toBe(invprojNimi);
		  expect(element(by.id('kuvaus')).getText()).toBe(kuvaus);
		  expect(element(by.id('toimeksiantaja')).getText()).toBe(toimeksiantaja);
		  
		  // Sulje modaali
		  util.suljeModaali(invprojModaaliId);

	  });
	  
	  it('Hae ja muokkaa inventointiprojektia ('+invprojNimi+")", function() {
		  
		  // Hae ja avaa
		  inventointiprojekti.setHakunimi(invprojNimi);
		  
		  // Eka rivi
		  util.valitseTaulukonRivi(invprojRepeater, 0);
		  
		  // Katselunäyttö avattu
		  expect(element(by.id('kuvaus')).getText()).toBe(kuvaus);
		  
		  // Avaa muokkaustilaan
		  util.suoritaToiminto('muokkaa');
		  
		  // Muuta kuvaus
		  inventointiprojekti.setKuvaus(kuvausMuokattu);
		  
		  // Tallenna
		  util.suoritaToiminto('tallenna');
		  
		  // Katselunäytön validoinnit
		  expect(element(by.id('invproj_nimi')).getText()).toBe(invprojNimi);
		  expect(element(by.id('kuvaus')).getText()).toBe(kuvausMuokattu);
		  expect(element(by.id('toimeksiantaja')).getText()).toBe(toimeksiantaja);
		  
		  // Avaa muutoshistoria
		  util.suoritaToiminto('muutoshistoria');
		 
		  // Muutoshistorian validointi
		  var cells = util.getTableCellsByRepeater('h in historia');
		  expect(cells.get(1).getText()).toEqual(kuvaus);
		  expect(cells.get(2).getText()).toEqual(kuvausMuokattu);
		
		  // Sulje modaali
		  util.suljeModaali(muutoshistoriaModaaliId);
	  });

	  it('Poista inventointiprojekti ('+invprojNimi+")", function() {
		  
		  util.suoritaToiminto('poista');
		  
		  // Boxin odottelu
		  browser.wait(protractor.ExpectedConditions.alertIsPresent(), 5000);
		  
		  var alertBox = browser.switchTo().alert();
		  expect(alertBox.getText()).toEqual('Vahvista poisto');
		  // Ok klikki
		  alertBox.accept();
	  });
});