angular.module('mip.map').factory('FeatureStyleService', [ 'UserService', function(UserService) {
    var karttaVarit = {                     
            fill: {
                valtakunnallinen    : 'rgba(143, 107, 177, 1)',
                seudullinen         : 'rgba(223, 1, 1, 1)',
                paikallinen         : 'rgba(0, 0, 255, 1)',
                maisemallinen       : 'rgba(18, 153, 74, 1)',
                historiallinen      : 'rgba(183, 88, 25, 1)',
                eiArvoluokkaa       : 'rgba(189, 189, 189, 1)',
                rakennusPurettu     : 'rgba(45, 51, 47, 1)',
                valkoinen           : 'rgba(255, 255, 255, 1)',
                vaaleanHarmaa       : 'rgba(211, 211, 211, 1)'
            },
            fillOpaque: {
                valtakunnallinen    : 'rgba(143, 107, 177, 0.6)',
                seudullinen         : 'rgba(223, 1, 1, 0.6)',
                paikallinen         : 'rgba(0, 0, 255, 0.6)',
                maisemallinen       : 'rgba(18, 153, 74, 0.6)',
                historiallinen      : 'rgba(183, 88, 25, 0.6)',
                eiArvoluokkaa       : 'rgba(189, 189, 189, 0.6)',
                rakennusPurettu     : 'rgba(45, 51, 47, 0.6)',
                valkoinen           : 'rgba(255, 255, 255, 0.6)',
                kohdeTuhoutunut     : 'rgba(75, 16, 16, 0.6)'
            }, 
            stroke: {
                kiinteisto          : 'rgba(0, 64, 255, 1)',
                rakennus            : 'rgba(255, 165, 0, 1)',
                alue                : 'rgba(255, 0, 0, 1)',
                arvoalue            : 'rgba(22, 188, 89, 1)',
                kohde               : 'rgba(252, 86, 153, 1)',
                alakohde            : 'rgba(252, 86, 200, 1)',
                tutkimusalue        : 'rgba(225, 210, 80, 1)'
            }            
        };
    // Suurempi = ylempänä, Pienempi = alempana
    var zIndexit = {
            kiinteisto: 300,
            rakennus: 400,
            alue: 100,
            arvoalue: 200,
            projekti: 450,
            yksikko: 460,
            kohde: 500,
            alakohde: 600,
            tutkimusalue: 700
    };   
    
    var fss = {          
            getZIndex : function(nimi) {
                return zIndexit[nimi];
            },
            kiinteistoStyle : function(feature) {   
                var props = feature.getProperties();

                var userProps = UserService.getProperties().user;

                if(userProps.vanhatKarttavarit == true){
                    var img = new ol.style.Circle({
                        radius : 8,
                        stroke : new ol.style.Stroke({
                            color : karttaVarit.stroke.kiinteisto,
                            width : 2
                        }),
                        fill : new ol.style.Fill({
                            color : karttaVarit.fill.valkoinen
                        })
                    });
                    var style = new ol.style.Style({image: img, zIndex: zIndexit.kiinteisto});
                    return [style];
                }
                
                if(props === undefined || props === null) {
                    var img = new ol.style.Circle({
                        radius : 8,
                        stroke : new ol.style.Stroke({
                            color : karttaVarit.stroke.kiinteisto,
                            width : 2
                        }),
                        fill : new ol.style.Fill({
                            color : karttaVarit.fill.eiArvoluokkaa
                        })
                    });
                    var style = new ol.style.Style({image: img, zIndex: zIndexit.kiinteisto});
                    return [style];
                }
                
                switch (parseInt(props.arvotustyyppi_id)) {
                    case 1: //Paikallinen
                        var img = new ol.style.Circle({
                            radius : 8,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.kiinteisto,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.paikallinen
                            })
                        });
                        break;
                    case 2: //Valtakunnallinen
                        var img = new ol.style.Circle({
                            radius : 8,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.kiinteisto,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.valtakunnallinen
                            })
                        });                          
                        break;
                    case 3: //Historiallinen
                        var img = new ol.style.Circle({
                            radius : 8,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.kiinteisto,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.historiallinen
                            })
                        });
                        break;
                    case 4: //Seudullinen
                        var img = new ol.style.Circle({
                            radius : 8,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.kiinteisto,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.seudullinen
                            })
                        });
                        break;
                    case 5: //Maisemallinen
                        var img = new ol.style.Circle({
                            radius : 8,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.kiinteisto,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.maisemallinen
                            })
                        });
                        break;
                    default:
                        var img = new ol.style.Circle({
                            radius : 8,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.kiinteisto,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.eiArvoluokkaa
                            })
                        });
                }

                var style = new ol.style.Style({image: img, zIndex: zIndexit.kiinteisto});
                return [style];                
            },
            rakennusStyle : function(feature) {   
                var props = feature.getProperties();
                var purettu = feature.getProperties().purettu;
                var userProps = UserService.getProperties().user;
                
                if(userProps.vanhatKarttavarit == true) {
                    var img = null;
                    if(purettu == true) {
                        var img = new ol.style.Circle({
                            radius : 6,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.rakennus,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.rakennusPurettu
                            })
                        });
                        var style = new ol.style.Style({image: img, zIndex: zIndexit.rakennus});
                        //return [style];
                    } else {
                            var img = new ol.style.Circle({
                                radius : 6,
                                stroke : new ol.style.Stroke({
                                    color : karttaVarit.stroke.rakennus,
                                    width : 2
                                }),
                                fill : new ol.style.Fill({
                                    color : karttaVarit.fill.vaaleanHarmaa
                                })
                            });
                            var style = new ol.style.Style({image: img, zIndex: zIndexit.rakennus});
                           // return [style];                       
                    }
                    
                    // If the feature has a property "ShowLabel", show the last char of the inventointinumero
                    if(props.showLabel) {
                        if(props.MMLFeatureIndex) {
                            var str = ''+parseInt(props.MMLFeatureIndex);
                            var textStyle = new ol.style.Text({
                                font: '10px Calibri,sans-serif',
                                text: str,
                                scale: 1,
                                offsetY: 0,
                                textAlign: 'center',
                                fill: new ol.style.Fill({
                                  color: '#000'
                                }),
                                // get the text from the feature - `this` is ol.Feature
                                // and show only under certain resolution
                                //text: map.getView().getZoom() > 12 ? this.get('description') : ''
                              });
                        } else {                      
                            var str = ''+parseInt(props.inventointinumero);
                            var textStyle = new ol.style.Text({
                                font: '10px Calibri,sans-serif',
                                text: str,
                                scale: 1,
                                offsetY: 0,
                                textAlign: 'center',
                                fill: new ol.style.Fill({
                                  color: '#000'
                                }),
                                // get the text from the feature - `this` is ol.Feature
                                // and show only under certain resolution
                                //text: map.getView().getZoom() > 12 ? this.get('description') : ''
                            });
                        }
                    }
                    if(textStyle) {
                        var style = new ol.style.Style({image: img, text: textStyle, zIndex: zIndexit.rakennus})
                    }    else {
                        var style = new ol.style.Style({image: img, zIndex: zIndexit.rakennus})
                    }  
                    return [style];
                }
                
                if(props === undefined || props === null) {
                    var img = new ol.style.Circle({
                        radius : 6,
                        stroke : new ol.style.Stroke({
                            color : karttaVarit.stroke.rakennus,
                            width : 2
                        }),
                        fill : new ol.style.Fill({
                            color : karttaVarit.fill.eiArvoluokkaa
                        })
                    });
                    var style = new ol.style.Style({image: img, zIndex: zIndexit.rakennus});
                    return [style];
                }
                
                switch (parseInt(props.arvotustyyppi_id)) {
                    case 1: //Paikallinen
                        var img = new ol.style.Circle({
                            radius : 6,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.rakennus,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.paikallinen
                            })
                        });
                        break;
                    case 2: //Valtakunnallinen
                        var img = new ol.style.Circle({
                            radius : 6,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.rakennus,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.valtakunnallinen
                            })
                        });                          
                        break;
                    case 3: //Historiallinen
                        var img = new ol.style.Circle({
                            radius : 6,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.rakennus,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.historiallinen
                            })
                        });
                        break;
                    case 4: //Seudullinen
                        var img = new ol.style.Circle({
                            radius : 6,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.rakennus,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.seudullinen
                            })
                        });
                        break;
                    case 5: //Maisemallinen
                        var img = new ol.style.Circle({
                            radius : 6,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.rakennus,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.maisemallinen
                            })
                        });
                        break;
                    default:
                        var img = new ol.style.Circle({
                            radius : 6,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.rakennus,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.eiArvoluokkaa
                            })
                        });
                }
                
                if(props.purettu === true){
                    var img = new ol.style.Circle({
                        radius : 6,
                        stroke : new ol.style.Stroke({
                            color : karttaVarit.stroke.rakennus,
                            width : 2
                        }),
                        fill : new ol.style.Fill({
                            color : karttaVarit.fill.rakennusPurettu
                        })
                    });
                }
                
                // If the feature has a property "ShowLabel", show the last char of the inventointinumero
                if(props.showLabel) {
                    if(props.MMLFeatureIndex) {
                        var str = ''+parseInt(props.MMLFeatureIndex);
                        var textStyle = new ol.style.Text({
                            font: '10px Calibri,sans-serif',
                            text: str,
                            scale: 1,
                            offsetY: 0,
                            textAlign: 'center',
                            fill: new ol.style.Fill({
                              color: '#000'
                            }),
                            // get the text from the feature - `this` is ol.Feature
                            // and show only under certain resolution
                            //text: map.getView().getZoom() > 12 ? this.get('description') : ''
                          });
                    } else {                      
                        var str = ''+parseInt(props.inventointinumero);
                        var textStyle = new ol.style.Text({
                            font: '10px Calibri,sans-serif',
                            text: str,
                            scale: 1,
                            offsetY: 0,
                            textAlign: 'center',
                            fill: new ol.style.Fill({
                              color: '#000'
                            }),
                            // get the text from the feature - `this` is ol.Feature
                            // and show only under certain resolution
                            //text: map.getView().getZoom() > 12 ? this.get('description') : ''
                        });
                    }
                }
                if(textStyle) {
                    var style = new ol.style.Style({image: img, text: textStyle, zIndex: zIndexit.rakennus})
                }    else {
                    var style = new ol.style.Style({image: img, zIndex: zIndexit.rakennus})
                }  
                return [style];              
            },
            alueStyle : function() {
                var userProps = UserService.getProperties().user;
                // TODO: Point or area?
                // http://openlayers.org/en/master/examples/polygon-styles.html
                if(userProps.vanhatKarttavarit == true){
                    var polygonStyle = new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: karttaVarit.stroke.alue,
                            width: 2
                        }),
                        fill: new ol.style.Fill({
                            color: 'rgba(255, 0, 0, 0.5)'
                        })
                    });
                    
                    var pointStyle = new ol.style.Style({
                        image : new ol.style.Circle({
                            radius : 8,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.alue,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.valkoinen
                            }),
                            geometry: function(feature) {
                                // return the coordinates of the first ring of
                                // the polygon
                                var coordinates = feature.getGeometry().getCoordinates()[0];
                                return new ol.geom.MultiPoint(coordinates);
                              }
                        })
                    });
                    
                    return [polygonStyle, pointStyle];
                }
                
                var polygonStyle = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: karttaVarit.stroke.alue,
                        width: 2
                    }),
                    fill: new ol.style.Fill({
                        color: karttaVarit.fillOpaque.eiArvoluokkaa
                    })
                });
                
                var pointStyle = new ol.style.Style({
                    image : new ol.style.Circle({
                        radius : 8,
                        stroke : new ol.style.Stroke({
                            color : karttaVarit.stroke.alue,
                            width : 2
                        }),
                        fill : new ol.style.Fill({
                            color : karttaVarit.fill.eiArvoluokkaa
                        }),
                        geometry: function(feature) {
                            // return the coordinates of the first ring of
                            // the polygon
                            var coordinates = feature.getGeometry().getCoordinates()[0];
                            return new ol.geom.MultiPoint(coordinates);
                          }
                    })
                });
                
                return [polygonStyle, pointStyle];
            },
            arvoalueStyle : function(feature) {                
                var props = feature.getProperties();
                var userProps = UserService.getProperties().user;
                
                if(userProps.vanhatKarttavarit == true){
                    var point = new ol.style.Circle({                                                    
                        radius : 10,
                        stroke : new ol.style.Stroke({
                            color : karttaVarit.stroke.arvoalue,
                            width : 2
                        }),
                        fill : new ol.style.Fill({
                            color : 'rgba(255, 255, 255, 1)'
                        }),
                        geometry: function(feature) {
                            var coordinates = feature.getGeometry().getCoordinates()[0];
                            return new ol.geom.MultiPoint(coordinates);
                        }
                    });
                    var pol = { 
                            stroke: new ol.style.Stroke({
                                color: karttaVarit.stroke.arvoalue,
                                width: 2
                           }),
                           fill: new ol.style.Fill({
                               color: 'rgba(0, 255, 0, 0.5)'
                           })
                    };
                                        
                    if(props.showLabel) {
                        var str = ''+parseInt(props.inventointinumero);
                        var textStyle = new ol.style.Text({
                            font: '10px Calibri,sans-serif',
                            text: str,
                            scale: 1,
                            offsetY: 0,
                            textAlign: 'center',
                            fill: new ol.style.Fill({
                              color: '#000'
                            }),
                            // get the text from the feature - `this` is ol.Feature
                            // and show only under certain resolution
                            //text: map.getView().getZoom() > 12 ? this.get('description') : ''
                          });
                    }
                    if(textStyle) {
                        var polygonStyle = new ol.style.Style({stroke: pol.stroke, fill: pol.fill, text: textStyle, zIndex: zIndexit.rakennus})
                        var pointStyle = new ol.style.Style({image: point, text: textStyle, zIndex: zIndexit.arvoalue});
                    } else {
                        var polygonStyle = new ol.style.Style({stroke: pol.stroke, fill: pol.fill, zIndex: zIndexit.rakennus})
                        var pointStyle = new ol.style.Style({image: point, zIndex: zIndexit.arvoalue});
                    } 
                    return [polygonStyle, pointStyle];
                }
                if(props === undefined || props === null) {
                    var polygonStyle = new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: karttaVarit.stroke.arvoalue,
                            width: 2
                        }),
                        fill: new ol.style.Fill({
                            color: karttaVarit.fillOpaque.eiArvoluokkaa 
                        })
                    });
                    
                    var pointStyle = new ol.style.Style({
                        image : new ol.style.Circle({
                            radius : 10,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.arvoalue,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fillOpaque.eiArvoluokkaa
                            }),
                            geometry: function(feature) {
                                // return the coordinates of the first ring of
                                // the polygon
                                var coordinates = feature.getGeometry().getCoordinates()[0];
                                return new ol.geom.MultiPoint(coordinates);
                              }
                        })
                    });
                    return [polygonStyle, pointStyle];
                }
                
                switch (parseInt(props.arvotustyyppi_id)) {
                    case 1: //Paikallinen
                        var point = new ol.style.Circle({
                            radius : 10,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.arvoalue,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fillOpaque.paikallinen
                            }),
                            geometry: function(feature) {
                                var coordinates = feature.getGeometry().getCoordinates()[0];
                                return new ol.geom.MultiPoint(coordinates);
                            }
                        });
                        var pol = { 
                                stroke: new ol.style.Stroke({
                                    color: karttaVarit.stroke.arvoalue,
                                    width: 2
                               }),
                               fill: new ol.style.Fill({
                                   color: karttaVarit.fillOpaque.paikallinen 
                               })
                            };
                        break;
                    case 2: //Valtakunnallinen
                        var point = new ol.style.Circle({
                            radius : 10,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.arvoalue,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fillOpaque.valtakunnallinen
                            }),
                            geometry: function(feature) {
                                var coordinates = feature.getGeometry().getCoordinates()[0];
                                return new ol.geom.MultiPoint(coordinates);
                            }
                        });
                        var pol = { 
                                stroke: new ol.style.Stroke({
                                    color: karttaVarit.stroke.arvoalue,
                                    width: 2
                               }),
                               fill: new ol.style.Fill({
                                   color: karttaVarit.fillOpaque.valtakunnallinen 
                               })
                            };                       
                        break;
                    case 3: //Historiallinen
                        var point = new ol.style.Circle({
                            radius : 10,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.arvoalue,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fillOpaque.historiallinen
                            }),
                            geometry: function(feature) {
                                var coordinates = feature.getGeometry().getCoordinates()[0];
                                return new ol.geom.MultiPoint(coordinates);
                            }
                        });
                        var pol = { 
                                stroke: new ol.style.Stroke({
                                    color: karttaVarit.stroke.arvoalue,
                                    width: 2
                               }),
                               fill: new ol.style.Fill({
                                   color: karttaVarit.fillOpaque.historiallinen
                               })
                            };
                        break;
                    case 4: //Seudullinen
                        var point = new ol.style.Circle({
                            radius : 10,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.arvoalue,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fillOpaque.seudullinen
                            }),
                            geometry: function(feature) {
                                var coordinates = feature.getGeometry().getCoordinates()[0];
                                return new ol.geom.MultiPoint(coordinates);
                            }
                        });
                        var pol = { 
                                stroke: new ol.style.Stroke({
                                    color: karttaVarit.stroke.arvoalue,
                                    width: 2
                               }),
                               fill: new ol.style.Fill({
                                   color: karttaVarit.fillOpaque.seudullinen
                               })
                            };
                        break;
                    case 5: //Maisemallinen
                        var point = new ol.style.Circle({
                            radius : 10,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.arvoalue,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fillOpaque.maisemallinen
                            }),
                            geometry: function(feature) {
                                var coordinates = feature.getGeometry().getCoordinates()[0];
                                return new ol.geom.MultiPoint(coordinates);
                            }
                        });
                        var pol = { 
                                stroke: new ol.style.Stroke({
                                    color: karttaVarit.stroke.arvoalue,
                                    width: 2
                               }),
                               fill: new ol.style.Fill({
                                   color: karttaVarit.fillOpaque.maisemallinen
                               })
                            };
                        break;
                    default:
                        var point = new ol.style.Circle({
                            radius : 10,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.arvoalue,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fillOpaque.eiArvoluokkaa
                            }),
                            geometry: function(feature) {
                                var coordinates = feature.getGeometry().getCoordinates()[0];
                                return new ol.geom.MultiPoint(coordinates);
                            }
                        });
                        var pol = { 
                                stroke: new ol.style.Stroke({
                                    color: karttaVarit.stroke.arvoalue,
                                    width: 2
                               }),
                               fill: new ol.style.Fill({
                                   color: karttaVarit.fillOpaque.eiArvoluokkaa 
                               })
                            };
                }
                
                if(props.showLabel) {
                    var str = ''+parseInt(props.inventointinumero);
                    var textStyle = new ol.style.Text({
                        font: '10px Calibri,sans-serif',
                        text: str,
                        scale: 1,
                        offsetY: 0,
                        textAlign: 'center',
                        fill: new ol.style.Fill({
                          color: '#000'
                        }),
                        // get the text from the feature - `this` is ol.Feature
                        // and show only under certain resolution
                        //text: map.getView().getZoom() > 12 ? this.get('description') : ''
                      });
                }
                if(textStyle) {
                    var polygonStyle = new ol.style.Style({stroke: pol.stroke, fill: pol.fill, text: textStyle, zIndex: zIndexit.rakennus})
                    var pointStyle = new ol.style.Style({image: point, text: textStyle, zIndex: zIndexit.arvoalue});
                } else {
                    var polygonStyle = new ol.style.Style({stroke: pol.stroke, fill: pol.fill, zIndex: zIndexit.rakennus})
                    var pointStyle = new ol.style.Style({image: point, zIndex: zIndexit.arvoalue});
                }  
                return [ polygonStyle, pointStyle];
            },
            porrashuoneStyle : function() {
                var style = new ol.style.Style({
                    image : new ol.style.Circle({
                        radius : 8,
                        stroke : new ol.style.Stroke({
                            color : 'grey',
                            width : 2
                        }),
                        fill : new ol.style.Fill({
                            color : 'white'
                        })
                    })
                });
                return [
                    style
                ];
            },
            projektiStyle : function() {                    
                var polygonStyle = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'rgba(163, 73, 164, 1)',
                        width: 2
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(163, 73, 164, 0.5)'
                    })
                });
                
                var pointStyle = new ol.style.Style({
                    image : new ol.style.Circle({
                        radius : 8,
                        stroke : new ol.style.Stroke({
                            color: 'rgba(163, 73, 164, 1)',
                            width : 2
                        }),
                        fill : new ol.style.Fill({
                            color : 'white'
                        }),
                        geometry: function(feature) {
                            // return the coordinates of the first ring of
                            // the polygon
                            var coordinates = feature.getGeometry().getCoordinates()[0];
                            return new ol.geom.MultiPoint(coordinates);
                          }
                    })
                });
                
                return [
                    polygonStyle, pointStyle
                ];
            },
            yksikkoStyle : function() {                 
                var polygonStyle = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 255, 217, 1)',
                        width: 2
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(0, 255, 217, 0.5)'
                    })
                });
                
                var pointStyle = new ol.style.Style({
                    image : new ol.style.Circle({
                        radius : 8,
                        stroke : new ol.style.Stroke({
                            color: 'rgba(0, 255, 217, 1)',
                            width : 2
                        }),
                        fill : new ol.style.Fill({
                            color : 'white'
                        }),
                        geometry: function(feature) {
                            // return the coordinates of the first ring of
                            // the polygon
                            var coordinates = feature.getGeometry().getCoordinates()[0];
                            return new ol.geom.MultiPoint(coordinates);
                          }
                    })
                });
                
                return [
                    polygonStyle, pointStyle
                ];
            },
            kohdeStyle : function(feature) {   
                var props = feature.getProperties();

                var userProps = UserService.getProperties().user;

                //TODO: Jos karttaväreillä on jotain asetuksia, niin otetaan tästä käyttöön
                //if(userProps.vanhatKarttavarit == true){
                    var img = new ol.style.Circle({
                        radius : 8,
                        stroke : new ol.style.Stroke({
                            color : karttaVarit.stroke.kohde,
                            width : 2
                        }),
                        fill : new ol.style.Fill({
                            color : props.tuhoutunut ? karttaVarit.fillOpaque.kohdeTuhoutunut : karttaVarit.fillOpaque.valkoinen
                        })
                    });
                    var pointStyle = new ol.style.Style({image: img, zIndex: zIndexit.kohde});
                    
                    var polygonStyle = new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: karttaVarit.stroke.kohde,
                            width: 2
                        }),
                        fill: new ol.style.Fill({
                            color: props.tuhoutunut ? karttaVarit.fillOpaque.kohdeTuhoutunut : karttaVarit.fillOpaque.valkoinen
                        })
                    });
                    
                    return [polygonStyle, pointStyle];
                //}
                
                
                //TODO: Onko nämä käytössä muinaisjäännöksille? Jos on, niin mistä kentästä arvot otetaan?
                /*
                if(props === undefined || props === null) {
                    var img = new ol.style.Circle({
                        radius : 8,
                        stroke : new ol.style.Stroke({
                            color : karttaVarit.stroke.kohde,
                            width : 2
                        }),
                        fill : new ol.style.Fill({
                            color : karttaVarit.fill.eiArvoluokkaa
                        })
                    });
                    var style = new ol.style.Style({image: img, zIndex: zIndexit.kohde});
                    return [style];
                }
                
                switch (parseInt(props.arvotustyyppi_id)) {
                    case 1: //Paikallinen
                        var img = new ol.style.Circle({
                            radius : 8,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.kohde,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.paikallinen
                            })
                        });
                        break;
                    case 2: //Valtakunnallinen
                        var img = new ol.style.Circle({
                            radius : 8,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.kohde,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.valtakunnallinen
                            })
                        });                          
                        break;
                    case 3: //Historiallinen
                        var img = new ol.style.Circle({
                            radius : 8,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.kohde,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.historiallinen
                            })
                        });
                        break;
                    case 4: //Seudullinen
                        var img = new ol.style.Circle({
                            radius : 8,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.kohde,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.seudullinen
                            })
                        });
                        break;
                    case 5: //Maisemallinen
                        var img = new ol.style.Circle({
                            radius : 8,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.kohde,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.maisemallinen
                            })
                        });
                        break;
                    default:
                        var img = new ol.style.Circle({
                            radius : 8,
                            stroke : new ol.style.Stroke({
                                color : karttaVarit.stroke.kohde,
                                width : 2
                            }),
                            fill : new ol.style.Fill({
                                color : karttaVarit.fill.eiArvoluokkaa
                            })
                        });
                }

                var style = new ol.style.Style({image: img, zIndex: zIndexit.kohde});
                return [style];   
                */             
            },
            alakohdeStyle : function(feature) {   
                var props = feature.getProperties();

                var userProps = UserService.getProperties().user;

                //TODO: Jos karttaväreillä on jotain asetuksia, niin otetaan tästä käyttöön
                //if(userProps.vanhatKarttavarit == true){
                    var img = new ol.style.Circle({
                        radius : 8,
                        stroke : new ol.style.Stroke({
                            color : karttaVarit.stroke.alakohde,
                            width : 2
                        }),
                        fill : new ol.style.Fill({
                            color : karttaVarit.fillOpaque.valkoinen
                        })
                    });
                    var pointStyle = new ol.style.Style({image: img, zIndex: zIndexit.alakohde});
                    
                    var polygonStyle = new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: karttaVarit.stroke.alakohde,
                            width: 2
                        }),
                        fill: new ol.style.Fill({
                            color: karttaVarit.fillOpaque.valkoinen
                        })
                    });
                    
                    return [polygonStyle, pointStyle];   
            },
            tutkimusalueStyle : function(feature) {
                //Palautettavat tyylit
                var styles = [];
                
                var props = feature.getProperties();
                var userProps = UserService.getProperties().user;
                
                var polygonStyle = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: karttaVarit.stroke.tutkimusalue,
                        width: 2
                    }),
                    fill: new ol.style.Fill({
                        color: karttaVarit.fillOpaque.valkoinen
                    }),
                    text: new ol.style.Text({
                        font: '10px Calibri,sans-serif',
                        text: "",
                        scale: 1,
                        offsetY: 0,
                        textAlign: 'center',
                        fill: new ol.style.Fill({
                          color: '#000'
                        })
                    })              
                });
                
                // Jos "label" property on asetettuna, näytetään se tasolle
                if(props.label !== undefined) {
                    var str = ""+props.label;   
                    polygonStyle.getText().setText(str);                        
                } else if(props.label === undefined && props.nimi !== undefined) {
                    var str = ""+props.nimi;
                    polygonStyle.getText().setText(str);
                }
                
                styles.push(polygonStyle);
                                
                return styles;   
            }
    }
    return fss;
}]);
