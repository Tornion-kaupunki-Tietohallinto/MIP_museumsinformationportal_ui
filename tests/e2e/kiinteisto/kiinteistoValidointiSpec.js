/**
 * Kiintoisto testit.
 * hae ja Validoi tiedot.
 */

// page objects
var util = require('../page-objects/util-page');

//Muuttujat
var kunta = 'Aura';
var kyla = 'Auvainen';
var kiinteistotunnnus = '019-401-1111-1111';
var nimi = 'PROTRACTOR_kiinteisto';
var osoite = 'PROTRACTOR_osoite';
var postinumero = 'PROTRACTOR_postinumero';
var inventointiprojekti = 'Automaatiotestin projekti';
var inventoija = 'etunimi sukunimi';
var kenttapaiva = '02.02.2018';
var kiinteistoModaaliId = 'Kiinteisto_modal';


describe('Kiinteistot testit Validointi', function() {

	  it('Avaa kiinteistot tab', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('0_subtab')).click();
        var firstCell = element(by.repeater('kiinteisto in $data').row(1));
        expect(firstCell).not.toBeUndefined();
	  });

	  it('Hae ja validoi luotu kiinteisto', function() {

		  //hae kiinteisto
		  element(by.model('kiinteistotTable.filter().properties.nimi')).sendKeys(nimi);
		  protractor.promise.delayed(1000);

		  element(by.cssContainingText('table tr td', kunta)).click();

		  //kunta tarkistus
		  var expKunta = element(by.css('[ng-click="showKuntaModal();"]'));
		  expect(expKunta.getText()).toEqual(kunta);

		  //kylä tarkistus
		  var expKyla = element(by.css('[ng-click="showKylaModal();"]'));
		  expect(expKyla.getText()).toEqual(kyla);

		  //kiinteistotunnus tarkistus
		  expect(element(by.cssContainingText('.col-sm-9', kiinteistotunnnus)).getText()).toEqual(kiinteistotunnnus);

		  //kiinteisto nimi tarkistus
		  expect(element(by.cssContainingText('.col-sm-9', nimi)).getText()).toEqual(nimi);

		  //osoite tarkistus
		  expect(element(by.cssContainingText('.col-sm-9', osoite)).getText()).toEqual(osoite);

		  //postinumero tarkistus
		  expect(element(by.cssContainingText('.col-sm-9', postinumero)).getText()).toEqual(postinumero);

		  //inventointiprojekti tarkistus
		  var expInventointiprojekti = element(by.cssContainingText('table tr td', inventointiprojekti));
		  expect(expInventointiprojekti.getText()).toEqual(inventointiprojekti);

		  //inventoija tarkistus
		  var expInventoija = element(by.cssContainingText('table tr td', inventoija));
		  expect(expInventoija.getText()).toEqual(inventoija);

		  var expKenttapaiva = element(by.cssContainingText('table tr td', kenttapaiva));
		  expect(expKenttapaiva.getText()).toEqual(kenttapaiva);

		  //Sulje Modaali
		  util.suljeModaali(kiinteistoModaaliId);
		  browser.sleep(2000);
	  });
});