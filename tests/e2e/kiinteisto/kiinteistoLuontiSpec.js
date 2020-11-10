/**
 * Kiintoisto testit.
 * Lisää uusi, hae ja muokkaa ja lopuksi poista.
 * Validoi tiedot.
 */
// page objects
var kiinteisto = require('./kiinteisto-page');
var util = require('../page-objects/util-page');

//Muuttujat
var kiintKunta = 'Aura';
var kiintKyla = 'Auvainen';
var kiintKiinteistotunnnus = '019-401-1111-1111';
var kiintNimi = 'PROTRACTOR_kiinteisto';
var kiintOsoite = 'PROTRACTOR_osoite';
var kiintPostinumero = 'PROTRACTOR_postinumero';
var inventointiprojekti = 'Automaatiotestin projekti';
var inventoija = 'etunimi sukunimi';
var kenttapaiva = '02.02.2018';
var kiinteistoModaaliId = 'Kiinteisto_modal';
var kiintmuokattuKunta = 'Kaarina';
var kiintmuokattuKyla = 'Aerla';
var kiintmuokattuKiinteistotunnnus = '202-458-1110-1110';
var kiintmuokattuNimi = 'PROTRACTOR_kiinteisto_muokattu';
var kiintmuokattuOsoite = 'PROTRACTOR_osoite_muokattu';
var kiintmuokattuPostinumero ='PROTRACTOR_postinumero_muokattu';

describe('Kiinteistot testit Luonti', function() {

	  it('Avaa kiinteistot tab', function() {
		  element(by.id('0_tab')).click();
		  element(by.id('0_subtab')).click();
          var firstCell = element(by.repeater('kiinteisto in $data').row(1));
          expect(firstCell).not.toBeUndefined();
	  });

	  it('Lisaa uusi kiinteisto', function() {
		  // Plussa kuvake
		  element(by.id('btn-create')).click();

		  // Kiinteiston perustiedot
		  //kunta
		  kiinteisto.valitseKuntaAura();

		  //kyla
		  kiinteisto.valitseKyla();

		  //inventointinumeron loput
		  element(by.model('kiinteistotunnus_osat[2]')).sendKeys('1111');
		  element(by.model('kiinteistotunnus_osat[3]')).sendKeys('1111');
		  kiinteisto.setNimi(kiintNimi);
		  kiinteisto.setOsoite(kiintOsoite);
		  kiinteisto.setPostinumero(kiintPostinumero);

		  //inventointiprojekti
		  element(by.model('kiinteisto.properties.inventointiprojekti.inventointiprojekti_id')).sendKeys(inventointiprojekti);
		  element(by.model('kiinteisto.properties.inventointiprojekti.inventoija_id')).sendKeys(inventoija);
		  element(by.model('kiinteisto.properties.inventointiprojekti.kenttapaiva')).sendKeys(kenttapaiva);

		  //sijainti kartalle
		  element(by.css('[ng-click="togglePointTool()"]')).click();
		  element(by.css('.ol-unselectable')).click();//tämä clickaa keskelle sillä hetkellä näkyvää karttaa

		  //tallenna
		  element(by.buttonText('Toiminnot')).click();
		  var saveLink = element(by.id('kiinteisto_tallenna'));
		  expect(element(by.linkText('Tallenna')).getTagName()).toBe('a');
		  saveLink.click();
			  //Sulje Modaali
			  util.suljeModaali(kiinteistoModaaliId);
	  });

});
