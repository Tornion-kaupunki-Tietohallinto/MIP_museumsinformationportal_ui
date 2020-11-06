/*
 * Controller for the kiinteistöt.
 */
angular.module('mip.alue').controller(
        'AlueController',
        [
                '$scope', '$q', '$location', 'TabService', 'CONFIG', 'existing', '$http', 'ModalService', 'AlertService',
                '$filter', 'AlueService', 'KuntaService', 'KylaService', 'UserService', '$timeout', 'MapService',
                '$rootScope', 'olData', 'NgTableParams', 'ListService', 'ArvoalueService', 'InventointiprojektiService',
                'hotkeys', 'alue', 'locale', 'FileService', 'MuutoshistoriaService', 'permissions', 'arvoaluePermissions',
                'EntityBrowserService', 'SessionService', 'selectedModalNameId', 'RaporttiService', 'KiinteistoService',
                'RakennusService',
                function($scope, $q, $location, TabService, CONFIG, existing, $http, ModalService, AlertService,
                        $filter, AlueService, KuntaService, KylaService, UserService, $timeout, MapService,
                        $rootScope, olData, NgTableParams, ListService, ArvoalueService, InventointiprojektiService,
                        hotkeys, alue, locale, FileService, MuutoshistoriaService, permissions, arvoaluePermissions,
                        EntityBrowserService, SessionService, selectedModalNameId, RaporttiService, KiinteistoService,
                        RakennusService) {

                    // map id fetching
                    var _mapId = $rootScope.getNextMapId();
                    var extent = null; //Used to center the map to the area of the features

                    // Options for NoYes dropdown list
                    $scope.noYes = ListService.getNoYes();

                    $scope.mapId = "alueMap" + _mapId;
                    $scope.mapPopupId = "alueMapPopup" + _mapId;

                    // Unique modal id which is used for the collapsible panels
                    $scope.modalId = ModalService.getNextModalId();

                    // Valitun modalin nimi ja järjestysnumero
                    $scope.modalNameId = selectedModalNameId;

                    // Is the form in edit mode or not
                    $scope.edit = false;

                    $scope.map = null;

                    //for translations ot work
                    $scope.selectText = locale.getString('common.Select');
                    $scope.textSelectMapLayers = locale.getString('common.Map_layers');
                    $scope.textSelectLayers = locale.getString('common.Layers');


                    // Used to force the inventoija users to set the inventointiprojekti before the saving is allowed
                    $scope.userRole = UserService.getProperties().user.rooli;

                    // Are we creating a new one or doing legitimate editing?
                    // If this is true, some buttons are hidden.
                    $scope.create = false;

                    // Enable / Disable save and cancel buttons while doing operations.
                    $scope.disableButtons = false;
                    $scope.disableButtonsFunc = function() {
                        if ($scope.disableButtons) {
                            $scope.disableButtons = false;
                        } else {
                            $scope.disableButtons = true;
                        }
                    };

                    //list that contains inventoiniprojects that are deleted after saving edit
                    $scope.inventointiprojektiDeleteList = [];

                    //method that adds to list that contains inventoiniprojects that are deleted after saving edit
                    $scope.addToInventointiprojektiDeleteList = function (inventointiprojektiId, inventoijaId) {
                        var obj = {inventointiprojektiId:inventointiprojektiId, inventoijaId:inventoijaId};
                            $scope.inventointiprojektiDeleteList.push(obj);

                        for (var i = 0; i < $scope.alue.properties.inventointiprojektit.length; i++){
                            var ip = $scope.alue.properties.inventointiprojektit[i];
                            if(ip.id === inventointiprojektiId){
                                for(var j = 0; j < ip.inventoijat.length; j++){
                                    if(ip.inventoijat[j].inventoija_id === inventoijaId){
                                        ip.inventoijat.splice(j, 1);
                                        break;
                                    }
                                }
                                if(ip.inventoijat.length === 0){
                                    $scope.alue.properties.inventointiprojektit.splice(i, 1);
                                }
                                break;
                            }
                        }
                    };

                    // existing = true when viewing an existing property
                    // false when creating a new one
                    if (!existing) {
                        $scope.edit = true;
                        $scope.create = true;
                    }

                    if (alue) {
                        $scope.alue = alue;


                    } else {
                        $scope.alue = {
                            'geometry' : {
                                'coordinates' : []
                            },
                            'properties' : {
                                'arkeologinen_kohde' : $scope.noYes[0].value
                            },


                        }
                    }

                    // Store the original alue for possible cancel operation
                    $scope.original = angular.copy($scope.alue);

                    // Is the user inventory auditor?
                    $scope.isInventor = false;

                    // This array holds the actual selections and also the kyla-options for each kyla-kunta-group
                    $scope.alueKylaKuntaSelections = [];

                    $scope.addKylaKuntaSelection = function() {
                        var k = {
                            'kyla' : null,
                            'kunta' : null,
                            'kylaOptions' : []
                        };
                        $scope.alueKylaKuntaSelections.push(k);
                    }

                    function kylaOptionsCallBackCreator(index) {
                        return function(kylaOptions) {
                            // clear it
                            $scope.alueKylaKuntaSelections[index].kylaOptions.length = 0;
                            // fill it
                            // TODO: remove all such kyla options from this list that are used in some
                            // other combo, because duplicates are not allowed
                            for (var i = 0; i < kylaOptions.features.length; i++) {
                                var k = {
                                    'id' : kylaOptions.features[i].properties.id,
                                    'nimi' : kylaOptions.features[i].properties.nimi,
                                    'kylanumero' : kylaOptions.features[i].properties.kylanumero
                                }
                                $scope.alueKylaKuntaSelections[index].kylaOptions.push(k);
                            }
                        }
                    }

                    $scope.getSelections = function() {
                        if ($scope.create) {
                            $scope.addKylaKuntaSelection(); // one is mandatory
                            return;
                        }

                        if ($scope.edit) {
                            // clear
                            $scope.alueKylaKuntaSelections.length = 0;
                            // fill
                            for (var i = 0; i < $scope.alue.properties.kylat.length; i++) {

                                var k = {
                                    'kyla' : $scope.alue.properties.kylat[i],
                                    'kunta' : $scope.alue.properties.kylat[i].kunta,
                                    'kylaOptions' : []
                                };

                                $scope.alueKylaKuntaSelections.push(k);

                                var params = {
                                    'rivit' : 1000000,
                                    'jarjestys' : 'nimi'
                                };
                                var promise = KuntaService.getKylatOfKunta($scope.alue.properties.kylat[i].kunta.id, params);
                                var callback = kylaOptionsCallBackCreator(i);

                                promise.then(callback, function(reason) {
                                    locale.ready('common').then(function() {
                                        AlertService.showError(locale.getString('common.Error'), locale.getString('kyla.Fetching_villages_failed'));
                                    });
                                });
                            }

                            if ($scope.alueKylaKuntaSelections.length == 0) {
                                $scope.addKylaKuntaSelection(); // one is mandatory
                            }
                        }
                    };

                    $scope.getSelections();

                    // Map is added to the DOM after the modal is shown,
                    // otherwise it
                    // will not be drawn until page resize
                    $scope.showMap = false;

                    // Store permissions to alue & arvoalue entities to scope
                    $scope.permissions = permissions;
                    $scope.arvoaluePermissions = arvoaluePermissions;

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

                    $scope.kunnat = [];
                    KuntaService.getKunnat().then(function(data) {
                        for (var i = 0; i < data.features.length; i++) {
                            var k = {
                                'id' : data.features[i].properties.id,
                                'nimi' : data.features[i].properties.nimi,
                                'nimi_se' : data.features[i].properties.nimi_se,
                                'kuntanumero' : data.features[i].properties.kuntanumero
                            };
                            $scope.kunnat.push(k);
                        }
                    });

                    $scope.selectArvoalue = function(arvoalue) {
                        ArvoalueService.fetchArvoalue(arvoalue.id).then(function(arvoalue) {
                            EntityBrowserService.setQuery('arvoalue', arvoalue.properties.id, {'alue_id': $scope.alue.properties.id}, $scope.alue.properties.value_areas.length);
                            ModalService.arvoalueModal(true, arvoalue, $scope.alue);
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString('error.Opening_valuearea_failed'), AlertService.message(data));
                            })
                        });
                    };

                    $scope.addArvoalue = function() {
                        EntityBrowserService.setQuery('arvoalue', null, {'alue_id': $scope.alue.properties.id}, 1);
                        ModalService.arvoalueModal(false, null, $scope.alue);
                    };

                    $scope.showKuntaModal = function(kunta) {
                        KuntaService.fetchKunta(kunta.id).then(function success(kunta) {
                            EntityBrowserService.setQuery('kunta', kunta.properties.id, {'alue_id': $scope.alue.properties.id}, 1);
                            ModalService.kuntaModal(true, kunta);
                        }, function error(data) {
                            locale.ready('error').then(function() {
                                AlertService.showError(locale.getString('error.Opening_county_failed'), AlertService.message(data));
                            });
                        });
                    };
                    $scope.showKylaModal = function(kyla) {
                        KylaService.fetchKyla(kyla.id).then(function success(kyla) {
                            EntityBrowserService.setQuery('kyla', kyla.properties.id, {'alue_id': $scope.alue.properties.id}, 1);
                            ModalService.kylaModal(true, kyla);
                        }, function error(data) {
                            locale.ready('area').then(function() {
                                AlertService.showError(locale.getString('error.Opening_village_failed'), AlertService.message(data));
                            });
                        });
                    };

                    /*
                     * kunta has been changed, update kunta name and kyla selections
                     */
                    $scope.kuntaChanged = function(index) {
                        $scope.updateKylat(index);
                    };

                    /*
                     * update kyla selections of kylaselector at specified index
                     */
                    $scope.updateKylat = function(index) {
                        if (!$scope.alueKylaKuntaSelections[index].kunta) {
                            $scope.alueKylaKuntaSelections[index].kylaOptions.length = 0;
                            return;
                        }

                        var kuntaId = $scope.alueKylaKuntaSelections[index].kunta.id;
                        var params = {
                            'rivit' : 1000000,
                            'jarjestys' : 'nimi'
                        }
                        var promise = KuntaService.getKylatOfKunta(kuntaId, params);
                        var callback = kylaOptionsCallBackCreator(index);

                        promise.then(callback, function(data) {
                            locale.ready('common').then(function() {
                                AlertService.showError(locale.getString('kyla.Fetching_villages_failed'), AlertService.message(data));
                            });
                        });

                    };

                    $scope.deleteKylaKuntaSelection = function(index) {
                        $scope.alueKylaKuntaSelections.splice(index, 1);
                    }

                    $scope.inventointiprojektiTable = new NgTableParams({
                        page : 1,
                    // count : 10,
                    // total : 25
                    // dummy data
                    }, {
                        counts : [], // No page sizes -> disabled
                        getData : function($defer, params) {
                            if (!$scope.create) {
                                if ($scope.alue.properties.inventointiprojektit) {
                                    var orderedData = $scope.alue.properties.inventointiprojektit;
                                    $defer.resolve(orderedData);
                                }
                            }
                        }
                    });

                    /*
                     * Column name translation helper
                     */
                    $scope.getColumnName = function(column) {
                        return ListService.getColumnName(column);
                    }

                    /*
                     * Open the selected inventointiprojekti
                     */
                    $scope.selectInventointiprojekti = function(inventointiprojekti) {
                        InventointiprojektiService.fetchInventointiprojekti(inventointiprojekti.pivot.inventointiprojekti_id).then(function(inventointiprojekti) {
                            EntityBrowserService.setQuery('inventointiprojekti', inventointiprojekti.properties.id, {'alue_id': $scope.alue.properties.id}, $scope.alue.properties.inventointiprojektit.length, $scope.alue.properties.inventointiprojektit);
                            ModalService.inventointiprojektiModal(true, inventointiprojekti);
                        }, function error(data) {
                            locale.ready('area').then(function() {
                                AlertService.showError(locale.getString('area.Opening_inventoryproject_failed'), AlertService.message(data));
                            });
                        });
                    };

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
                    $scope.inventointiprojektiChanged = function(force) {
                        if ($scope.alue.properties.inventointiprojekti.inventointiprojekti_id) {

                            //Asetetaan käyttäjä
                            $scope.alue.properties.inventointiprojekti.inventoija_id = UserService.getProperties().user.id;

                            /*
                             * Inventointipäivän asetus. Haetaan inventointiprojektilistasta valittu inventointiprojekti ja tältä
                             * oikean inventoijan kohdalta inventointipaiva.
                             * Jos inventointipaivaa ei ole (tai sen asettaminen ei muuten onnistunut), asetetaan inventointipaivaksi kuluva paiva.
                             */
                            if($scope.alue.properties.inventointiprojektit) {
                                for(var i = 0; i<$scope.alue.properties.inventointiprojektit.length; i++) {
                                    var ip = $scope.alue.properties.inventointiprojektit[i];

                                    var dateToSet = null;
                                    if(ip.id == $scope.alue.properties.inventointiprojekti.inventointiprojekti_id) {
                                        for(var j = 0; j<ip.inventoijat.length; j++) {
                                            if(ip.inventoijat[j].inventoija_id == $scope.alue.properties.inventointiprojekti.inventoija_id) {
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
                                $scope.alue.properties.inventointiprojekti.inventointipaiva = dateToSet;
                            }
                            if($scope.alue.properties.inventointiprojekti.inventointipaiva == null) {
                                $scope.alue.properties.inventointiprojekti.inventointipaiva = new Date();
                            }

                            /*
                             * Kenttäpäivän asetus, samoin kuten inventointipaiva yllä, paitsi että kenttapaiva ei saa kuluvaa paivaa arvoksi, vaan jää tyhjäksi.
                             */
                            if($scope.alue.properties.inventointiprojektit) {
                                for(var i = 0; i<$scope.alue.properties.inventointiprojektit.length; i++) {
                                    var ip = $scope.alue.properties.inventointiprojektit[i];

                                    var dateToSet = null;
                                    if(ip.id == $scope.alue.properties.inventointiprojekti.inventointiprojekti_id) {
                                        for(var j = 0; j<ip.inventoijat.length; j++) {
                                            if(ip.inventoijat[j].inventoija_id == $scope.alue.properties.inventointiprojekti.inventoija_id) {
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
                                $scope.alue.properties.inventointiprojekti.kenttapaiva = dateToSet;
                            }
                        } else {
                            delete $scope.alue.properties.inventointiprojekti;
                        }
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
                                    'inventoijat': true
                                }).then(function success(users) {
                                    $scope.users = users.features;
                                }, function error(data) {
                                    locale.ready('error').then(function() {
                                        AlertService.showError(locale.getString("error.Getting_inventor_list_failed"), AlertService.message(data));
                                    });
                                });
                            }
                        }
                    };
                    $scope.getUsers();

                    $scope.showMuutoshistoria = function() {
                        MuutoshistoriaService.getAlueMuutosHistoria($scope.alue.properties.id).then(function(historia) {
                            ModalService.alueMuutoshistoriaModal(historia, $scope.alue.properties.nimi);
                        });
                    };

                    /*
                     * IMAGES AND FILES
                     */
                    // Images
                    $scope.images = [];
                    $scope.getImages = function() {
                        if ($scope.alue.properties.id) {
                            FileService.getImages({
                                'jarjestys' : 'jarjestys',
                                'jarjestys_suunta' : 'nouseva',
                                'rivit' : 1000,
                                'alue_id' : $scope.alue.properties.id
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
                     * Files
                     */
                    $scope.files = [];
                    $scope.getFiles = function() {
                        if ($scope.alue.properties.id) {
                            FileService.getFiles({
                                'rivit' : 1000,
                                'alue_id' : $scope.alue.properties.id
                            }).then(function success(files) {
                                $scope.files = files.features;
                                // Tiedostojen määrä (directives.js)
                                $scope.kpl_maara = $scope.files.length;
                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_files_failed"), AlertService.message(data));
                                });
                            });
                        }
                    };
                    $scope.getFiles();

                    /*
                     * Files were modified, fetch them again
                     */
                    $scope.$on('Tiedosto_modified', function(event, data) {
                        if ($scope.alue.properties.id == data.id) {
                            $scope.getFiles();
                        }
                    });

                    /*
                     * Images were modified, fetch them again
                     */
                    $scope.$on('Kuva_modified', function(event, data) {
                        if ($scope.alue.properties.id == data.id) {
                            $scope.getImages();
                        }
                        //Or for any of the arvoalueet
                        if($scope.arvoalueetForMap.length > 0) {
                            for (var i = 0; i < $scope.arvoalueetForMap.length; i++) {
                                var r = $scope.arvoalueetForMap[i];
                                if (r.properties.id == data.id) {
                                    $scope.getArvoalueet(false);
                                }
                            }
                        }
                    });

                    /*
                     * Arvoalue has been modified, fetch them again
                     */
                    $scope.$on('Arvoalue_modified', function(event, data) {
                        AlueService.fetchAlue($scope.alue.properties.id).then(function success(data) {
                            $scope.alue = data;
                            //Fixataan alueen sijainti
                            if($scope.alue.geometry) {
                                // The return values is array of arrays. We need to convert it to a string, otherwise BE won't accept it anymore.
                                var coordAsString = "";
                                if($scope.alue.geometry.coordinates.length == 2) {
                                    //POINT
                                    $scope.alue.properties.sijainti = $scope.alue.geometry.coordinates[0] + " " +$scope.alue.geometry.coordinates[1];
                                } else {
                                    for (var i = 0; i < $scope.alue.geometry.coordinates[0].length; i++) {
                                        coordAsString += $scope.alue.geometry.coordinates[0][i][0] + " " + $scope.alue.geometry.coordinates[0][i][1] + ", ";
                                    }

                                    // Remove the last ',' from the string
                                    coordAsString = coordAsString.slice(0, -2);

                                    $scope.alue.properties.alue = coordAsString;
                                }
                            }


                        }).then(function success(data) {
                            $scope.getArvoalueet(false);
                        });
                    });

                    /*
                     * ArvoalueImages - the array is filled in after fetching the arvoalueet.
                     */
                    $scope.arvoalueImages = [];








                    /*
                     * OPERATIONS
                     */

                    /*
                     * Add file to the alue
                     */
                    $scope.addFile = function() {
                        ModalService.fileUploadModal('alue', $scope.alue);
                    };

                    /*
                     * Add image to the alue
                     */
                    $scope.addImage = function() {
                        ModalService.imgUploadModal('alue', $scope.alue);
                    };
                    /*
                     * Open the selected image for viewing
                     */
                    $scope.openImage = function(image, type) {
                        if(type == 'arvoalue') {
                            ModalService.imageModal(image, 'arvoalue', null, $scope.permissions, $scope.arvoalueImages);
                        } else {
                            ModalService.imageModal(image, 'alue', $scope.alue, $scope.permissions, $scope.images);
                        }
                    };
                    /*
                     * Open the selected file for viewing
                     */
                    $scope.openFile = function(file) {
                        ModalService.fileModal(file, 'alue', $scope.alue, $scope.permissions);
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

                        hotkeys.del('p');
                        hotkeys.del('a');
                    };

                    /*
                     * Cancel edit mode
                     */
                    $scope.cancelEdit = function() {
                        // Asetetaan alueen tiedot alkuperäisiin arvoihin
                        for ( var property in $scope.original) {
                            if ($scope.alue.hasOwnProperty(property)) {
                                $scope.alue[property] = angular.copy($scope.original[property]);
                            }
                        }
                        $scope.inventointiprojektiDeleteList.length = 0;
                        // restore the point (or other feature)
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            var mapLayer = $scope.mapLayers[i];

                            if (mapLayer.name == 'Alueet') {
                                mapLayer.source.geojson.object.features.length = 0;

                                if ($scope.original && $scope.original.geometry) {
                                    mapLayer.source.geojson.object.features.push({
                                        type : "Feature",
                                        geometry : $scope.original.geometry
                                    });
                                }

                                break;
                            }
                        }

                        $scope.edit = false;

                        if ($scope.drawingTool) {
                            $scope.toggleDrawingTool();
                        }

                        if ($scope.pointTool) {
                            $scope.togglePointTool();
                        }

                        $scope.getImages();
                    };

                    /*
                     * Readonly / edit mode.
                     */
                    $scope.editMode = function() {
                        $scope.edit = true;
                        $scope.getSelections();
                        $scope.getInventointiprojektit();
                        $scope.getUsers();

                    };

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

                    /*
                     * Save changes
                     */
                    $scope.save = function() {
                        $scope.disableButtonsFunc();
                        $scope.alue.properties.inventointiprojektiDeleteList = $scope.inventointiprojektiDeleteList;
                        // set the kunta/kyla selections in place. Actually only the kyla is important.
                        if ($scope.alue.properties.kylat) {
                            $scope.alue.properties.kylat.length = 0;
                        } else {
                            $scope.alue.properties.kylat = [];
                        }
                        for (var i = 0; i < $scope.alueKylaKuntaSelections.length; i++) {
                            var k = $scope.alueKylaKuntaSelections[i].kyla;
                            // add also the kunta information so that it shown when going back to the view mode
                            // (not required by the backend)
                            k.kunta = $scope.alueKylaKuntaSelections[i].kunta;
                            $scope.alue.properties.kylat.push(k);
                        }

                        AlueService.saveAlue($scope.alue).then(function(id) {

                            if ($scope.create) {
                                $scope.alue.properties["id"] = id;
                                $scope.create = false;
                            }

                            AlueService.fetchAlue(id).then(function success(data) {
                                $scope.alue = data;

                                // The return values is array of arrays. We need to convert it to a string, otherwise BE won't accept it anymore.
                                var coordAsString = "";

                                if($scope.alue.geometry) {
                                    if($scope.alue.geometry.coordinates.length == 2) {
                                        //POINT
                                        $scope.alue.properties.sijainti = $scope.alue.geometry.coordinates[0] + " " +$scope.alue.geometry.coordinates[1];
                                    } else {
                                        for (var i = 0; i < $scope.alue.geometry.coordinates[0].length; i++) {
                                            coordAsString += $scope.alue.geometry.coordinates[0][i][0] + " " + $scope.alue.geometry.coordinates[0][i][1] + ", ";
                                        }

                                        // Remove the last ',' from the string
                                        coordAsString = coordAsString.slice(0, -2);

                                        $scope.alue.properties.alue = coordAsString;
                                    }
                                }

                                locale.ready('common').then(function() {
                                    AlertService.showInfo(locale.getString('common.Save_ok'), locale.getString('common.Area_information_saved', {
                                        name : $scope.alue.properties.nimi
                                    }));
                                });
                                $scope.edit = false;

                                // "update" the original after successful save
                                $scope.original = angular.copy($scope.alue);

                                $scope.getArvoalueet(false);

                                FileService.reorderImages($scope.imageIds, $scope.alue.properties.id, CONFIG.ENTITY_TYPE_IDS.alue).then(function success(data) {
                                    if (data != 'noreload') {
                                        // Get updated images
                                        $scope.getImages();
                                    }
                                    $scope.imageIds.length = 0;
                                }, function error(data) {
                                    locale.ready('error').then(function() {
                                        AlertService.showError(locale.getString('error.Image_reorder_failed'), AlertService.message(data));
                                    });

                                });


                            }, function error(data) {
                                locale.ready('error').then(function() {
                                    AlertService.showError(locale.getString('error.Getting_updated_area_failed'), AlertService.message(data));
                                });
                            });

                            $scope.inventointiprojektiDeleteList.length = 0;
                            $scope.disableButtonsFunc();
                        }, function error(data) {
                            locale.ready('area').then(function() {
                                AlertService.showError(locale.getString("area.Save_failed"), AlertService.message(data));
                            });
                            $scope.disableButtonsFunc();
                        });
                    };

                    /*
                     * Delete
                     */
                    $scope.deleteAlue = function(modalNameId) {
                        var conf = confirm(locale.getString('common.Confirm_delete2', {'item': $scope.alue.properties.nimi}));
                        if (conf) {
                            AlueService.deleteAlue($scope.alue).then(function() {
                                $scope.close();
                                locale.ready('common').then(function() {
                                    AlertService.showInfo(locale.getString('common.Deleted'));
                                });
                            }, function error(data) {
                                locale.ready('area').then(function() {
                                    AlertService.showError(locale.getString('area.Delete_failed'), AlertService.message(data));
                                });
                            });
                        }
                    };

                    /*
                     * Generate and show direct link to the item
                     */
                    $scope.popover = {
                        title : locale.getString('common.Address'),
                        content : $location.absUrl() + "?modalType=ALUE&modalId=" + $scope.alue.properties.id
                    };

                    /*
                     * OPENLAYERS MAP
                     */


                    // if the coordinate is set, center the map on it
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
                     * Select alue or arvoalue layers (or both)
                     */
                    $scope.selectLayer = function() {
                        $scope.selectedLayers = MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);

                        var alueLayer = null;
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == 'Alueet') {
                                alueLayer = $scope.mapLayers[i];
                            }
                        }

                        if (alueLayer != null && $scope.alue.geometry && $scope.alue.geometry.coordinates && $scope.alue.geometry.coordinates.length > 0) {
                            if (alueLayer.source.geojson.object.features.length == 0) {
                                alueLayer.source.geojson.object.features.push($scope.alue);
                            }
                        }

                        var arvoalueLayer = null;
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == 'Arvoalueet') {
                                arvoalueLayer = $scope.mapLayers[i];
                            }
                        }
                        if (arvoalueLayer != null && $scope.arvoalueetForMap) {
                            if (arvoalueLayer.source.geojson.object.features.length == 0) {
                                arvoalueLayer.source.geojson.object.features = $scope.arvoalueetForMap;
                            }
                        }

                        var kiinteistoLayer = null;
                        for(var i = 0; i<$scope.mapLayers.length; i++) {
                            if($scope.mapLayers[i].name == 'Kiinteisto') {
                                kiinteistoLayer = $scope.mapLayers[i];
                            }
                        }
                        $scope.updateLayerData('Kiinteistot');

                        var rakennusLayer = null;
                        for(var i = 0; i<$scope.mapLayers.length; i++) {
                            if($scope.mapLayers[i].name == 'Rakennus') {
                                rakennusLayer = $scope.mapLayers[i];
                            }
                        }
                        $scope.updateLayerData('Rakennukset');

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
                             if(l.name == 'Kiinteistot') {
                                 var searchObj = {};
                                 searchObj["aluerajaus"] = "" + $scope.smallerBounds[0] + " " + $scope.smallerBounds[1] + "," + $scope.smallerBounds[2] + " " + $scope.smallerBounds[3];
                                 searchObj["rivit"] = 50;

                                 var data = KiinteistoService.getKiinteistot(searchObj);
                                 data.then(function(a) {
                                     l.source.geojson.object.features.length == 0;
                                     l.source.geojson.object.features = a.features;
                                     $scope.fixLayerOrder();
                                 });
                             }
                             if(l.name == 'Rakennukset') {
                                 var searchObj = {};
                                 searchObj["aluerajaus"] = "" + $scope.smallerBounds[0] + " " + $scope.smallerBounds[1] + "," + $scope.smallerBounds[2] + " " + $scope.smallerBounds[3];
                                 searchObj["rivit"] = 50;

                                 var data = RakennusService.getRakennukset(searchObj);
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
                            if (l.name == 'POHJAKARTTA_MIP alueet') {
                                l.source.params['viewparams'] ='alue_id:'+ $scope.alue.properties.id;
                            }
                        }

                    };

                    /*
                     * Select the default layer after the available layers are loaded
                     */
                    function selectDefaultLayer(layers) {
                      //Get the users layer preferences and select them automatically.
                        var userLayers = MapService.getUserLayers();

                        for(var i = 0; i < userLayers.length; i++) {
                            for(var j = 0; j< layers.length; j++) {
                                if(userLayers[i] == layers[j].properties.nimi) {
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
                        // Add default layer (alueet)
                        $scope.selectedLayers.push('Alueet');
                        $scope.selectedLayers = MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null);

                        /*
                         * Add aluemarker, first select the layer and then set the layer source to the alue.
                         */
                        var alueLayer = null;
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == 'Alueet') {
                                alueLayer = $scope.mapLayers[i];
                            }
                        }

                        if (alueLayer != null && $scope.alue.geometry && $scope.alue.geometry.coordinates && $scope.alue.geometry.coordinates.length > 0) {
                            alueLayer.source.geojson.object.features.push($scope.alue);
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

                    if ($scope.map == null) {
                        olData.getMap($scope.mapId).then(function(map) {
                            $scope.map = map;

                            // If we have existing object, set the coordinates and position it on the map, otherwise skip
                            if (existing) {
                                if ($scope.alue.geometry != null) {
                                    if ($scope.alue.geometry.type == "Point") {
                                        $scope.lat = $scope.alue.geometry.coordinates[1];
                                        $scope.lon = $scope.alue.geometry.coordinates[0];

                                        $scope.alue.properties.sijainti = $scope.lon + " " + $scope.lat;
                                        $scope.original.properties.sijainti = $scope.lon + " " + $scope.lat;
                                    } else if ($scope.alue.geometry.type == "Polygon") {
                                        var approxCenter = MapService.approximatePolygonCenter($scope.alue.geometry);
                                        $scope.lat = approxCenter[1];
                                        $scope.lon = approxCenter[0];

                                        // set the alue property - otherwise, saving is impossible
                                        // without redrawing the polygon
                                        $scope.alue.properties["alue"] = MapService.polygonToString($scope.alue.geometry);
                                        $scope.original.properties["alue"] = MapService.polygonToString($scope.alue.geometry);
                                    } else {
                                        locale.ready('common').then(function() {
                                            AlertService.showError(locale.getString('common.Invalid_geometry_type'));
                                        });
                                        throw "alueController: Unsupported geometry type: " + $scope.alue.geometry.type;

                                    }

                                        var alueExtent = MapService.calculateExtentOfFeatures([$scope.alue]);

                                        var oldExtent = angular.copy(extent);
                                        extent = MapService.getBiggestExtent(extent, alueExtent);

                                        if(oldExtent !== extent) {
                                            MapService.centerToExtent($scope.map, extent);
                                        }

                                }
                            }

                        });
                    }

                    /*
                     * Watch zoom level changes and save the zoom to the MapService.
                     */
                    $scope.$watch('center.zoom', function(zoom) {
                        MapService.setUserZoom(zoom);
                    });

                    // fetch the coordinates (TODO: no need to use AJAX again?)
                    var searchObj = {};
                    if (!$scope.create) {
                        searchObj["id"] = $scope.alue.properties.id;
                    }
                    var emptyLayer = false;
                    if ($scope.create) {
                        emptyLayer = true;
                    }

                    $scope.arvoalueetForMap = [];
                    $scope.getArvoalueet = function(addLayer) {
                        if (!$scope.alue.properties.id) {
                            return;
                        }

                        //Reset the images
                        $scope.arvoalueImages.length = 0;

                        //Reset the arvoalueet
                        $scope.arvoalueetForMap.length = 0;

                        // If we have a view permission to the value areas -> fetch them. Otherwise they will not be available.
                        if ($scope.arvoaluePermissions.katselu) {
                            AlueService.getArvoalueetOfAlue($scope.alue.properties.id).then(function(data) {
                                $scope.arvoalueetForMap = data.features;

                                // FIXME:
                                // We want to show the inventointinumero on top of the circle only in this view.
                                // Applying a custom style or selecting a new layer "TextLayer" didn't do the job well, therefore this.
                                for (var i = 0; i < $scope.arvoalueetForMap.length; i++) {
                                    $scope.arvoalueetForMap[i].properties['showLabel'] = true;
                                }

                                // If the "child" objects were modified, update the map accordingly, start by removing the existing features
                                // and continue to adding the features again
                                removeFeaturesFromArvoalueLayer();

                                /*
                                 * Add the arvoalueet to the map
                                 */
                                if (addLayer) {
                                    $scope.selectedLayers.push('Arvoalueet');
                                    MapService.selectLayer($scope.mapLayers, $scope.selectedLayers, {}, true, null, null)
                                }
                                var arvoalueLayer = null;

                                for (var i = 0; i < $scope.mapLayers.length; i++) {
                                    if ($scope.mapLayers[i].name == 'Arvoalueet') {
                                        arvoalueLayer = $scope.mapLayers[i];
                                    }
                                }

                                if (arvoalueLayer != null && $scope.arvoalueetForMap) {
                                    for (var i = 0; i < $scope.arvoalueetForMap.length; i++) {
                                        arvoalueLayer.source.geojson.object.features.push($scope.arvoalueetForMap[i]);
                                    }
                                }
                                /*
                                 * End
                                 */

                                // IF the area doesn't have a location at all, we must center to an value area
                                /*if ($scope.alue.properties.alue == null) {
                                    for (var i = 0; i < $scope.arvoalueetForMap.length; i++) {
                                        if ($scope.arvoalueetForMap[i].geometry.coordinates) {
                                            if ($scope.arvoalueetForMap[i].geometry.type == 'Point') {
                                                $scope.centerToLocation($scope.arvoalueetForMap[i].geometry.coordinates);
                                            } else if ($scope.arvoalueetForMap[i].geometry.type == 'Polygon') {
                                                $scope.centerToLocation(MapService.approximatePolygonCenter($scope.arvoalueetForMap[i].geometry));
                                            }
                                            break;
                                        }
                                    }
                                }*/
                                var aalueExtent = MapService.calculateExtentOfFeatures($scope.arvoalueetForMap);

                                var oldExtent = angular.copy(extent);
                                extent = MapService.getBiggestExtent(extent, aalueExtent);

                                if(oldExtent !== extent) {
                                    MapService.centerToExtent($scope.map, extent);
                                }


                               $scope.fixLayerOrder();


                                // Get the images for each of the arvoalueet
                                var promises = [];

                                for (var j = 0; j < $scope.arvoalueetForMap.length; j++) {

                                    var promise = FileService.getImages({
                                        'jarjestys' : 'jarjestys',
                                        'jarjestys_suunta' : 'nouseva',
                                        'rivit' : 1000,
                                        'arvoalue_id' : $scope.arvoalueetForMap[j].properties.id
                                    });

                                    promises.push(promise);
                                }

                                $q.all(promises).then(function(data) {
                                    for(var i = 0; i<data.length; i++) {
                                        if(data[i].features){
                                            for(var j = 0; j<data[i].features.length; j++) {
                                                $scope.arvoalueImages.push(data[i].features[j]);
                                            }
                                        }
                                    }
                                });



                            }, function error(data) {
                                locale.ready('area').then(function() {
                                    AlertService.showError(locale.getString("error.Getting_valueareas_failed"), AlertService.message(data));
                                })
                            });
                        }
                    };
                    $scope.getArvoalueet(true);

                    /*
                     * Removes the features from the alue layer by setting the source.geojson.object.features.length to 0
                     */
                    function removeFeaturesFromArvoalueLayer() {
                        var arvoalueLayer = null;

                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            if ($scope.mapLayers[i].name == 'Arvoalueet') {
                                arvoalueLayer = $scope.mapLayers[i];
                            }
                        }

                        if (arvoalueLayer != null) {
                            arvoalueLayer.source.geojson.object.features.length = 0;
                        }
                    }
                    ;

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

                                    if ($scope.drawingTool || $scope.pointTool) {
                                        map.getTarget().style.cursor = 'pointer';
                                    } else {
                                        map.getTarget().style.cursor = 'move';
                                    }
                                }
                            }
                        });
                    });

                    // Click handler of the map. Set a point
                    // if the appropriate tool is active.
                    $scope.$on('openlayers.map.singleclick', function(event, data) {
                        // ...but only in edit mode.
                        if ($scope.edit && $scope.pointTool) {
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
                                if (mapLayer.name == 'Alueet') {
                                    mapLayer.source.geojson.object.features.length = 0;

                                    mapLayer.source.geojson.object.features.push({
                                        type : "Feature",
                                        geometry : {
                                            type : "Point",
                                            coordinates : [
                                                    lon, lat
                                            ]
                                        },
                                        properties: $scope.alue.properties
                                    });

                                    break;
                                }
                            }

                            if (!$scope.alue.properties) {
                                $scope.alue.properties = {
                                    sijainti : null
                                };
                            }

                            // update alue properties as well, as
                            // those are what we POST or PUT
                            $scope.alue.properties["sijainti"] = lon + " " + lat;

                            // clear the area (if any) so it is
                            // not POSTed or PUT
                            $scope.alue.properties["alue"] = null;

                            // disengage point setting!
                            $scope.togglePointTool();

                            // used to force the map to redraw
                            $scope.$apply();
                        } else if (!$scope.edit) {
                            if ($scope.map) {
                                var map = $scope.map;
                                var pixel = map.getEventPixel(data.event.originalEvent);
                                var layerHit = null;
                                var featureHit = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
                                    layerHit = layer;
                                    return feature;
                                });
                                if (typeof featureHit !== 'undefined') {
                                    if (layerHit.getProperties().name == 'Arvoalueet') {
                                        $scope.selectArvoalue(featureHit.getProperties());
                                        //ArvoalueService.fetchArvoalue(featureHit.getProperties().id).then(function(arvoalue) {
                                        //    ModalService.arvoalueModal(true, arvoalue, $scope.alue);
                                        //});
                                    }
                                }
                            }
                        }
                    });

                    // Drawing vector source (to be set later)
                    $scope.drawingSource = null;

                    // Drawing layer (to be set later)
                    $scope.drawingLayer = null;

                    // Drawing interaction (to be set later)
                    $scope.drawInteraction = null;

                    // Do magic: make drawing work
                    olData.getMap($scope.mapId).then(function(map) {
                        /* Initialize drawing vector source */
                        $scope.drawingSource = new ol.source.Vector({
                            useSpatialIndex : false
                        });

                        /* Initialize drawing layer */
                        $scope.drawingLayer = new ol.layer.Vector({
                            source : $scope.drawingSource
                        });

                        map.addLayer($scope.drawingLayer);

                        /* Initialize the drawing interaction */
                        $scope.drawInteraction = new ol.interaction.Draw({
                            source : $scope.drawingSource,
                            type : 'Polygon'
                        });

                        // default the draw interaction to inactive
                        $scope.drawInteraction.setActive(false);
                        map.addInteraction($scope.drawInteraction);

                        // stop drawing after a feature is finished
                        $scope.drawingSource.on('addfeature', function(event) {
                            $scope.toggleDrawingTool();
                        });

                        $scope.drawInteraction.on('drawstart', function(event) {
                            // unused atm
                        }, this);

                        $scope.drawInteraction.on('drawend', function(event) {
                            // find the correct layer to append the newly drawn
                            // feature to
                            for (var i = 0; i < $scope.mapLayers.length; i++) {
                                var mapLayer = $scope.mapLayers[i];

                                // it's this one
                                if (mapLayer.name == 'Alueet') {
                                    // clear the layer
                                    mapLayer.source.geojson.object.features.length = 0;

                                    // featureCoordArray will have the
                                    // coordinates in GeoJSON format,
                                    // propsCoords will have them in a "flat"
                                    // string
                                    var featureCoordArray = [], propsCoords = "";

                                    // get the coordinates of the new feature,
                                    // convert and store them
                                    for (var i = 0; i < event.feature.getGeometry().flatCoordinates.length; i += 2) {
                                        var lonlat = MapService.epsg3067ToEpsg4326(event.feature.getGeometry().flatCoordinates[i], event.feature.getGeometry().flatCoordinates[i + 1]);
                                        featureCoordArray.push(lonlat);

                                        if (i > 0) {
                                            propsCoords += ","
                                        }
                                        propsCoords += lonlat[0];
                                        propsCoords += " " + lonlat[1];
                                    }

                                    var geometry = {
                                        type : "Polygon",
                                        coordinates : [
                                            featureCoordArray
                                        ]
                                    };

                                    // create the feature for the map layer
                                    var feature = {
                                        type : "Feature",
                                        geometry : geometry,
                                        properties: $scope.alue.properties
                                    };

                                    // add the newly drawn feature to the
                                    // correct layer
                                    mapLayer.source.geojson.object.features.push(feature);

                                    // set the coordinates so that they are
                                    // POSTed or PUT
                                    $scope.alue.properties["alue"] = propsCoords;

                                    // clear the coordinates of the point (if any)
                                    // so they are not POSTed or PUT
                                    $scope.alue.properties["sijainti"] = null;

                                    // store the geometry, too
                                    $scope.alue.geometry = geometry;

                                    // clear the drawing source when practical
                                    $timeout(function() {
                                        $scope.drawingSource.clear();
                                    });

                                    break;
                                }
                            }

                            $scope.$apply();
                        });
                    });

                    // is the drawing tool active or not? Defaults to not
                    $scope.drawingTool = false;

                    // function for toggling the above + the interaction
                    $scope.toggleDrawingTool = function() {
                        if ($scope.pointTool) {
                            $scope.togglePointTool();
                        }

                        $timeout(function() {
                            $scope.drawingTool = !$scope.drawingTool;

                            $scope.drawInteraction.setActive($scope.drawingTool);
                        });
                    };

                    // is the point setting tool active or not? Defaults to not
                    $scope.pointTool = false;

                    // function for toggling the above
                    $scope.togglePointTool = function() {
                        if ($scope.drawingTool) {
                            $scope.toggleDrawingTool();
                        }

                        $timeout(function() {
                            $scope.pointTool = !$scope.pointTool;
                        });
                    };

                    $scope.deletePoint = function() {
                        for (var i = 0; i < $scope.mapLayers.length; i++) {
                            var mapLayer = $scope.mapLayers[i];
                            if (mapLayer.name == 'Alueet') {
                                mapLayer.source.geojson.object.features.length = 0;

                                break;
                            }
                        }

                        $scope.alue.geometry.coordinates.length = 0;
                        $scope.alue.properties.sijainti = null;
                        $scope.alue.properties.alue = null;
                    };

                    /*
                     * Center the map to the location of the area
                     */
                    $scope.centerToLocation = function(coord) {
                        var tmpCoord = [];
                        if (coord) {
                            tmpCoord = coord;
                        } else {
                            if ($scope.alue.properties.sijainti) {
                                tmpCoord = $scope.alue.properties.sijainti.split(" ");
                            } else if ($scope.alue.properties.alue) {
                                tmpCoord = MapService.approximatePolygonCenter($scope.alue.geometry);
                            }
                        }
                        if (tmpCoord) {
                            var coord = tmpCoord;
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
                    // to ease drawing when in full screen mode, add a keyboard
                    // shortcut
                    hotkeys.bindTo($scope).add({
                        combo : 'p',
                        description : 'Piirtomoodi',
                        callback : function() {
                            if ($scope.edit) {
                                $scope.toggleDrawingTool();
                            }
                        }
                    });

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

                    // to ease point setting when in full screen mode, add a keyboard
                    // shortcut
                    hotkeys.bindTo($scope).add({
                        combo : 'a',
                        description : 'Pisteen asetus',
                        callback : function() {
                            if ($scope.edit) {
                                $scope.togglePointTool();
                            }
                        }
                    });

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

                    $scope.currentLocale = locale.getLocale();

                    /*
                     * Create a report
                     */
                    $scope.createReport = function(type) {
                        var report = {'alueId': $scope.alue.properties.id, 'requestedOutputType': type, 'reportDisplayName': $scope.alue.properties.nimi};
                        RaporttiService.createRaportti('Alueraportti', report).then(function success(data) {
                            AlertService.showInfo(locale.getString('common.Report_request_created'));
                        }, function error(data) {
                            AlertService.showError(locale.getString('common.Error'), AlertService.message(data));
                        });
                    };


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

                                $scope.updateLayerData('Kiinteistot');
                                $scope.updateLayerData('Rakennukset');
                            }
                        }

                    });

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

                    $scope.showMap = true;
                }

        ]);
