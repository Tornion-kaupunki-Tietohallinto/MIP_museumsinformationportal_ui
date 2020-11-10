/**
 * Protratcor asetukset.
 * Ajetaan kaikki testit tai vain halutun suiten voi ajaa cmd-promptilla esim. protractor --suite inventointiprojekti
 * params -> voidaan määrittää mitä serveriä vasten ajetaan esim.
 * >protractor conf.js --params.login.url "" --params.login.email "" --params.login.password ""
 */

var Jasmine2HtmlReporter = require('protractor-jasmine2-html-reporter');

exports.config = {
  framework: 'jasmine',
  seleniumAddress: 'http://localhost:4444/wd/hub',
  // Oletuksena localhost kirjautuminen
  params: {
	    login: {
	      url: 'http://localhost/MIPKantasiirto/frontend/app/',
	      email: '',
	      password: ''
	    }
  },
  // Ajettavat testit
  suites:{
    virhe_kirjautuminen: 'loginFailSpec.js',
	kirjaudu: 'loginSpec.js',
	navigointi: ['navigationSpec.js', 'modalnavigationSpec.js' ],
	inventointiprojekti: ['loginSpec.js', './inventointiprojekti/inventointiprojektiSpec.js'],
	kiinteistoLuonti: ['loginSpec.js', './kiinteisto/kiinteistoLuontiSpec.js', './kiinteisto/kiinteistoValidointiSpec.js'],
	kiinteistoMuokkaus: ['loginSpec.js', './kiinteisto/kiinteistoMuokkausSpec.js', './kiinteisto/kiinteistoMuokkausValidointiSpec.js'],
	rakennusLuonti: ['loginSpec.js', './rakennus/rakennusLuontiSpec.js'],
	rakennusMuokkaus: ['loginSpec.js', './rakennus/rakennusMuokkausSpec.js'],
	rakennusPoisto: ['loginSpec.js', './rakennus/rakennusPoistoSpec.js'],
	kiinteistoPoisto: ['loginSpec.js', './kiinteisto/kiinteistoPoistoSpec.js'],
	kirjauduUlos: 'logoutSpec.js',
	konsoliViestit: 'consoleErrorSpec.js'
  },

  // Raporttien konfiguraatio
  onPrepare: function() {
      jasmine.getEnv().addReporter(
        new Jasmine2HtmlReporter({
          savePath: './target/reports/',
          takeScreenshots: false,
          cleanDestination: false,
          fileName: 'Mip_test_report',
          fileNameDateSuffix: true
        })
      );
   },
   // Headless mode. Poistamalla kommentit testi ajetaan ilman näkyvää selainta.
   capabilities: {
		  browserName: 'chrome'/*,

		  chromeOptions: {
		     args: [ "--headless", "--disable-gpu", "--window-size=800,600" ]
		   }*/
	  }
}
