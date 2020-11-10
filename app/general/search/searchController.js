angular.module('mip.search').controller('SearchController', [
		'$scope', '$route', '$location', 'locale', 'CONFIG', 'ModalService', 'SearchService', 'AlertService', '$q', function ($scope, $route, $location, locale, CONFIG, ModalService, SearchService, AlertService, $q) {

			// Used for showing the limited amount on the UI and if there are more results, show "Show more" as the last result.
			$scope.searchLimit = CONFIG.SEARCH_LIMIT;

			$scope.search = function () {
				if ($scope.qry) {
					var deferred = $q.defer();

					var params = {
						'hakusana' : $scope.qry
					};
					SearchService.setParam('hakusana', $scope.qry);
					SearchService.search(params).then(function success (data) {
						// Add "Show more" to the end of the list
						// TODO: Sync the search parameter using the service.
						// but do not sync the parameter if it's "Show more"!
						/*
						 * if (data.data.response.numFound > $scope.searchLimit) { var more = { 'id' : -1, 'nimi' : locale.getString('common.Show_more') } data.data.response.docs.push(more); }
						 */
						deferred.resolve(data.data.response.docs);
					}, function error (data) {
						deferred.reject(data);
					});
					return deferred.promise;
				} else {
					SearchService.deleteParam('hakusana');
				}
			};
			/*
			 * The Solr search engine does the filtering & matching, no need to filter the results anymore by the typeahead.
			 */
			$scope.comp = function () {				
				return true;
			};

			$scope.$on('$typeahead.select', function (event, value, index, elem) {

				if (value.id == -1) {
					$scope.navigateToSearchPage();
					$scope.qry = '';
				} else {
					ModalService.openModal(value.doc_type, value.id);
				}
			});

			
			$scope.navigateToSearchPage = function () {
				//If we're already on the search page, reload the route again to update the parameters.
				if ($location.path() == '/haku') {
					$route.reload();
				} else {
					$location.path('/haku');
				}
			};
		}
]);
