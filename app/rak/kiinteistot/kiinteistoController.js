/*
 * Controller for the kiinteistöt.
 */
angular.module('mip.kiinteisto').controller(
        'KiinteistoController',
        [
                '$scope', '$q', 'TabService', '$location', 'KiinteistoService', 'CONFIG', '$http', 'KuntaService', 'ModalService', 'RakennusService', 'AlertService', 'MapService',
                '$timeout', 'KylaService', 'coordinates', '$rootScope', 'olData', '$popover', 'hotkeys', 'kiinteisto', 'ListService', 'FileService', 'locale', 'InventointiprojektiService',
                'MuutoshistoriaService', 'UserService', 'permissions', 'rakennusPermissions', 'NgTableParams', '$filter', 'SessionService', 'EntityBrowserService', 'selectedModalNameId',
                'RaporttiService', 'MatkaraporttiService', 'AlueService', 'ArvoalueService', '$sce',
                function($scope, $q, TabService, $location, KiinteistoService, CONFIG, $http, KuntaService, ModalService, RakennusService, AlertService, MapService,
                        $timeout, KylaService, coordinates, $rootScope, olData, $popover, hotkeys, kiinteisto, ListService, FileService, locale, InventointiprojektiService,
                        MuutoshistoriaService, UserService, permissions, rakennusPermissions, NgTableParams, $filter, SessionService, EntityBrowserService, selectedModalNameId,
                        RaporttiService, MatkaraporttiService, AlueService, ArvoalueService, $sce) {
                    /*
                     * Init and scope variables
                     */
                    // map id fetching
                    var _mapId = $rootScope.getNextMapId();
                    $scope.mapId = "kiinteistoMap" + _mapId;
                    $scope.mapPopupId = "kiinteistoMapPopup" + _mapId;
                    $scope.map = null;
                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();

                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;
                    $scope._selectedImages =[];

                    // Unique kiinteistotunnus, will be checked when the kiinteistotunnus has been filled in
                    $scope.uniqueKiinteistotunnus = true;
                    // Used in the error text
                    $scope.nextFreeColumnNumber = null;
                    // Unique palstanumero, will be checked when the kiinteistotunnus has been filled in or palstanumero has been changed
                    $scope.uniquePalstanumero = true;

                    // Is the form in edit mode or not
                    $scope.edit = false;

                    $scope.currentLocale = locale.getLocale();

                    // Options for NoYes dropdown list
                    $scope.noYes = ListService.getNoYes();

                    // Used to force the inventoija users to set the inventointiprojekti before the saving is allowed
                    $scope.userRole = UserService.getProperties().user.rooli;

                    // Is the user inventory auditor?
                    $scope.isInventor = false;

                    // Are we creating a new one or doing legitimate editing?
                    // If this is true, some buttons are hidden.
                    $scope.create = false;

                    // Helper variable
                    var existing;

                    // is the point setting tool active or not? Defaults to not
                    $scope.pointTool = false;

                    // Enable / Disable save and cancel buttons while doing operations.
                    $scope.disableButtons = false;
                    $scope.disableButtonsFunc = function() {
                        if ($scope.disableButtons) {
                            $scope.disableButtons = false;
                        } else {
                            $scope.disableButtons = true;
                        }
                    };

                    //Ladataan käännökset valmiiksi
                    locale.ready('estate').then();
                    locale.ready('common').then();
                    locale.ready('error').then();

                    //list that contains inventoiniprojects that are deleted after saving edit
                    $scope.inventointiprojektiDeleteList = [];

                    $scope.showShowMoreAddressesButton = false;

                    //method that adds to list that contains inventoiniprojects that are deleted after saving edit
                    $scope.addToInventointiprojektiDeleteList = function (inventointiprojektiId, inventoijaId) {
                    	var obj = {inventointiprojektiId:inventointiprojektiId, inventoijaId:inventoijaId};
                    		$scope.inventointiprojektiDeleteList.push(obj);

                    	for (var i = 0; i < $scope.kiinteisto.properties.inventointiprojektit.length; i++){
                    		var ip = $scope.kiinteisto.properties.inventointiprojektit[i];
                    		if(ip.id === inventointiprojektiId){
                    			for(var j = 0; j < ip.inventoijat.length; j++){
                    				if(ip.inventoijat[j].inventoija_id === inventoijaId){
                    					ip.inventoijat.splice(j, 1);
                    					break;
                    				}
                    			}
                        		if(ip.inventoijat.length === 0){
                        			$scope.kiinteisto.properties.inventointiprojektit.splice(i, 1);
                        		}
                    			break;
                    		}
                    	}
                    };

                    /*
                     * Helper method for the details tool
                     */
                    $scope.getDetails = function() {
                        if ($scope.kiinteisto.properties.sijainti) {
                            var coord = $scope.kiinteisto.properties.sijainti.split(" ");
                            // Transform the coordinates of the estate
                            var prj = ol.proj.transform([
                                    coord[0], coord[1]
                            ], 'EPSG:4326', 'EPSG:3067').map(function(c) {
                                return c.toFixed(4);
                            });

                            var lat = parseFloat(prj[1]);
                            var lon = parseFloat(prj[0]);

                            MapService.fetchEstateDetails(lon, lat).then(function success(data) {
                                ModalService.kiinteistoFetchedDetailsModal(data, $scope.kiinteisto, $scope.modalId);
                            }, function error() {
                                locale.ready('estate').then(function() {
                                    AlertService.showError(locale.getString('common.Error'), locale.getString('error.Estate_provider_could_not_be_contacted'));
                                });
                            });
                        }
                    };

                    //Parse the estate links to museums. Split each link by '\n' and each title by the first occurrence of ':'
                    $scope.links = [];
                    $scope.parseLinks = function() {
                    	$scope.links.length = 0;
                    	var data = $scope.kiinteisto.properties.linkit_paikallismuseoihin;
                    	if(data) {
	                    	var rowData = data.split('\n');
	                    	for (var i = 0; i < rowData.length; i++) {
		                    	var title = '';
		                    	var link = '';
		                    	if(rowData[i].split(':').length === 3) {
		                    		var splitted = rowData[i].split(':');
		                    		title = splitted[0];
		                    		splitted.shift();
		                    		link = splitted.join(':');
		                    	} else {
		                    		title = rowData[i];
		                    		link = rowData[i];
		                    	}
		                    	$scope.links.push({'title': title, 'link': $sce.trustAsUrl(link)});
	                    	}
                    	}
                    }

                    // Get the kiinteisto that was selected (if any; will be
                    // empty if creating a new one)
                    if (kiinteisto) {
                        existing = true;
                        $scope.kiinteisto = kiinteisto;

                        if ($scope.kiinteisto.properties.kiinteistotunnus) {
                            $scope.kiinteistotunnus_osat = $scope.kiinteisto.properties.kiinteistotunnus.split("-");
                        } else {
                            $scope.kiinteistotunnus_osat = [];
                        }
                        $scope.parseLinks();
                    } else {
                        existing = false;
                        $scope.kiinteistotunnus_osat = [];
                        $scope.kiinteisto = {
                            'geometry' : {
                                'crs' : {
                                    'properties' : {
                                        'name' : 'urn:ogc:def:crs:OGC:1.3:CRS84'
                                    },
                                    'type' : 'name'
                                },
                                'coordinates' : [],
                                'type' : 'Point'
                            },
                            'properties' : {
                                'aluetyypit' : [],
                                'historialliset_tilatyypit' : [],
                                'kulttuurihistoriallisetarvot' : [],
                                'suojelutiedot' : [],
                                'kiinteistotunnus' : '',
                                'julkinen' : true,
                                'arkeologinen_kohde' : $scope.noYes[0].value
                            },
                            'type' : 'Feature'
                        };
                    }

                    // If the user is katselija and the kiinteisto is not julkinen, we do not want to show all of the fields.
                    $scope.showFields = false;
                    $scope.showFieldsFunc = function() {
                        if ($scope.userRole == 'katselija' && $scope.kiinteisto.properties.julkinen == undefined) {
                            $scope.showFields = false;
                        } else {
                            $scope.showFields = true;
                        }
                    };
                    $scope.showFieldsFunc();

                    // existing = true when viewing an existing property
                    // false when creating a new one
                    if (!existing) {
                        $scope.edit = true;
                        $scope.create = true;
                    }
                    // If we resolved coordinates (and the kiinteisto isn't an existing one)
                    // Set the kiinteistö coordinates and sijainti. We will also center to that location.
                    if (coordinates && !existing) {
                        $scope.kiinteisto.geometry['coordinates'] = coordinates;
                        $scope.kiinteisto.properties["sijainti"] = coordinates[0] + " " + coordinates[1];

                        // Open the ktj search automatically on the location
                        $scope.getDetails();
                    }

                    /*
                     * Helper function - The original selection list items are filtered so that the already selected items are not present This method puts the items back to the list if/when they are removed.
                     */
                    $scope.addItemBackToList = function(item, model) {
                        for (var i = 0; i < model.length; i++) {
                            if (model[i].id == item.id) {
                                return;
                            }
                        }
                        model.push(item);
                    };

                    /*
                     * Is the user inventory auditor or not?
                     */
                    $scope.isInventorFunc = function() {
                        // Get only the inventor's inventory projects
                        var role = $filter('uppercase')($scope.userRole);

                        angular.forEach(CONFIG.ROLES.PROJECT, function(value, key) {
                            // Below is the U+1F44D way to check. Here is a hack U+1F644
                            if (value == 4 && role == key || value == 4 && role == 'INVENTOIJA') {
                                $scope.isInventor = true;
                            }
                        });
                    };
                    $scope.isInventorFunc();

                    /*
                     * Saako käyttäjä lisätä matkaraportteja? Ainoastaan pääkäyttäjä ja tutkija saavat.
                     */
                    $scope.voiLisataMatkaraportteja = false;
                    $scope.voiLisataMatkaraporttejaFunc = function() {
                        // Get only the inventor's inventory projects
                        var role = $filter('uppercase')($scope.userRole);

                        angular.forEach(CONFIG.ROLES.PROJECT, function(value, key) {
                            // Below is the U+1F44D way to check. Here is a hack U+1F644
                            if ((value == 5 && role == key || value == 5 && role == 'PÄÄKÄYTTÄJÄ') || (value == 2 && role == key || value == 2 && role == 'TUTKIJA')) {
                                $scope.voiLisataMatkaraportteja= true;
                            }
                        });
                    };
                    $scope.voiLisataMatkaraporttejaFunc();



                    // Store the original kiinteisto for possible cancel
                    // operation
                    $scope.original = angular.copy($scope.kiinteisto);


                    // Map is added to the DOM after the modal is shown,
                    // otherwise it
                    // will not be drawn until page resize
                    $scope.showMap = false;

                    // Store permissions to kiinteisto & rakennus entities to scope
                    $scope.permissions = permissions;
                    $scope.rakennusPermissions = rakennusPermissions;

                    // regex for kiinteistotunnus
                    $scope.kiinteistotunnusRegex = /^\d{3}-\d{3}-\d{4}-\d{4}$/;

                    /*
                     * FETCH RELATED DATA AND DATA USED IN EDITING
                     */
                    /*
                     * Kunnat
                     */
                    $scope.kunnat = [];
                    $scope.getKunnat = function() {
                        if ($scope.create || ($scope.edit && $scope.kunnat.length == 0)) {
                            KuntaService.getKunnat({
                                'rivit' : '10000'
                            }).then(function success(data) {
                                // get rid of the geojson "wrapper"
                                for (var i = 0; i < data.features.length; i++) {
                                    $scope.kunnat.push(data.features[i].properties);
                                }
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_modification_history_failed"), AlertService.message(data));
                                })
                            });
                        }
                    };
                    $scope.getKunnat();

                    /*
                     * Images
                     */
                    $scope.images = [];
                    $scope.getImages = function() {
                        if ($scope.kiinteisto.properties.id && $scope.showFields) {
                            FileService.getImages({
                                'jarjestys' : 'jarjestys',
                                'jarjestys_suunta' : 'nouseva',
                                'rivit' : 1000,
                                'kiinteisto_id' : $scope.kiinteisto.properties.id
                            }).then(function success(images) {
                                $scope.images = images.features;
                                // Kuvien määrä (directives.js)
                                $scope.kuvia_kpl = $scope.images.length;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_images_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getImages();

                    /*
                     * RakennusImages - the array is filled in after fetching the rakennukset.
                     */
                    $scope.rakennusImages = [];

                    /*
                     * Files
                     */
                    $scope.files = [];
                    $scope.getFiles = function() {
                        if ($scope.kiinteisto.properties.id && $scope.showFields) {
                            FileService.getFiles({
                                'rivit' : 1000,
                                'kiinteisto_id' : $scope.kiinteisto.properties.id
                            }).then(function success(files) {
                                $scope.files = files.features;
                                // Tiedostojen määrä (directives.js)
                                $scope.kpl_maara = $scope.files.length;
                            }, function error(data) {
                                locale.ready('estate').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_files_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getFiles();

                    /*
                     * Tilatyyppi
                     */
                    $scope.tilatyyppiOptions = [];
                    $scope.getTilatyyppiOptions = function() {
                        if ($scope.create || ($scope.edit && $scope.tilatyyppiOptions.length == 0)) {
                            ListService.getOptions('tilatyyppi').then(function success(options) {
                                $scope.tilatyyppiOptions = options.filter(function(i) {
                                    return $scope.kiinteisto.properties.historialliset_tilatyypit.map(function(e) {
                                        return e.id;
                                    }).indexOf(i.id) < 0;
                                });
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_propertytypes_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getTilatyyppiOptions();

                    /*
                     * Aluetyyppi
                     */
                    $scope.aluetyyppiOptions = [];
                    $scope.getAluetyyppiOptions = function() {
                        if ($scope.create || ($scope.edit && $scope.aluetyyppiOptions.length == 0)) {
                            ListService.getOptions('aluetyyppi').then(function success(options) {
                                $scope.aluetyyppiOptions = options.filter(function(i) {
                                    return $scope.kiinteisto.properties.aluetyypit.map(function(e) {
                                        return e.id;
                                    }).indexOf(i.id) < 0;
                                });
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_areatypes_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getAluetyyppiOptions();

                    /*
                     * Arvotus
                     */
                    $scope.arvotusOptions = [];
                    $scope.getArvotusOptions = function() {
                        if ($scope.create || ($scope.edit && $scope.arvotusOptions.length == 0)) {
                            ListService.getOptions('arvotus').then(function success(options) {
                                $scope.arvotusOptions = options;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_valuation_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getArvotusOptions();

                    /*
                     * Suojelu
                     */
                    $scope.suojeluOptions = [];
                    $scope.getSuojeluOptions = function() {
                        if ($scope.create || ($scope.edit && $scope.suojeluOptions.length == 0)) {
                            ListService.getOptions('suojelutyypit').then(function success(options) {

                                // lets "flatten" the data for select to work correctly, to create the groups
                                angular.forEach(options, function(grp) {
                                    angular.forEach(grp.suojelutyypit, function(st) {
                                        st.suojelutyyppi_ryhma_nimi = grp.nimi_fi;
                                        $scope.suojeluOptions.push(st);
                                    })
                                });

                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_protection_options_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };

                    $scope.getSuojeluOptions();

                    /*
                     * Kulttuurihistorialliset arvot
                     */
                    $scope.kultHistArvot = [];
                    $scope.getKulttuurihistoriallisetArvotOptions = function() {
                        if ($scope.create || ($scope.edit && $scope.kultHistArvot.length == 0)) {
                            ListService.getOptions('kulttuurihistoriallinenarvo', 'kiinteisto').then(function success(options) {
                                for (var i = 0; i < options.data.features.length; i++) {
                                    var opt = options.data.features[i];
                                    $scope.kultHistArvot.push({
                                        id : opt.properties.id,
                                        nimi_fi : opt.properties.nimi_fi,
                                        nimi_se : opt.properties.nimi_se
                                    });
                                }
                            });
                        }
                    };
                    $scope.getKulttuurihistoriallisetArvotOptions();

                    /*
                     * Inventory projects
                     */
                    $scope.inventointiprojektit = [];
                    $scope.getInventointiprojektit = function() {

                        // Now get the actual data...
                        if ($scope.isInventor || $scope.userRole === 'tutkija') {
                            UserService.getUserInventoryProjects(UserService.getProperties().user.id).then(function success(data) {
                                $scope.inventointiprojektit = data;
                            }, function error(data) {
                                locale.ready('error').then(function success() {
                                    AlertService.showError(locale.getString("error.Getting_inventoryprojects_failed"), AlertService.message(data));
                                })
                            });
                        } else {
                            if ($scope.create || ($scope.edit && $scope.inventointiprojektit.length == 0)) {
                                InventointiprojektiService.getInventointiprojektit({
                                    'rivit' : 1000000,
                                    'jarjestys' : 'nimi'
                                }).then(function success(results) {
                                    $scope.inventointiprojektit = results.features;
                                });
                            }
                        }
                    };
                    $scope.getInventointiprojektit();

                    /*
                     * Set the inventointiprojekti value or delete everything if no project selected.
                     */
                    $scope.inventointiprojektiChanged = function() {
                        if ($scope.kiinteisto.properties.inventointiprojekti.inventointiprojekti_id) {

                            //Asetetaan käyttäjä
                            $scope.kiinteisto.properties.inventointiprojekti.inventoija_id = UserService.getProperties().user.id;

                            /*
                             * Inventointipäivän asetus. Haetaan inventointiprojektilistasta valittu inventointiprojekti ja tältä
                             * oikean inventoijan kohdalta inventointipaiva.
                             * Jos inventointipaivaa ei ole (tai sen asettaminen ei muuten onnistunut), asetetaan inventointipaivaksi kuluva paiva.
                             */
                            if($scope.kiinteisto.properties.inventointiprojektit) {
                                for(var i = 0; i<$scope.kiinteisto.properties.inventointiprojektit.length; i++) {
                                    var ip = $scope.kiinteisto.properties.inventointiprojektit[i];

                                    var dateToSet = null;
                                    if(ip.id == $scope.kiinteisto.properties.inventointiprojekti.inventointiprojekti_id) {
                                        for(var j = 0; j<ip.inventoijat.length; j++) {
                                            if(ip.inventoijat[j].inventoija_id == $scope.kiinteisto.properties.inventointiprojekti.inventoija_id) {
                                                if(angular.isDate(ip.inventoijat[j].inventointipaiva)) {
                                                    dateToSet = ip.inventoijat[j].inventointipaiva;
                                                } else {
                                                    var d = $filter('pvm')(ip.inventoijat[j].inventointipaiva);
                                                    d = new Date(d);
                                                    dateToSet = d;
                                                }
                                                break;
                                            }
                                        }
                                    }
                                    if(dateToSet != null) {
                                        break;
                                    }
                                }
                                $scope.kiinteisto.properties.inventointiprojekti.inventointipaiva = dateToSet;
                            }
                            if($scope.kiinteisto.properties.inventointiprojekti.inventointipaiva == null) {
                                $scope.kiinteisto.properties.inventointiprojekti.inventointipaiva = new Date();
                            }

                            /*
                             * Kenttäpäivän asetus, samoin kuten inventointipaiva yllä, paitsi että kenttapaiva ei saa kuluvaa paivaa arvoksi, vaan jää tyhjäksi.
                             */
                            if($scope.kiinteisto.properties.inventointiprojektit) {
                                for(var i = 0; i<$scope.kiinteisto.properties.inventointiprojektit.length; i++) {
                                    var ip = $scope.kiinteisto.properties.inventointiprojektit[i];

                                    var dateToSet = null;
                                    if(ip.id == $scope.kiinteisto.properties.inventointiprojekti.inventointiprojekti_id) {
                                        for(var j = 0; j<ip.inventoijat.length; j++) {
                                            if(ip.inventoijat[j].inventoija_id == $scope.kiinteisto.properties.inventointiprojekti.inventoija_id) {
                                                if(angular.isDate(ip.inventoijat[j].kenttapaiva)) {
                                                    dateToSet = ip.inventoijat[j].kenttapaiva;
                                                } else {
                                                    var d = $filter('pvm')(ip.inventoijat[j].kenttapaiva);
                                                    d = new Date(d);
                                                    dateToSet = d;
                                                }
                                                break;
                                            }
                                        }
                                    }
                                    if(dateToSet != null) {
                                        break;
                                    }
                                }
                                $scope.kiinteisto.properties.inventointiprojekti.kenttapaiva = dateToSet;
                            }
                        } else {
                            delete $scope.kiinteisto.properties.inventointiprojekti;
                        }
                    };

                    $scope.inventointiprojektiTable = new NgTableParams({
                        page : 1,
                    // count : 10,
                    // total : 25
                    // dummy data
                    }, {
                        counts : [], // No page sizes -> disabled
                        getData : function($defer, params) {
                            if (!$scope.create) {
                                if ($scope.kiinteisto.properties.inventointiprojektit) {
                                    var orderedData = $scope.kiinteisto.properties.inventointiprojektit;
                                    $defer.resolve(orderedData);
                                }
                            }
                        }
                    });

                    $scope.showMuutoshistoria = function() {
                        MuutoshistoriaService.getKiinteistoMuutosHistoria($scope.kiinteisto.properties.id).then(function(historia) {
                            ModalService.kiinteistoMuutoshistoriaModal(historia, $scope.kiinteisto.properties.kiinteistotunnus);
                        });
                    };

                    /*
                     * Users
                     */
                    $scope.users = [];
                    $scope.getUsers = function() {

                        // It's inventor doing the job. We push only the inventor to the users list.
                        if ($scope.isInventor) {
                            var user = {
                                'properties' : {}
                            };
                            user.properties = UserService.getProperties().user;
                            $scope.users = [];
                            $scope.users.push(user);
                        } else {

                            if ($scope.create || ($scope.edit && $scope.users.length == 0)) {
                                UserService.getUsers({
                                    'rivit' : 1000000,
                                    'jarjestys' : 'etunimi',
                                    'aktiivinen' : 'true',
                                    'inventoijat' : true
                                }).then(function success(users) {
                                    $scope.users = users.features;
                                }, function error(data) {
                                    locale.ready('error').then(function() {
                                        AlertService.showError(locale.getString("error.Getting_inventor_list_failed"), AlertService.message(data));
                                    })
                                });
                            }
                        }
                    };
                    $scope.getUsers();
                    // Set the default inventoija as the user
                    // $scope.kiinteisto.properties.inventoija_id = UserService.getProperties().user.id;


                    /*
                     * Rakennukset: the rakennus entities of this kiinteisto. If any.
                     */
                    $scope.rakennukset = [];
                    $scope.getRakennukset = function() {

                        // Reset the images
                        $scope.rakennusImages.length = 0;

                        // Reet the rakennukset
                        $scope.rakennukset.length = 0;

                        if ($scope.rakennusPermissions.katselu && $scope.showFields) {

                            var kiinteistoId = $scope.kiinteisto.properties.id;
                            if (kiinteistoId) {
                                var promise = KiinteistoService.getRakennuksetOfKiinteisto(kiinteistoId);

                                promise.then(function(rakennukset) {
                                    $scope.showRakennusOsoitteet = false;

                                    if (rakennukset) {
                                        // Set showRakennusosoitteet
                                        for (var i = 0; i < rakennukset.length; i++) {
                                            var osoiteCount = 0;
                                            if (rakennukset[i].properties.osoitteet.length > 0) {
                                                $scope.showRakennusOsoitteet = true;
                                                if(i!=0 && rakennukset[i].properties.osoitteet.length > 0) {
                                                    $scope.showShowMoreAddressesButton = true;
                                                }
                                            }
                                        }

                                        var promises = [];

                                        // Get the images for each of the rakennukset
                                        for (var j = 0; j < rakennukset.length; j++) {

                                            var promise = FileService.getImages({
                                                'jarjestys' : 'jarjestys',
                                                'jarjestys_suunta' : 'nouseva',
                                                'rivit' : 1000,
                                                'rakennus_id' : rakennukset[j].properties.id
                                            });

                                            promises.push(promise);
                                        }

                                        $q.all(promises).then(function(data) {
                                            for(var i = 0; i<data.length; i++) {
                                                if(data[i].features) {
                                                    for(var j = 0; j<data[i].features.length; j++) {
                                                        $scope.rakennusImages.push(data[i].features[j]);
                                                    }
                                                }
                                            }
                                            // Rakennusten kuvien määrä
                                            $scope.kpl_maara = $scope.rakennusImages.length;
                                        });

                                        // Hack hack hack:
                                        // We want to show the inventointinumero on top of the circle only in this view.
                                        // Applying a custom style or selecting a new layer "TextLayer" didn't do the job well, therefore this.
                                        for (var i = 0; i < rakennukset.length; i++) {
                                            rakennukset[i].properties['showLabel'] = true;
                                        }

                                        $scope.rakennukset = rakennukset;
                                        $scope.selectedLayers.push('Rakennukset');
                                        MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);

                                        var rakennusLayer = null;

                                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                                            if ($scope.mapLayers[i].name == 'Rakennukset') {
                                                rakennusLayer = $scope.mapLayers[i];
                                            }
                                        }

                                        // Clear the layer before adding the rakennukset again.
                                        rakennusLayer.source.geojson.object.features.length = 0;

                                        if (rakennusLayer != null && $scope.rakennukset) {
                                            for (var i = 0; i < $scope.rakennukset.length; i++) {
                                                rakennusLayer.source.geojson.object.features.push($scope.rakennukset[i]);
                                            }
                                        }
                                    } else {
                                        $scope.rakennukset.length = 0;

                                        // Clear the layer also
                                        var rakennusLayer = null;
                                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                                            if ($scope.mapLayers[i].name == 'Rakennukset') {
                                                rakennusLayer = $scope.mapLayers[i];
                                            }
                                        }

                                        rakennusLayer.source.geojson.object.features.length = 0;
                                    }
                                }, function(data) {
                                    locale.ready('error').then(function() {
                                        AlertService.showError(locale.getString("error.Getting_buildings_failed"), AlertService.message(data));
                                    });

                                    $scope.rakennukset.length = 0;

                                    // Clear the layer also
                                    var rakennusLayer = null;
                                    for (var i = 0; i < $scope.mapLayers.length; i++) {
                                        if ($scope.mapLayers[i].name == 'Rakennukset') {
                                            rakennusLayer = $scope.mapLayers[i];
                                        }
                                    }

                                    rakennusLayer.source.geojson.object.features.length = 0;

                                });
                            }
                        }
                    };

                    /*
                     * Rakennus may be modified - fetch updated info if necessary.
                     */
                    $scope.$on('Rakennus_modified', function() {
                        $scope.getRakennukset();
                    });
                    /*
                     * Images were modified, fetch them again
                     */
                    $scope.$on('Kuva_modified', function(event, data) {
                        // Was it this estate
                        if ($scope.kiinteisto.properties.id == data.id) {
                            // $scope.images = [];
                            $scope.getImages();
                        }
                        // Or for any of the buildings
                        if ($scope.rakennukset.length > 0) {
                            for (var i = 0; i < $scope.rakennukset.length; i++) {
                                var r = $scope.rakennukset[i];
                                if (r.properties.id == data.id) {
                                    $scope.getRakennukset();
                                }
                            }
                        }
                    });
                    /*
                     * Files were modified, fetch them again
                     */
                    $scope.$on('Tiedosto_modified', function(event, data) {
                        if ($scope.kiinteisto.properties.id == data.id) {
                            $scope.getFiles();
                        }
                    });

                    $scope.kylat = [];
                    $scope.updateKylat = function() {
                        var kuntaId = $scope.selectedKunta.kunta.id;
                        var deferred = $q.defer();

                        if (!kuntaId) {
                            $scope.kylat = [];
                            deferred.resolve();
                        } else {
                            var params = {
                                'rivit' : 1000000,
                                'jarjestys' : 'nimi'
                            }
                            var promise = KuntaService.getKylatOfKunta(kuntaId, params);

                            promise.then(function(kylat) {
                                var oldKyla = $scope.kiinteisto.properties.kyla;
                                // get rid of the geojson "wrapper"
                                // set also the selected kyla to null if the selected kyla is not in the kyla list
                                $scope.kylat.length = 0;
                                var oldKylaFound = false;
                                for (var i = 0; i < kylat.features.length; i++) {
                                    $scope.kylat.push(kylat.features[i].properties);
                                    if (oldKyla != null && (kylat.features[i].properties.id == oldKyla.id)) {
                                        oldKylaFound = true;
                                    }
                                }
                                if (!oldKylaFound) {
                                    $scope.kiinteisto.properties.kyla = null;
                                }
                                deferred.resolve();
                            }, function(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_villages_failed"), AlertService.message(data));
                                });
                                $scope.kylat = [];
                                deferred.reject();
                            });

                        }
                        return deferred.promise;
                    };

                    /*
                     * OPERATIONS
                     */
                    /*
                     * kunta_id has been changed, update kunta name and kyla selections
                     */
                    $scope.selectedKunta = {
                        'kunta' : {}
                    };

                    $scope.kuntaChanged = function(selectedKunta) {
                        $scope.selectedKunta.kunta = selectedKunta;
                        $scope.kiinteistotunnus_osat[0] = selectedKunta.kuntanumero;
                        $scope.kiinteistotunnus_osat[1] = "";
                        $scope.kiinteistotunnus_osat[2] = "";
                        $scope.kiinteistotunnus_osat[3] = "";
                        $scope.setKiinteistotunnus();

                        $scope.updateKylat();
                    };

                    $scope.setKiinteistotunnus = function() {
                        $scope.kiinteisto.properties.kiinteistotunnus = $scope.kiinteistotunnus_osat[0] + "-" + $scope.kiinteistotunnus_osat[1] + "-" + $scope.kiinteistotunnus_osat[2] + "-" + $scope.kiinteistotunnus_osat[3];

                        $scope.kiinteistoForm.kiinteistotunnus.$setTouched();

                        // If the kiinteistotunnus is valid, check if it's free. If it's already used, get the first available palstanumero.
                        if ($scope.kiinteistotunnusRegex.test($scope.kiinteisto.properties.kiinteistotunnus)) {
                            // Clear the palstanumero when the kiinteistotunnus has been set
                            $scope.kiinteisto.properties.palstanumero = null;

                            KiinteistoService.checkKiinteistotunnusAvailability($scope.kiinteisto.properties.kiinteistotunnus, $scope.kiinteisto.properties.id, $scope.kiinteisto.properties.palstanumero).then(function success(data) {
                                if (data && data.data && data.data.properties) {
                                    // Change the values to the returned values
                                    if (data.data.properties.palstanumero != null) {
                                        $scope.uniqueKiinteistotunnus = false;
                                        $scope.nextFreeColumnNumber = data.data.properties.palstanumero;
                                        $scope.uniquePalstanumero = true;
                                        // Set the palstanumero
                                        $scope.kiinteisto.properties.palstanumero = $scope.nextFreeColumnNumber;
                                    } else {
                                        // Kiinteistotunnus is available, do nothing
                                        $scope.kiinteisto.properties.palstanumero = null;
                                        $scope.uniqueKiinteistotunnus = true;
                                        $scope.uniquePalstanumero = true;
                                        delete $scope.nextFreeColumnNumber;
                                    }
                                }
                            }, function error(data) {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });
                        }
                    };

                    /*
                     * kyla_id has been changed, update kyla name
                     */
                    $scope.kylaChanged = function() {
                        $scope.kiinteistotunnus_osat[1] = $scope.kiinteisto.properties.kyla.kylanumero;
                        $scope.kiinteistotunnus_osat[2] = "";
                        $scope.kiinteistotunnus_osat[3] = "";
                        $scope.setKiinteistotunnus();
                    };

                    /*
                     * Delete inventory project from the kiinteisto
                     */
                    $scope.deleteInventoryProject = function(ip) {
                        InventointiprojektiService.deleteKiinteistoFromInventointiprojekti($scope.kiinteisto.properties.id, ip.properties.id).then(function success(response) {
                            $scope.inventointiprojektiTable.reload();
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Delete_inventoryproject_failed"), AlertService.message(data));
                            });
                        });
                    };

                    /*
                     * Add rakennus to the kiinteistö
                     */
                    $scope.addRakennus = function() {

                        EntityBrowserService.setQuery('rakennus', null, {'kiinteisto_id': $scope.kiinteisto.properties.id}, 1);

                        if($scope.kiinteisto.geometry && $scope.kiinteisto.geometry['coordinates'] && $scope.kiinteisto.geometry['coordinates'].length == 2) {
                            ModalService.rakennusModal(false, null, $scope.kiinteisto.properties.id, $scope.kiinteisto.geometry['coordinates']);
                        } else {
                            ModalService.rakennusModal(false, null, $scope.kiinteisto.properties.id);
                        }
                    };

                    /*
                     * Add image to the kiinteisto
                     */
                    $scope.addImage = function() {
                        ModalService.imgUploadModal('kiinteisto', $scope.kiinteisto);
                    };

                    /*
                     * Add file to the kiinteisto
                     */
                    $scope.addFile = function() {
                        ModalService.fileUploadModal('kiinteisto', $scope.kiinteisto);
                    };

                    /*
                     * Add a new suojelutieto
                     */
                    $scope.addSuojelutieto = function() {
                        var s = {
                            'suojelutyyppi_id' : null,
                            'suojelutyyppi' : {
                                'id' : null,
                                'suojelutyyppi_ryhma_id' : null,
                                'suojelutyyppi' : {
                                    'id' : null
                                }
                            }
                        };
                        $scope.kiinteisto.properties.suojelutiedot.push(s);
                    }

                    /*
                     * Remove a suojelutieto
                     */
                    $scope.deleteSuojelutieto = function(index) {
                        $scope.kiinteisto.properties.suojelutiedot.splice(index, 1);
                    }

                    /*
                     * Open the selected image for viewing
                     */
                    $scope.openImage = function(image, type) {
                        if(type == 'rakennus') {
                            ModalService.imageModal(image, 'rakennus', null, $scope.permissions, $scope.rakennusImages);
                        } else {
                            ModalService.imageModal(image, 'kiinteisto', $scope.kiinteisto, $scope.permissions, $scope.images);
                        }
                    };
                    /*
                     * Open the selected file for viewing
                     */
                    $scope.openFile = function(file) {
                        ModalService.fileModal(file, 'kiinteisto', $scope.kiinteisto);
                    };

                    /*
                     * Add matkaraportti to the kiinteisto
                     */
                    $scope.addMatkaraportti = function() {
                        ModalService.matkaraporttiModal(null, false, $scope.kiinteisto);
                    };

                    /*
                     * Open selected matkaraportti
                     */
                    $scope.openMatkaraportti = function(matkaraportti) {

                    }

                    /*
                     * Open the selected inventointiprojekti
                     */
                    $scope.selectInventointiprojekti = function(inventointiprojekti) {
                        InventointiprojektiService.fetchInventointiprojekti(inventointiprojekti.id).then(function(inventointiprojekti) {
                            EntityBrowserService.setQuery('inventointiprojekti', inventointiprojekti.properties.id, {'kiinteisto_id': $scope.kiinteisto.properties.id}, $scope.kiinteisto.properties.inventointiprojektit.length, $scope.kiinteisto.properties.inventointiprojektit);
                            ModalService.inventointiprojektiModal(true, inventointiprojekti);
                        }, function error(data) {
                            locale.ready('area').then(function() {
                                AlertService.showError(locale.getString('area.Opening_inventoryproject_failed'), AlertService.message(data));
                            });
                        });
                    };

                    /*
                     * Cancel view mode
                     */
                    $scope.close = function() {
                        if ($scope.edit) {
                            $scope.cancelEdit();
                        }
                        $scope.showMap = false;
                    	// Sulkee modaalin ja poistaa listalta
                    	ModalService.closeModal($scope.modalNameId);
                        $scope.$destroy();
                    };

                    /*
                     * Cancel edit mode
                     */
                    $scope.cancelEdit = function() {
                        // Set the kiinteisto details to it's original values
                        for ( var property in $scope.original) {
                            if ($scope.kiinteisto.hasOwnProperty(property)) {
                                $scope.kiinteisto[property] = angular.copy($scope.original[property]);
                            }
                        }
                        if ($scope.kiinteisto.properties.kiinteistotunnus) {
                            $scope.kiinteistotunnus_osat = $scope.kiinteisto.properties.kiinteistotunnus.split("-");
                        } else {
                            $scope.kiinteistotunnus_osat = [];
                        }

                        $scope.uniqueKiinteistotunnus = true;
                        $scope.uniquePalstanumero = true;

                        /*if setting them true causes problems that don't come up in initial testing this will work
                        if ($scope.kiinteisto.properties.kiinteistotunnus && $scope.kiinteistotunnusRegex.test($scope.kiinteisto.properties.kiinteistotunnus)) {
                            // Check the availability only if the kiinteistotunnus has been set and it's valid
                            KiinteistoService.checkKiinteistotunnusAvailability($scope.kiinteisto.properties.kiinteistotunnus, $scope.kiinteisto.properties.id, $scope.kiinteisto.properties.palstanumero).then(function success(data) {
                                if (data && data.data && data.data.properties) {
                                    // Change the values to the returned values
                                    if (data.data.properties.palstanumero != null) {
                                        $scope.uniqueKiinteistotunnus = false;
                                        $scope.nextFreeColumnNumber = data.data.properties.palstanumero;
                                        if (data.data.properties.valid) {
                                            $scope.uniquePalstanumero = true;
                                        } else {
                                            $scope.uniquePalstanumero = false;
                                        }
                                        // Do not set the palstanumero automatically, but show the error message about already taken palstanumero
                                        // $scope.kiinteisto.properties.palstanumero = $scope.nextFreeColumnNumber;
                                    } else {
                                        // Kiinteistotunnus is available, do nothing
                                        $scope.kiinteisto.properties.palstanumero = null;
                                        $scope.uniqueKiinteistotunnus = true;
                                        $scope.uniquePalstanumero = true;
                                        delete $scope.nextFreeColumnNumber;
                                    }
                                }

                            }, function error(data) {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });
                        }*/



                        $scope.inventointiprojektiDeleteList.length = 0;
                        delete $scope.nextFreeColumnNumber;

                        // Revert the selectedKunta selections
                        if (!$scope.create && $scope.kiinteisto.properties.kyla && $scope.kiinteisto.properties.kyla.kunta) {
                            $scope.selectedKunta.kunta = $scope.kiinteisto.properties.kyla.kunta;
                        }

                        // restore the point
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            var mapLayer = $scope.mapLayers[i];

                            if (mapLayer.name == 'Kiinteistot') {
                                mapLayer.source.geojson.object.features.length = 0;

                                mapLayer.source.geojson.object.features.push({
                                    type : "Feature",
                                    geometry : {
                                        type : "Point",
                                        coordinates : [
                                                $scope.lon, $scope.lat
                                        ]
                                    }
                                });

                                break;
                            }
                        }

                        $scope.edit = false;

                        if ($scope.pointTool) {
                            $scope.togglePointTool();
                        }

                        $scope.getImages();
                        $scope.parseLinks();
                    };

                    /*
                     * Readonly / edit mode.
                     */
                    $scope.editMode = function() {
                        $scope.edit = true;

                        // Get the lists
                        $scope.getTilatyyppiOptions();
                        $scope.getAluetyyppiOptions();
                        $scope.getArvotusOptions();
                        $scope.getSuojeluOptions();
                        $scope.getKulttuurihistoriallisetArvotOptions();
                        $scope.getInventointiprojektit();
                        $scope.getUsers();
                        $scope.getKunnat();
                    };

                    //Tarkasta, että linkit ovat muotoa otsikko:URL, esimerkiksi Turku:http://www.turku.fi
                    $scope.verifyLinks = function() {
                    	var isOk = true;
                    	if($scope.kiinteisto.properties.linkit_paikallismuseoihin) {
	                    	var rowData = $scope.kiinteisto.properties.linkit_paikallismuseoihin.split('\n');
	                    	for (var i = 0; i < rowData.length; i++) {
		                    	var title = '';
		                    	var link = '';

		                    	if(rowData[i].split(':')[0].length === 0){
		                    		isOk = false;
	                    			AlertService.showError(locale.getString('error.Title_is_missing'), rowData[i]);
	                    		}
		                    	if(rowData[i].split(':').length > 3) {
		                    		isOk = false;
		                    		AlertService.showError(locale.getString('error.Too_many_characters'), rowData[i]);
		                    	}
		                    	if(rowData[i].split(':').length < 3) {
		                    		isOk = false;
	                    			AlertService.showError(locale.getString('error.Title_is_missing'), rowData[i]);
		                    	}
		                    	if(!rowData[i].includes('http://')) {
		                    		isOk = false;
	                    			AlertService.showError(locale.getString('error.Link_missing_http'), rowData[i]);
		                    	}
		                    }
                    	}
                    	return isOk;
                    }

                    /*
                     * Save changes
                     */
                    $scope.save = function() {
                        $scope.disableButtonsFunc();
                        $scope.kiinteisto.properties.inventointiprojektiDeleteList = $scope.inventointiprojektiDeleteList;
                        if(!$scope.verifyLinks()) {
                        	$scope.disableButtonsFunc();
                        	return;
                        }
                        KiinteistoService.saveKiinteisto($scope.kiinteisto).then(function(id) {
                            /*
                             * Update the kiinteisto id
                             */
                            if ($scope.create) {
                                $scope.kiinteisto.properties["id"] = id;
                                $scope.create = false;
                            }

                            KiinteistoService.fetchKiinteisto(id).then(function success(data) {
                                $scope.kiinteisto = data;

                                // Set the "sijainti" property again
                                if ($scope.kiinteisto.geometry && $scope.kiinteisto.geometry.coordinates) {
                                    $scope.lat = $scope.kiinteisto.geometry.coordinates[1];
                                    $scope.lon = $scope.kiinteisto.geometry.coordinates[0];
                                    $scope.kiinteisto.properties["sijainti"] = $scope.lon + " " + $scope.lat;
                                }

                                $scope.parseLinks();

                            }, function error(data) {
                                locale.ready('estate').then(function() {
                                    AlertService.showError(locale.getString('error.Error'), locale.getString('error.Getting_updated_estate_failed'));
                                });
                            });

                            locale.ready('estate').then(function() {
                                var kiint_info = $scope.kiinteisto.properties.nimi;
                                if (!kiint_info) {
                                    kiint_info = $scope.kiinteisto.properties.kiinteistotunnus;
                                }
                                AlertService.showInfo(locale.getString('common.Save_ok'), locale.getString('estate.Saving_estate_successfull', {
                                    name : kiint_info
                                }));
                            });

                            $scope.edit = false

                            // set the kunta of kyla, so that it is shown correctly in UI
                            $scope.kiinteisto.properties.kyla.kunta = $scope.selectedKunta.kunta;

                            $rootScope.$broadcast('Kiinteisto_modified', {
                                'kiinteisto' : $scope.kiinteisto
                            });

                            FileService.reorderImages($scope.imageIds, $scope.kiinteisto.properties.id, CONFIG.ENTITY_TYPE_IDS.kiinteisto).then(function success(data) {
                                // Get updated images
                                $scope.getImages();
                            }, function error(data) {
                                locale.ready('common').then(function(data) {
                                    AlertService.showError(locale.getString('error.Image_reorder_failed'), AlertService.message(data));
                                });

                            });

                            // "update" the original after successful save
                            $scope.original = angular.copy($scope.kiinteisto);

                            $scope.disableButtonsFunc();

                            $scope.inventointiprojektiDeleteList.length = 0;
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString("error.Saving_estate_failed"), AlertService.message(data));
                            });
                            $scope.disableButtonsFunc();
                        });
                    };

                    /*
                     * Delete
                     */
                    $scope.deleteKiinteisto = function(modalNameId) {
                        var conf = confirm(locale.getString('common.Confirm_delete2', {'item': $scope.kiinteisto.properties.nimi}));
                        if (conf) {
                            KiinteistoService.deleteKiinteisto($scope.kiinteisto).then(function() {
                                $scope.close();

                                locale.ready('estate').then(function() {
                                    AlertService.showInfo(locale.getString('estate.Estate_deleted'));
                                })
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Delete_estate_failed"), AlertService.message(data));
                                });
                            });

                        }
                    };

                    /*
                     * For opening the rakennus modal
                     */
                    $scope.showRakennusModal = function(rakennus) {
                        RakennusService.fetchRakennus(rakennus.properties.id).then(function success(rakennus) {
                            EntityBrowserService.setQuery('rakennus', rakennus.properties.id, {'kiinteisto_id': $scope.kiinteisto.properties.id}, $scope.rakennukset.length);
                            if ($scope.kiinteisto.geometry && $scope.kiinteisto.geometry.coordinates.length == 2) {
                                ModalService.rakennusModal(true, rakennus, null, $scope.kiinteisto.geometry['coordinates']);
                            } else {
                                ModalService.rakennusModal(true, rakennus, null, null);
                            }
                        }, function error(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('error.Error'), AlertService.message(data));
                            });
                        });
                    };

                    /*
                     * For opening the Kunta modal
                     */
                    $scope.showKuntaModal = function() {
                        KuntaService.fetchKunta($scope.selectedKunta.kunta.id).then(function success(kunta) {
                            EntityBrowserService.setQuery('kunta', kunta.properties.id, {'kiinteisto_id': $scope.kiinteisto.properties.id}, 1);
                            ModalService.kuntaModal(true, kunta);
                        }, function error(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('error.Error'), AlertService.message(data));
                            });
                        });
                    };
                    /*
                     * For opening the Kyla modal
                     */
                    $scope.showKylaModal = function() {
                        KylaService.fetchKyla($scope.kiinteisto.properties.kyla_id).then(function success(kyla) {
                            EntityBrowserService.setQuery('kyla', kyla.properties.id, {'kiinteisto_id': $scope.kiinteisto.properties.id}, 1);
                            ModalService.kylaModal(true, kyla);
                        }, function error(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('error.Error'), AlertService.message(data));
                            })
                        });
                    };

                    /*
                     * For opening the matkaraportti modal
                     */
                    $scope.showMatkaraporttiModal = function(matkaraportti) {
                        MatkaraporttiService.fetchMatkaraportti(matkaraportti.id).then(function success(mr) {
                            EntityBrowserService.setQuery('matkaraportti', mr.properties.id, {'kiinteisto_id': $scope.kiinteisto.properties.id}, $scope.kiinteisto.properties.matkaraportit.length, $scope.kiinteisto.matkaraportit);
                                ModalService.matkaraporttiModal(mr, true, $scope.kiinteisto);
                        }, function error(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('error.Error'), AlertService.message(data));
                            });
                        });
                    };

                    /*
                     * Hack hack hack. Update the kylat selection according to the existing kunta_id. Can't invoke earlier, as updateKylat is not a function before it has been declared. While we're at it, time to fetch the rakennus entities.
                     */
                    if (existing) {
                        if ($scope.kiinteisto.properties.kyla) {
                            $scope.selectedKunta.kunta = $scope.kiinteisto.properties.kyla.kunta;
                        }
                        $scope.updateKylat();
                        $scope.getRakennukset();
                    }

                    $scope.resizeIcon = "▢";

                    /*
                     * Maximize or restore the modal
                     */
                    $scope.resize = function() {
                        $scope.resizeIcon = ModalService.toggleFullScreen($scope.resizeIcon);

                        $timeout(function() {
                            $scope.map.updateSize();
                        });
                    };

                    // function for toggling the point tool
                    $scope.togglePointTool = function() {
                        $timeout(function() {
                            $scope.pointTool = !$scope.pointTool;
                        });
                    };

                    /*
                     * Selected details are broadcasted from the modal.
                     */
                    $scope.$on('Kiinteistotiedot_modified', function(event, data) {

                    	// check that the data was meant to be used by this modal window
                    	if (data.modalId != $scope.modalId) {
                    		// this modal did not ask for the data
                    		return;
                    	}

                        if (data.kiinteistotunnus && data.kiinteistotunnus.length > 0) {
                            $scope.kiinteisto.properties.kiinteistotunnus = data.kiinteistotunnus;
                        }
                        if (data.kiinteistotunnus && data.kiinteistotunnus.length > 0) {
                            $scope.kiinteistotunnus_osat = data.kiinteistotunnus.split("-");
                        }

                        $scope.setKiinteistotunnus();

                        if (data.osoite && data.osoite.length > 0) {
                            $scope.kiinteisto.properties.osoite = data.osoite;
                        }
                        if (data.postinumero && data.postinumero.length > 0) {
                            $scope.kiinteisto.properties.postinumero = data.postinumero;
                        }
                        if (data.kuntatunnus && data.kuntatunnus.length > 0) {
                            $scope.kiinteisto.properties.kuntatunnus = data.kuntatunnus;
                        }
                        if (data.nimi && data.nimi.length > 0) {
                            $scope.kiinteisto.properties.nimi = data.nimi;
                        }
                        var oldKunta = $scope.selectedKunta.kunta;
                        for (var i = 0; i < $scope.kunnat.length; i++) {
                            var k = $scope.kunnat[i];
                            if (k.kuntanumero == $scope.kiinteistotunnus_osat[0]) {
                                if (oldKunta.id != k.id) {
                                    $scope.selectedKunta.kunta = k;
                                    $scope.kiinteisto.properties.paikkakunta = k.nimi;
                                    $scope.updateKylat($scope.selectedKunta.kunta.id).then(function success() {
                                        if ($scope.kiinteistotunnus_osat[1] && $scope.kiinteistotunnus_osat[1].length > 0) {
                                            for (var i = 0; i < $scope.kylat.length; i++) {
                                                var k = $scope.kylat[i];
                                                if (k.kylanumero == $scope.kiinteistotunnus_osat[1]) {
                                                    $scope.kiinteisto.properties.kyla = k;
                                                    break;
                                                }
                                            }
                                        }
                                    }, function error() {
                                        locale.ready('error').then(function() {
                                            AlertService.showError(locale.getString("error.Updating_estate_details_failed"), AlertService.message(data));
                                        });
                                    });
                                    break;
                                }
                            }
                        }
                    });

                    /*
                     * Generate and show direct link to the item
                     */
                    $scope.popover = {
                        title : locale.getString('common.Address'),
                        content : $location.absUrl() + "?modalType=KIINTEISTO&modalId=" + $scope.kiinteisto.properties.id
                    };

                    /*
                     * OPENLAYERS MAP
                     */
                    // Get the kiinteisto coordinates
                    if ($scope.kiinteisto.geometry) {
                        $scope.lat = $scope.kiinteisto.geometry.coordinates[1];
                        $scope.lon = $scope.kiinteisto.geometry.coordinates[0];

                        // while we're at it, push them to kiinteisto's
                        // properties as well; that way they'll get POSTed or
                        // PUT. This is done only for the existing kiinteisto. For new
                        // ones the coordinates are set when the marker is set.
                        if (existing) {
                            $scope.kiinteisto.properties["sijainti"] = $scope.lon + " " + $scope.lat;
                            $scope.original.properties["sijainti"] = $scope.lon + " " + $scope.lat;
                        }
                    }

                    $scope.center = null;
                    if ($scope.lat && $scope.lon) {
                        var prj = ol.proj.transform([
                                $scope.lon, $scope.lat
                        ], 'EPSG:4326', 'EPSG:3067').map(function(c) {
                            return c.toFixed(4);
                        });

                        var lat = parseFloat(prj[1]);
                        var lon = parseFloat(prj[0]);

                        $scope.center = {
                            lat : lat,
                            lon : lon,
                            autodiscover : false,
                            bounds: []
                        };
                    }

                    /*
                     * OSOITE JA NIMISTÖHAKU
                     */

                    /*
                     * Search and geolocate addresses and places
                     */
                    $scope.addresses = []; // Holder for the addresses we geolocate
                    $scope.nimistot = []; // Holder for the places we geolocate

                    /*
                     * Perform search based on the given address
                     */
                    $scope.geolocate = function(addr) {
                        MapService.getOsoiteDetails(addr).then(function success(data) {
                            $scope.addresses = data.data.features;
                        }, function error(data) {
                            AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                        });
                    };

                    /*
                     * Perform search based on the given place name
                     */
                    $scope.geolocateNimisto = function(nimi) {
                        MapService.getNimistoDetails(nimi).then(function success(data) {
                            $scope.nimistot = data.data.features;
                        }, function error(data) {
                            AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                        });
                    };

                    /*
                     * Move the map upon selecting an option
                     */
                    $scope.$on('$typeahead.select', function(event, value, index, elem) {
                        var coord = value.geometry.coordinates;

                        $scope.center.lat = coord[1];
                        $scope.center.lon = coord[0];

                        $scope.showMarker($scope.center.lon, $scope.center.lat, value);
                    });

                    //Remove existing marker(s)
                    $scope.clearMarker = function() {
                        $scope.markers.length = 0;
                    };

                    //Coordinates (lon, lat) and object containing the label information
                    $scope.showMarker = function(lon, lat, obj) {
                        //Clear old marker(s)
                        $scope.clearMarker();

                        //Convert the coordinates to 4326 projection
                        var epsg4326Coords = MapService.epsg3067ToEpsg4326(lon, lat);

                        var label = "";
                        if(obj.properties.osoite !== undefined) {
                            label = obj.properties.osoite;
                        } else if(obj.properties.formatted_data !== undefined) {
                            label = obj.properties.formatted_data;
                        }

                        // Add marker to the position
                        $scope.markers.push({
                            label : label,
                            lon : epsg4326Coords[0],
                            lat : epsg4326Coords[1]
                        });
                    };
                    /*
                     * OSOITE JA NIMISTÖHAKU END
                     */

                    /*
                     * Center the map to the location of the estate
                     */
                    $scope.centerToLocation = function() {
                        if ($scope.kiinteisto.properties.sijainti) {
                            var coord = $scope.kiinteisto.properties.sijainti.split(" ");
                            // Transform the coordinates of the estate
                            var prj = ol.proj.transform([
                                    coord[0], coord[1]
                            ], 'EPSG:4326', 'EPSG:3067').map(function(c) {
                                return c.toFixed(4);
                            });

                            var lat = parseFloat(prj[1]);
                            var lon = parseFloat(prj[0]);

                            // Center the map to the coordinates
                            $scope.center.lat = lat;
                            $scope.center.lon = lon;
                        }
                    };

                    /*
                     * Autodiscover to the client's location
                     */
                    $scope.autodiscover = function() {
                        $scope.center.autodiscover = true;
                    };

                    $scope.deletePoint = function() {
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            var mapLayer = $scope.mapLayers[i];
                            if (mapLayer.name == 'Kiinteistot') {
                                mapLayer.source.geojson.object.features.length = 0;

                                break;
                            }
                        }

                        $scope.kiinteisto.properties.sijainti = null;

                    };

                    /*
                     * -------------------------MAP SWITCHING------------------------------------
                     */

                    // all possible layers; shown in dropdown button
                    $scope.objectLayers = [
                            {
                                "value" : "Kiinteistot",
                                "label" : "Kiinteistöt"
                            }, {
                                "value" : "Rakennukset",
                                "label" : "Rakennukset"
                            }, {
                                "value" : "Alueet",
                                "label" : "Alueet"
                            }, {
                                "value" : "Arvoalueet",
                                "label" : "Arvoalueet"
                            }
                    ];

                    /*
                     * Array for holding all of the visible layers we have for the map
                     */
                    $scope.mapLayers = [];
                    $scope.selectedMapLayers = [];

                    // layers selected for showing; note, $scope.mapLayers holds
                    // the "real" layers that are
                    // drawn on the map; these are object (feature) layers
                    $scope.selectedLayers = [];

                    /*
                     * Select kiinteisto or rakennus layers (or both)
                     */
                    $scope.selectLayer = function() {
                        $scope.selectedLayers = MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);

                        var kiinteistoLayer = null;
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == 'Kiinteistot') {
                                kiinteistoLayer = $scope.mapLayers[i];
                            }
                        }

                        if (kiinteistoLayer != null && $scope.kiinteisto.geometry.coordinates.length == 2) {
                            if (kiinteistoLayer.source.geojson.object.features.length == 0) {
                                kiinteistoLayer.source.geojson.object.features.push($scope.kiinteisto);
                            }
                        }

                        var rakennusLayer = null;
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == 'Rakennukset') {
                                rakennusLayer = $scope.mapLayers[i];
                            }
                        }

                        if (rakennusLayer != null && $scope.rakennukset) {
                            if (rakennusLayer.source.geojson.object.features.length == 0) {
                                rakennusLayer.source.geojson.object.features = $scope.rakennukset;
                            }
                        }

                        var alueLayer = null;
                        for(var i = 0; i<$scope.mapLayers.length; i++) {
                            if($scope.mapLayers[i].name == 'Alueet') {
                                alueLayer = $scope.mapLayers[i];
                            }
                        }
                        $scope.updateLayerData('Alueet');

                        var arvoalueLayer = null;
                        for(var i = 0; i<$scope.mapLayers.length; i++) {
                            if($scope.mapLayers[i].name == 'Arvoalueet') {
                                arvoalueLayer = $scope.mapLayers[i];
                            }
                        }
                        $scope.updateLayerData('Arvoalueet');

                        $scope.fixLayerOrder();
                    };

                    $scope.updateLayerData = function(layerName) {
                        var l = null;
                         for(var i = 0; i<$scope.mapLayers.length; i++) {
                             if($scope.mapLayers[i].name == layerName) {
                                 l = $scope.mapLayers[i];
                             }
                         }
                         //If we found a valid layer and it's active (=is visible), get the features for the view.
                         if(l && l.active) {
                             if(l.name == 'Alueet') {
                                 var searchObj = {};
                                 searchObj["aluerajaus"] = "" + $scope.smallerBounds[0] + " " + $scope.smallerBounds[1] + "," + $scope.smallerBounds[2] + " " + $scope.smallerBounds[3];
                                 searchObj["rivit"] = 50;

                                 var data = AlueService.getAlueet(searchObj);
                                 data.then(function(a) {
                                     l.source.geojson.object.features.length == 0;
                                     l.source.geojson.object.features = a.features;
                                     $scope.fixLayerOrder();
                                 });
                             }
                             if(l.name == 'Arvoalueet') {
                                 var searchObj = {};
                                 searchObj["aluerajaus"] = "" + $scope.smallerBounds[0] + " " + $scope.smallerBounds[1] + "," + $scope.smallerBounds[2] + " " + $scope.smallerBounds[3];
                                 searchObj["rivit"] = 50;

                                 var data = ArvoalueService.getArvoalueet(searchObj);
                                 data.then(function(a) {
                                     l.source.geojson.object.features.length == 0;
                                     l.source.geojson.object.features = a.features;
                                     $scope.fixLayerOrder();
                                 });
                             }
                         }
                    };

                    /*
                     * After selecting the map layers (the base layers) the ordering of the maps are broken. (object layer e.g. Kiinteistot are under the recently selected layer causing the pointer to be hidden. This method removes the object layers, loads the map layers again and then resets the
                     * object layers causing them to be always to top ones.
                     */
                    $scope.fixLayerOrder = function() {
                        // Timeout is essential here, without it this doesn't work.
                        if ($scope.map == null) {
                            olData.getMap($scope.mapId).then(function(map) {
                                $scope.map = map;
                                $timeout(function() {
                                    MapService.fixZIndexes($scope.map.getLayers());
                                });
                            });
                        } else {
                            $timeout(function() {
                                MapService.fixZIndexes($scope.map.getLayers());
                            });
                        }
                    };

                    /*
                     * Select a base map layer
                     */
                    $scope.selectMapLayer = function(initial) {
                        // Hack: for some reason this doesn't work on the first time for the WMTS layers...
                        $scope.selectedMapLayers = MapService.selectBaseLayer($scope.mapLayers, $scope.selectedMapLayers);
                        $scope.selectedMapLayers = MapService.selectBaseLayer($scope.mapLayers, $scope.selectedMapLayers);

                        // For some reason the layer zIndexes are not working correctly
                        // We need to set them manually after changing the maplayers. Otherwise the
                        // object layers are under the tile layers
                        $scope.fixLayerOrder();

                        if(!initial) {
                            // Update the user's map layer preferences
                            if ($scope.selectedMapLayers.length > 0) {
                                var arrayOfLayers = [];
                                for (var i = 0; i < $scope.selectedMapLayers.length; i++) {
                                    arrayOfLayers.push($scope.selectedMapLayers[i].nimi);
                                }
                                MapService.setUserLayers(arrayOfLayers);
                            }
                        }

                        //Add viewParams filtering to the layer
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            var l = $scope.mapLayers[i];
                            if (l.name == 'POHJAKARTTA_MIP kiinteistöt') {
                                l.source.params['viewparams'] ='kiinteisto_id:'+ $scope.kiinteisto.properties.id;
                            }
                        }
                    };

                    /*
                     * Select the default layer after the available layers are loaded
                     */
                    function selectDefaultLayer(layers) {

                        // Get the users layer preferences and select them automatically.
                        var userLayers = MapService.getUserLayers();

                        for (var i = 0; i < userLayers.length; i++) {
                            for (var j = 0; j < layers.length; j++) {
                                if (userLayers[i] == layers[j].properties.nimi) {
                                    $scope.selectedMapLayers.push(layers[j].properties);
                                }
                            }
                        }

                        $scope.selectMapLayer(true);
                    }
                    ;

                    /*
                     * Get available base layers. After they are loaded, set the "default" layer and show the kiinteisto layer also (as we're in the kiinteisto page)
                     */
                    MapService.getAvailableMapLayers().then(function success(layers) {
                        $scope.availableMapLayers = layers;

                        selectDefaultLayer(layers);

                        // Add default layer (kiinteistot)
                        $scope.selectedLayers.push('Kiinteistot');
                        $scope.selectedLayers = MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);
                        /*
                         * Add kiinteisto marker, first select the layer and then set the layer source to the kiinteisto.
                         */
                        var kiinteistoLayer = null;
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == 'Kiinteistot') {
                                kiinteistoLayer = $scope.mapLayers[i];
                            }
                        }

                        if (kiinteistoLayer != null && $scope.kiinteisto.geometry.coordinates.length == 2) {
                            kiinteistoLayer.source.geojson.object.features.push($scope.kiinteisto);
                        }
                    });

                    /*
                     * -----------------MAP SWITCHING END-------------------------
                     */
                    if ($scope.center != null) {
                        angular.extend($scope, MapService.map($scope.mapLayers, $scope.center, MapService.getUserZoom()));
                    } else {
                        angular.extend($scope, MapService.map($scope.mapLayers, undefined, MapService.getUserZoom()));
                    }
                    // olData.getMap() will return a different map after a modal
                    // with a map is opened;
                    // therefore, we must store the original
                    // $scope.map = null;
                    if ($scope.map == null) {
                        olData.getMap($scope.mapId).then(function(map) {
                            $scope.map = map;
                        });
                    }

                    /*
                     * Watch zoom level changes and save the zoom to the MapService.
                     */
                    $scope.$watch('center.zoom', function(zoom) {
                        MapService.setUserZoom(zoom);
                    });

                    /*
                     * Set the kiinteisto marker on the map
                     */
                    var searchObj = {};
                    if (!$scope.create) {
                        searchObj["id"] = $scope.kiinteisto.properties.id;
                    }

                    var emptyLayer = false;
                    if ($scope.create) {
                        emptyLayer = true;
                    }
                    /*
                     * MapService.selectLayer($scope.mapLayers, [ 'Kiinteistot' ], searchObj, emptyLayer);
                     */
                    // Move handler of the map. Make the pointer appropriate.
                    // Show popup on mouseover. (TODO: how to make it work in
                    // fullscreen mode?)
                    $scope.$on('openlayers.map.pointermove', function(event, data) {
                        $scope.$apply(function() {
                            if ($scope.map) {
                                var map = $scope.map;

                                if (!$scope.edit) {
                                    var pixel = map.getEventPixel(data.event.originalEvent);

                                    var layerHit = null;
                                    var featureHit = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                                        layerHit = layer;
                                        map.getTarget().style.cursor = 'pointer';
                                        return feature;
                                    });

                                    if (typeof featureHit === 'undefined') {
                                        MapService.hideMapPopup($scope.mapPopupId);
                                        map.getTarget().style.cursor = 'move';
                                        return;
                                    } else {
                                        MapService.showMapPopup($scope.mapPopupId, data, featureHit, layerHit, true);
                                    }
                                } else {
                                    MapService.hideMapPopup($scope.mapPopupId);

                                    if ($scope.pointTool) {
                                        map.getTarget().style.cursor = 'pointer';
                                    } else {
                                        map.getTarget().style.cursor = 'move';
                                    }

                                }
                            }
                        });
                    });

                    // Click handler of the map. "Move" the feature by wiping it
                    // and creating a new one.
                    $scope.$on('openlayers.map.singleclick', function(event, data) {
                        // ...but only in edit mode.
                        if ($scope.edit) {
                            if ($scope.pointTool) {
                                // perform a transform to get understandable
                                // coordinates
                                var prj = ol.proj.transform([
                                        data.coord[0], data.coord[1]
                                ], data.projection, 'EPSG:4326').map(function(c) {
                                    return c.toFixed(8);
                                });

                                var lat = parseFloat(prj[1]);
                                var lon = parseFloat(prj[0]);

                                for (var i = 0; i < $scope.mapLayers.length; i++) {
                                    var mapLayer = $scope.mapLayers[i];
                                    if (mapLayer.name == 'Kiinteistot') {
                                        mapLayer.source.geojson.object.features.length = 0;

                                        mapLayer.source.geojson.object.features.push({
                                            type : "Feature",
                                            geometry : {
                                                type : "Point",
                                                coordinates : [
                                                        lon, lat
                                                ]
                                            }
                                        });

                                        break;
                                    }
                                }

                                if (!$scope.kiinteisto.properties) {
                                    $scope.kiinteisto.properties = {
                                        sijainti : null
                                    };
                                }

                                // update kiinteisto properties as well, as
                                // those are what we POST or PUT
                                $scope.kiinteisto.properties["sijainti"] = lon + " " + lat;

                                // disengage point setting!
                                $scope.togglePointTool();

                                // used to force the map to redraw
                                $scope.$apply();
                            }
                        } else {
                            if ($scope.map) {
                                var map = $scope.map;
                                var pixel = map.getEventPixel(data.event.originalEvent);
                                var layerHit = null;
                                var featureHit = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                                    layerHit = layer;
                                    return feature;
                                });
                                if (typeof featureHit !== 'undefined') {
                                    if (layerHit.getProperties().name == 'Rakennukset') {
                                        var r = {
                                                'properties': {
                                                    'id': featureHit.getProperties().id
                                                    }
                                                };


                                        $scope.showRakennusModal(r);
                                        //RakennusService.fetchRakennus(featureHit.getProperties().id).then(function(rakennus) {
                                        //    ModalService.rakennusModal(true, rakennus, null, null);
                                        //});
                                    }
                                }
                            }
                        }
                    });

                    // hopefully setting this to true this late will keep the
                    // map from occasionally disappearing...
                    $scope.showMap = true;

                    /*
                     * Drag & drop for the image functionality
                     */
                    $scope.dragControlListeners = {
                        orderChanged : function(event) {
                            $scope.reorderImages();
                        }
                    };
                    /*
                     * Reorder the images Set the primary image - Maybe no need to be a separate method, if the nro 1 image is always the same
                     */
                    $scope.imageIds = [];
                    $scope.reorderImages = function() {
                        $scope.imageIds.length = 0;
                        for (var i = 0; i < $scope.images.length; i++) {
                            $scope.imageIds.push($scope.images[i].properties.id);
                        }
                    };

                    //for translations ot work
                    $scope.selectText = locale.getString('common.Select');
                    $scope.textSelectMapLayers = locale.getString('common.Map_layers');
                    $scope.textSelectLayers = locale.getString('common.Layers');

                    $scope.palstanumeroRegex = /^[1-9]\d*$/;

                    $scope.palstanumero_change = function() {
                        // Check for validity
                        if ($scope.kiinteisto.properties.kiinteistotunnus && $scope.kiinteistotunnusRegex.test($scope.kiinteisto.properties.kiinteistotunnus)) {

                            // Check the availability only if the kiinteistotunnus has been set and it's valid
                            KiinteistoService.checkKiinteistotunnusAvailability($scope.kiinteisto.properties.kiinteistotunnus, $scope.kiinteisto.properties.id, $scope.kiinteisto.properties.palstanumero).then(function success(data) {
                                if (data && data.data && data.data.properties) {
                                    // Change the values to the returned values
                                    if (data.data.properties.palstanumero != null) {
                                        $scope.uniqueKiinteistotunnus = false;
                                        $scope.nextFreeColumnNumber = data.data.properties.palstanumero;
                                        if (data.data.properties.valid) {
                                            $scope.uniquePalstanumero = true;
                                        } else {
                                            $scope.uniquePalstanumero = false;
                                        }
                                        // Do not set the palstanumero automatically, but show the error message about already taken palstanumero
                                        // $scope.kiinteisto.properties.palstanumero = $scope.nextFreeColumnNumber;
                                    } else {
                                        // Kiinteistotunnus is available, do nothing
                                        $scope.kiinteisto.properties.palstanumero = null;
                                        $scope.uniqueKiinteistotunnus = true;
                                        $scope.uniquePalstanumero = true;
                                        delete $scope.nextFreeColumnNumber;
                                    }
                                }

                            }, function error(data) {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });
                        }
                    };

                    /*
                     * Create a report
                     */
                    $scope.createReport = function(type) {
                        var report = {'kiinteistoId': $scope.kiinteisto.properties.id, 'requestedOutputType': type, 'reportDisplayName': $scope.kiinteisto.properties.kiinteistotunnus};
                        RaporttiService.createRaportti('KohdeRaportti', report).then(function success(data) {
                            locale.ready('common').then(function() {
                                AlertService.showInfo(locale.getString('common.Report_request_created'));
                            });
                        }, function error(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                            });
                        });
                    };

                    /*
                     * Column name translation helper
                     */
                    $scope.getColumnName = function(column) {
                        return ListService.getColumnName(column);
                    }

                    $scope.boundsLonLat = [];
                    $scope.smallerBounds = [];

                    // map's bounds in EPSG:4326 coordinates; do feature search
                    // when these change (when the map center is moved or the
                    // zoom level changes)
                    $scope.$watch("center.bounds", function(newValue, oldValue) {
                        if (newValue) {
                            if (!isNaN(newValue[0])) {
                                $scope.boundsLonLat[0] = MapService.epsg3067ToEpsg4326($scope.center.bounds[0], $scope.center.bounds[1])[0];
                                $scope.boundsLonLat[1] = MapService.epsg3067ToEpsg4326($scope.center.bounds[0], $scope.center.bounds[1])[1];
                                $scope.boundsLonLat[2] = MapService.epsg3067ToEpsg4326($scope.center.bounds[2], $scope.center.bounds[3])[0];
                                $scope.boundsLonLat[3] = MapService.epsg3067ToEpsg4326($scope.center.bounds[2], $scope.center.bounds[3])[1];

                                // approximate the area that is actually shown to
                                // the user; the map's bounds are larger than the
                                // viewport
                                $scope.smallerBounds[0] = $scope.boundsLonLat[0] + (0.03 * ($scope.boundsLonLat[2] - $scope.boundsLonLat[0]));
                                $scope.smallerBounds[1] = $scope.boundsLonLat[1] + (0.15 * ($scope.boundsLonLat[3] - $scope.boundsLonLat[1]));
                                $scope.smallerBounds[2] = $scope.boundsLonLat[2] - (0.03 * ($scope.boundsLonLat[2] - $scope.boundsLonLat[0]));
                                $scope.smallerBounds[3] = $scope.boundsLonLat[3] - (0.15 * ($scope.boundsLonLat[3] - $scope.boundsLonLat[1]));

                                $scope.updateLayerData('Alueet');
                                $scope.updateLayerData('Arvoalueet');
                            }
                        }

                    });


                    /*
                     * Käydään läpi kaikki suojelutiedot, ja jos yhdenkin tyyppi on asettamatta, palautetaan false
                     */
                    $scope.validateSuojelutyypit = function() {
                    	if($scope.kiinteisto.properties.suojelutiedot){
                            for(var i = 0; i<$scope.kiinteisto.properties.suojelutiedot.length; i++) {
                                var s = $scope.kiinteisto.properties.suojelutiedot[i];
                                if(s.suojelutyyppi.id == null) {
                                    return false;
                                }
                            }
                    	}
                        return true;
                    }

                    /*
                     * Tason järjestyksen ja läpinäkyvyyen tallennus MapService:lle.
                     * zIndex ja opacity.
                     */
                    $scope.tallennaTasot = function(editLayer) {
                    	// Valittuna olevat tasot
                    	var layers = $scope.map.getLayers();
                    	// Välitetään muokatun maplayerin tiedot palvelulle, joka huolehtii arvojen säilyttämisen
                    	MapService.storeUserMapLayerValues(layers, editLayer);

                        locale.ready('common').then(function() {
                            AlertService.showInfo(locale.getString('common.Save_ok'));
                        });
                    };
                }
        ]);
