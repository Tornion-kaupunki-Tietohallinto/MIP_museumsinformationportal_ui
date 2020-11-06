angular.module('mip.search').controller(
		'SearchPageController',
		[
				'$scope', '$location', 'TabService', 'ListService', '$filter', 'locale', 'CONFIG', 'ModalService', 'SearchService', 'AlertService', '$q', 'NgTableParams', '$rootScope',
				function ($scope, $location, TabService, ListService, $filter, locale, CONFIG, ModalService, SearchService, AlertService, $q, NgTableParams, $rootScope) {
					/*
					 * TAB BAR
					 */
					locale.ready('common').then(function() {
						$rootScope.setActiveTab(locale.getString('common.Search'));
						$rootScope.setActiveSubTab('');
					});
					
					$scope.tulokset = [];
					$scope.valinta = {};
					$scope.totalCount = 0; // dummy value
					// Used for showing the limited amount on the UI and if there are more results, show "Show more" as the last result.
					$scope.searchLimit = CONFIG.SEARCH_LIMIT;

					/*
					 * Search functionality.
					 */
					$scope.search = function (hakusana) {
						if (hakusana) {
							var deferred = $q.defer();
							SearchService.search(hakusana, null, 100).then(function success (data) {
								$scope.tulokset = data.data.response.docs;
								$scope.totalCount = data.data.response.numFound;
								deferred.resolve(data.data.response.docs);
								$scope.resultsTable.reload();
							}, function error (data) {
								deferred.reject(data);
							});
							return deferred.promise;
						} else {
							$scope.qry = '';
							$scope.valinta = {};
							$scope.tulokset = [];
						}
					}

					/*
					 * RESULT LISTING TABLE
					 */
					$scope.resultsTable = new NgTableParams({
						page : 1,
						count : 50,
						total : 10, // dummy value
						groupBy : {
							doc_type : "asc"
						}
					}, {
						getData : function ($defer, params) {
							if (params.filter().qry) {

								filterParameters = ListService.parseParameters(params);
								if (filterParameters['undefined']) {
									filterParameters.hakusana = filterParameters['undefined'];
								}
								delete filterParameters['undefined'];

								SearchService.search(filterParameters).then(function (data) {
									// var orderedData = params.sorting() ? $filter('orderBy')(data.data.response.docs, params.orderBy()) : data.data.response.docs;
									// var resultData = orderedData;
									params.total(data.data.response.numFound);
									$defer.resolve(data.data.response.docs);
								}, function (data) {
									AlertService.showWarning("", locale.getString('common.No_results_found'));

									var data = [];
									$defer.resolve(data);
								});
							} else {
								$scope.qry = '';
								$scope.valinta = {};

								var data = [];
								$defer.resolve(data);
							}

						}
					});

					/*
					 * The Solr search engine does the filtering & matching, no need to filter the results anymore by the typeahead.
					 */
					$scope.comp = function () {						
						return true;
					};

					/*
					 * Clear the results
					 */
					$scope.clearResults = function () {
						$scope.qry = '';
						$scope.tulokset = [];
					};

					$scope.$on('$typeahead.select', function (event, value, index, elem) {
						$scope.valinta = value;
					});

					$scope.selectResult = function (result) {
						ModalService.openModal(result.doc_type, result.id);
					};

					/*
					 * If we come here from the navbar search functionality
					 */
					if (SearchService.getParams().hakusana) {
					    $scope.resultsTable.filter().qry = SearchService.getParams().hakusana;
					}

					$scope.getColumnName = function (column) {
						return ListService.getColumnName(column);
					};

				}
		]);
