angular.module('mip.search').controller('rakSearchListController', [
	'$scope', '$rootScope', '$route', '$location', 'locale', 'CONFIG', 'ModalService', 'SearchService', 'AlertService', '$q',
	function ($scope, $rootScope, $route, $location, locale, CONFIG, ModalService, SearchService, AlertService, $q) {
		/*
		 * TAB BAR
		 */
		locale.ready('common').then(function() {
			$rootScope.setActiveTab(locale.getString('common.Search'));
			$rootScope.setActiveSubTab(locale.getString('common.Building_inventory') + " " + locale.getString('common.Images'));
		});



	}
]);
