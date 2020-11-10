/*
 * Tutkimus UI controller
 */
angular.module('mip.map').controller(
  'ReittiController',
  [
    '$scope', '$rootScope', 'TabService', '$location',
    'CONFIG', 'AlertService', 'ModalService', 'locale', 'LocationService',
    'selectedModalNameId', 'ModalControllerService', 'reitti', 'entiteettiTyyppi', 'entiteetti',
    function ($scope, $rootScope, TabService, $location,
      CONFIG, AlertService, ModalService, locale, LocationService,
      selectedModalNameId, ModalControllerService, reitti, entiteettiTyyppi, entiteetti) {

      var vm = this;

      /**
       * Controllerin set-up. Suoritetaan ainoastaan kerran.
       */
      vm.setUp = function () {

        angular.extend(vm, ModalControllerService);

        // Valitun modalin nimi ja järjestysnumero
        vm.modalNameId = selectedModalNameId;
        vm.setModalId();
        vm.entity = 'reitti';
        vm.reitti = reitti;
        vm.relatedEntityType = entiteettiTyyppi;
        vm.relatedEntity = entiteetti;
      };
      vm.setUp();

      /**
       * ModalHeader kutsuu scopesta closea
       */
      $scope.close = function () {
        vm.close();
        $scope.$destroy();
      };

      vm.delete = function () {
        var conf = confirm(locale.getString('common.Confirm_delete2', { 'item': locale.getString('map.Route')}));
        if (conf) {

          LocationService.poistaReitti(vm.reitti.properties.id).then(function (data) {
            vm.close();
            $scope.$destroy();
            locale.ready('common').then(function () {
              AlertService.showInfo(locale.getString('common.Deleted'));
              $rootScope.$broadcast("Reitti_modified", {
                'reitti_id': data.properties.id,
                'type': 'Delete'
              });

              $scope.close();
            });
          }, function error(data) {
            locale.ready('error').then(function () {
              AlertService.showError(locale.getString('error.Deleting_route_failed'), AlertService.message(data));
            });
          });
        }
      };
    }
  ]);
