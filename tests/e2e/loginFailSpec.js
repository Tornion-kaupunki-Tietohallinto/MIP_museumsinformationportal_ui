/**
 * Virheellisen kirjautumisen testi, virheellinen salasana.
 * Parametrit luetaan conf.js tai annetaan käynnistettäessä.
 * @returns
 */

var loginpage = require('./page-objects/login-page');

describe('MIP login', function() {

	it('Epaonnistunut kirjautuminen, virheellinen salasana (server: '+browser.params.login.url+ ')', function() {

	  // Avaa login sivu
	  loginpage.get(browser.params.login.url);

	  loginpage.setUserEmail('paa');
	  loginpage.setPassword('huuhaa');

	  element(by.name('sbmt')).click();

	  // Alert box näytetään epäonnistuneest kirjautumisesta
	  expect(element(by.css('.alert-danger')).isDisplayed()).toBe(true);

	});
});