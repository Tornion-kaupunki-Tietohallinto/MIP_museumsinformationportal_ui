/*
 * Löydön konservointiraportin luontinäkymä
 */
angular.module('mip.konservointi').controller(
  'ArkLoytoKonservointiraporttiController',
  [
    '$scope', 'AlertService', 'ListService', 'locale', 'NgTableParams', 'ToimenpideService',
    'selectedModalNameId', 'ModalControllerService', 'loyto', 'RaporttiService',
    function ($scope, AlertService, ListService, locale, NgTableParams, ToimenpideService,
      selectedModalNameId, ModalControllerService, loyto, RaporttiService) {

      var vm = this;

      /**
       * Controllerin set-up.
       */
      vm.setUp = function () {

        angular.extend(vm, ModalControllerService);

        // Valitun modalin nimi ja järjestysnumero
        vm.modalNameId = selectedModalNameId;
        vm.setModalId();

        // Tänne tulee aina löytö
        vm.loyto = loyto;
      };
      vm.setUp();

      /**
       * Sulkemisruksi.
       */
      $scope.close = function () {
        vm.close();
        $scope.$destroy();
      };

      /**
     * Toimenpiteet taulu
     */
      vm.toimenpiteetTable = new NgTableParams({
        page: 1,
        count: 100
      }, {
        getData: function ($defer, params) {

          filterParameters = ListService.parseParameters(params);

          // Lisätään löydön id hakuun
          if (vm.loyto) {
            filterParameters['loyto_id'] = vm.loyto.properties.id;
          }

          vm.toimenpiteetPromise = ToimenpideService.haeToimenpiteet(filterParameters);
          vm.toimenpiteetPromise.then(function (data) {

            if (data.count) {
              vm.toimenpiteita = data.count;
            } else {
              vm.toimenpiteita = 0;
            }

            params.total(data.total_count);
            $defer.resolve(data.features);

          }, function (data) {
            locale.ready('common').then(function () {
              AlertService.showWarning(locale.getString('common.Error'), AlertService.message(data));
            });
            $defer.resolve([]);
          });
        }
      });



      /*
       * Create a report
       * type: PDF / WORD / EXCEL ...
       */
      vm.createReport = function (type) {
        // Toimenpiteet jotka käyttäjä valitsi näytettäväksi raportille
        var valitutToimenpiteet = '';
        // Otetaan ark_kons_loyto id
        for(var i = 0; i < vm.toimenpiteetTable.data.length; i++) {
          if(vm.toimenpiteetTable.data[i].valittu && vm.toimenpiteetTable.data[i].valittu == true) {
            for(var j = 0; j < vm.toimenpiteetTable.data[i].properties.loydot.length; j++) {
              if(vm.toimenpiteetTable.data[i].properties.loydot[j].ark_loyto_id == vm.loyto.properties.id) {
                valitutToimenpiteet += vm.toimenpiteetTable.data[i].properties.loydot[j].id + ',';
                break;
              }
            }
          }
        }
        if(valitutToimenpiteet.length === 0) {
          // Jos valittuja toimenpiteitä ei ole, laitetaan listaan sellainen id, jolla ei löydy yhtään toimenpidettä
          // Muutoin raporttipohja saattaa jättää huomioimatta parametrin ja joinia mukaan kaikki toimenpiteet
          valitutToimenpiteet = '-1';
        } else {
          valitutToimenpiteet = valitutToimenpiteet.slice(0, -1); // Poistetaan viimeinen ,
        }

        //Asetetaan raportin "nimi" joka näkyy mm. raportit-välilehdellä
        //Raportin nimi + löydön luettelointinumero
        var reportDisplayName = locale.getString('ark.Conservation_report') + " " + vm.loyto.properties.luettelointinumero;

        var report = {'requestedOutputType': type, 'reportDisplayName': reportDisplayName, 'valitutToimenpiteet': valitutToimenpiteet, 'loytoId': vm.loyto.properties.id};

        RaporttiService.createRaportti('Loyto_konservointiraportti', report).then(function success(data) {
          AlertService.showInfo(locale.getString('common.Report_request_created'));
          vm.close();
        }, function error(data) {
          AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
        });
      };

      /**
       * Taulukon kolumnien tekstien haku
       */
      vm.getColumnName = function (column, lang_file) {
        var str;

        if (lang_file) {
          str = lang_file + '.' + column;
        } else {
          str = 'common.' + column;
        }

        return locale.getString(str);
      }
    }
  ]);
