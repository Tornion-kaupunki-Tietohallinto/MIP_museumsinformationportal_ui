/*
 * Löydön konservointiraportin luontinäkymä
 */
angular.module('mip.tutkimus').controller(
  'ArkTutkimusraporttiController',
  [
    '$scope', 'AlertService', 'ListService', 'locale', 'NgTableParams', 'ToimenpideService',
    'selectedModalNameId', 'ModalControllerService', 'tutkimus', 'RaporttiService',
    function ($scope, AlertService, ListService, locale, NgTableParams, ToimenpideService,
      selectedModalNameId, ModalControllerService, tutkimus, RaporttiService) {

      var vm = this;

      /**
       * Controllerin set-up.
       */
      vm.setUp = function () {

        angular.extend(vm, ModalControllerService);

        // Valitun modalin nimi ja järjestysnumero
        vm.modalNameId = selectedModalNameId;
        vm.setModalId();

        // Tänne tulee aina tutkimus
        vm.tutkimus = tutkimus;
      };
      vm.setUp();

      /**
       * Sulkemisruksi.
       */
      $scope.close = function () {
        vm.close();
        $scope.$destroy();
      };

      /*
       * Create a report
       * type: PDF / WORD / EXCEL ...
       */
      vm.createReport = function (type) {

        //Asetetaan raportin "nimi" joka näkyy mm. raportit-välilehdellä
        //Raportin nimi + löydön luettelointinumero
        var reportDisplayName = locale.getString('ark.Research') + " " + vm.loyto.properties.luettelointinumero;

        var report = {'requestedOutputType': type, 'reportDisplayName': reportDisplayName, 'tutkimusId': vm.tutkimus.properties.id};

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
