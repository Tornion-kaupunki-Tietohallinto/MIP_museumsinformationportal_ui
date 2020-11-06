/**
 * Kiinteiston page-object
 */
var KiinteistoPage = function(){
	
	// Input kentät
	var nimi = element(by.model('kiinteisto.properties.nimi'));
	var osoite = element(by.model('kiinteisto.properties.osoite'));
	var postinumero = element(by.model('kiinteisto.properties.postinumero'));
	
	this.setNimi = function(kiintNimi){
		nimi.clear().sendKeys(kiintNimi);
	};
	
	this.setOsoite = function(kiintOsoite){
		osoite.clear().sendKeys(kiintOsoite);
	};
	
	this.setPostinumero = function(kiintPostinumero){
		postinumero.clear().sendKeys(kiintPostinumero);
	};
	
	this.setMuokattuNimi = function(kiintMuokattuNimi){
		nimi.clear().sendKeys(kiintMuokattuNimi);
	};
	
	this.setMuokattuOsoite = function(kiintMuokattuOsoite){
		osoite.clear().sendKeys(kiintMuokattuOsoite);
	};
	
	this.setMuokattuPostinumero = function(kiintMuokattuPostinumero){
		postinumero.clear().sendKeys(kiintMuokattuPostinumero);
	};
	
	// Kunnan valinta. (valitsee aina 2. kunnan, tähän pitäisi keksiä parempi keino ja siirtää util-page.ja luokkaan)
	this.valitseKuntaAura = function(){
		element(by.model('selectedKunta.kunta')).click();
		browser.actions().sendKeys(protractor.Key.DOWN).perform();	
		browser.actions().sendKeys(protractor.Key.UP).perform();
		browser.actions().sendKeys(protractor.Key.ENTER).perform();
	};
	
	this.valitseKuntaKaarina = function(){
		element(by.model('selectedKunta.kunta')).click();
		browser.actions().sendKeys(protractor.Key.DOWN).perform();	
		browser.actions().sendKeys(protractor.Key.DOWN).perform();	
		browser.actions().sendKeys(protractor.Key.UP).perform();
		browser.actions().sendKeys(protractor.Key.ENTER).perform();
	};
	
	this.valitseKyla = function(){
		element(by.model('kiinteisto.properties.kyla')).click();
		browser.actions().sendKeys(protractor.Key.DOWN).perform();
		browser.actions().sendKeys(protractor.Key.UP).perform();
		browser.actions().sendKeys(protractor.Key.ENTER).perform();
	};

};

module.exports = new KiinteistoPage();