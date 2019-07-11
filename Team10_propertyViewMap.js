
define(["https://api.tiles.mapbox.com/mapbox-gl-js/v0.44.2/mapbox-gl.js", "https://api.mapbox.com/mapbox.js/plugins/turf/v2.0.2/turf.min.js", "https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"], function(mapboxgl, turf) {
    map = '';
    mapboxgl_gbl = mapboxgl;
    turf_gbl = turf;
    dots = '';
    svg = '';
    curLon = '0';
    curLat = '0';
    bounds = '';
    geojsonFeature = {}
    geoBusFeature = {}


    function mapControl() {};

    //Initialize Control
    mapControl.prototype.initialize = function(oControlHost, fnDoneInitializing, oDataStore) {
        console.log('1.Initialize')

        // Add External StyleSheets
        $("head link[rel='stylesheet']").last().after("<link href='https://api.tiles.mapbox.com/mapbox-gl-js/v0.44.2/mapbox-gl.css' rel='stylesheet' />");
        $("head link[rel='stylesheet']").last().after("<link href='https://raw.githubusercontent.com/mcintoshderek/Cognos/master/Team10_generic.css' rel='stylesheet' />");

        var mapContainer = oControlHost.container.id;

        //Default GeoJSON Setup an empty geoJson. Will populate it with data from Query
        geojsonFeature = {
            "type": "FeatureCollection",
            "features": []
        }


        //Initialize Mapbox and map
        mapboxgl.accessToken = 'pk.eyJ1IjoibWNpbnRvc2hkZXJlayIsImEiOiJjajh6M3h5eTMya3lkMzNtYmV2aWwycWZ2In0.jMqt3uXdINkigqeV8skBqA';
        map = new mapboxgl.Map({
            container: mapContainer, // container id
            style: 'mapbox://styles/mapbox/satellite-streets-v10', //stylesheet location
            center: [-96, 37.8],
            zoom: 3,
            interactive: true
        });
        bounds = new mapboxgl.LngLatBounds();

        fnDoneInitializing();
    };

    //Draw Control and add to screen:
    mapControl.prototype.draw = function(oControlHost) {

        console.log("3. Draw ---");
        console.log(geojsonFeature);

        var oPage = oControlHost.page;
        var box = oControlHost.container.id;
        $('#' + box).parent().prepend('<button id="reset" onclick ="reset()">Reset</button>');
        //Add Initial Layer to Map 
        map.on("load", function() {
            //Add Cognos Source	& Layer
            map.addSource("points", {
                "type": "geojson",
                "data": geojsonFeature
            });

            map.addLayer({
                "id": "points",
                "type": "circle",
                "source": "points",
                "paint": {
                    'circle-radius': {
                        base: 10,
                        stops: [
                            [10, 10],
                            [13, 10]
                        ]
                    },
                    "circle-color": ["get", "color"]
                },
                "filter": ["==", "$type", "Point"],
            });

            //Add 3d Building Layer
            map.addLayer({
                'id': '3d-buildings',
                'source': 'composite',
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': 15,
                'paint': {
                    'fill-extrusion-color': '#aaa',

                    // use an 'interpolate' expression to add a smooth transition effect to the
                    // buildings as the user zooms in
                    'fill-extrusion-height': [
                        "interpolate", ["linear"],
                        ["zoom"],
                        15, 0,
                        15.05, ["get", "height"]
                    ],
                    'fill-extrusion-base': [
                        "interpolate", ["linear"],
                        ["zoom"],
                        15, 0,
                        15.05, ["get", "min_height"]
                    ],
                    'fill-extrusion-opacity': .6
                }
            });

        }); //End On Load

        //set initial map width -- commented out 121-123 Derek
        //var mapWidth = ($('[specname="customControl"]').parent().width());
        //$('[specname="customControl"]').css('width', mapWidth + 'px');
        //map.resize();


        //Zoom and Fit map to points
        geojsonFeature.features.forEach(function(feature) {
            bounds.extend(feature.geometry.coordinates);
        });

        map.fitBounds(bounds, {
            padding: 40
        });

        //SetUp Popup on Click*************************************
        map.on('click', 'points', function(e) {

            var coordinates = e.features[0].geometry.coordinates.slice();
            var description = e.features[0].properties.tooltip;
            var chart = e.features[0].properties.chart;
            var clr = e.features[0].properties.color;
            var id = e.features[0].properties.id;

            // zoom out a little to view popup
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            //Add Popup to map and add content
            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(description)
                .addTo(map);

            //Update List box to show only row related to clicked item
            //Reformat columns to rows    

            //hide all rows
            $("[lid='List1'] tr").hide();

            //add classes to header row to pivot it and show
            $("[lid='List1']  tr:first td").addClass('tdBlock');
            $("[lid='List1']  tr:first").addClass('trBlock');
            $("[lid='List1']  tr:first").show();

            //find coresponding row and add classes to pivot it and show
            $("[lid='List1']  tr:contains('" + id + "') td").addClass('tdBlock');
            $("[lid='List1']  tr:contains('" + id + "')").addClass('trBlock');
            $("[lid='List1']  tr:contains('" + id + "')").show();
            $("[lid='resizeBlock']").width(400)

            //Sample Code on how to use AJAX and Cognos Rest call to insert live item from another report
            /* Advance Option to use Ajax to pull live data from another Report
            if (clr == '#b2abd2') {
                $.ajax({
                    url: chart,
                    type: 'GET',
                    dataType: "html",
                    success: function(data) {
                        new mapboxgl.Popup()
                            .setLngLat(coordinates)
                            .setHTML(data)
                            .addTo(map);
                    }
                });
            } else {
                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(description)
                    .addTo(map);
            }
            */
        });

        // Change the cursor to a pointer when the mouse is over the places layer.
        map.on('mouseenter', 'points', function() {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change it back to a pointer when it leaves.
        map.on('mouseleave', 'points', function() {
            map.getCanvas().style.cursor = '';
        });

        //Update Table Functionality ************************************************* 
        //Add find and reset as a first column to list *******************************
        //this Expect Latitude and Longititude to be last 2 columns in the list ******

        $("[lid='List1']").css("background-color", "#ffffff");
        var numCols = $('[lid="List1"] tr:nth-child(1) td').length;
        $("[lid='List1'] tr").each(function(i) {
            var $tds = $(this).find('td'),
                msg = $tds.eq(2).text(),
                lon = $tds.eq(numCols - 1).text(),
                lat = $tds.eq(numCols - 2).text();
            $tds.eq(numCols - 1).hide();
            $tds.eq(numCols - 2).hide();

            //Add control icons to table
            var MapClickIcon = '<td class="lc" style="padding: 2px 5px 2px 5px; vertical-align: top; text-align:center; ">&nbsp <a class="flyMe" href="#" onclick ="flyToStore(' + parseFloat(lon) + ',' + parseFloat(lat) + ',' + parseFloat(lat) + ',\'' + msg + '\');"> <img height="20px" width="15px" src="https://raw.githubusercontent.com/mcintoshderek/Cognos/master/Team10_map-pin-02.png"></img></a> </td>'
            var resetIcon = '<td  bgcolor="#EEEEEE" style="padding: 2px 5px 2px 5px; vertical-align: middle; text-align:center; "  ><a href="#" onclick ="reset()"> <img height="20px" width="20px" src="https://raw.githubusercontent.com/mcintoshderek/Cognos/master/Team10_refresh.png"></img></a> </td>'

            if (i == 0) {
                $(this).prepend(resetIcon);
            } else {
                $(this).prepend(MapClickIcon);
            }
        });

        //Add hover effect to highlight row, can also be used to link to point on Map
        $("[lid='List1'] tr").not(':first').hover(
            function() {
                var $tds = $(this).find('td');

                if ($tds.eq(4).text().indexOf("-") >= 0) {
                    var lat = $tds.eq(4).text().split('-')
                    var did = $tds.eq(5).text() + ',' + lat[1];
                } else {
                    var did = $tds.eq(5).text() + ',' + $tds.eq(4).text();
                }
            },
            function() {
                $(this).css("background", "");
            }
        );

        //Set up resizing of table container Commented out 248-257 Derek
        //$("[lid='resizeBlock']").css({ "resize": "horizontal", "height": "90%", "overflow": "scroll" })

        //$("[lid='resizeBlock']").click(function() {
         //   var winWidth = $(window).width()
         //   var tblWidth = $("[lid='resizeBlock']").width()
         //   var mapWidth = (winWidth - tblWidth) - 100
         //   $('[specname="customControl"]').css('width', mapWidth + 'px')
         //   map.resize()
        //});

    }; //End Draw Function


    mapControl.prototype.setData = function(oControlHost, oDataStore) {

        this.m_oDataStore = oDataStore;


        // Loop Through Data 
        // data is identified by column number:
        // col 0 = ID 
        // col 1 - Longitutde of data Point
        // col 2 - Latitude of data Point
        // col 3 = Tool Tip Information *Requiered if no tool tip pass in an empty string
        // col 4 = Point Color (Color is defined in the Query to give report writer more control)

        var iRowCount = oDataStore.rowCount;
        for (var iRow = 0; iRow < iRowCount; iRow++) {

            var feature = {}
            feature['type'] = 'Feature'
            feature['geometry'] = {
                'type': 'Point',
                'coordinates': [parseFloat(oDataStore.getCellValue(iRow, 1)), parseFloat(oDataStore.getCellValue(iRow, 2)) * 1],
            }
            feature['properties'] = { 'id': oDataStore.getCellValue(iRow, 0), 'tooltip': oDataStore.getCellValue(iRow, 3), 'color': oDataStore.getCellValue(iRow, 4) }
            geojsonFeature['features'].push(feature)

        }
    };

    return mapControl;
});



//***********************************************************
//Helper Functions ******************************************
//***********************************************************

// Function to move view to selected point
function flyToStore(lng, lat, msg) {
    $('.proximityData').hide("fade", '', 500);
    $('.curLocation').text('View Center on: (' + lat + ',' + lng + ')');
    $('.reset').show();
    $('[lid="legendLive"]').hide()
    $('[lid="legendCognos"]').hide()

    curLon = lng;
    curLat = lat;

    if (lat < 0) {
        lat = -lat
    }

    map.flyTo({ center: [lng, lat], zoom: 14 });

    try {
        map.removeLayer("buff");
        map.removeSource("buffer");

    } catch (err) {
        console.log("Error!");
    }

    var nullIsland = {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [lng, lat]
        },
        properties: {
            name: 'Null Island'
        }
    };

    //Call function to create geojson for circle around point 
    var oneMileOut = createGeoJSONCircle([lng, lat], .125).data

    //Add the geojon for circle
    map.addSource("buffer", {
        "type": "geojson",
        "data": oneMileOut
    });

    map.addLayer({
        "id": "buff",
        "type": "fill",
        "source": "buffer",
        "paint": {
            "fill-color": "#ffffff",
            "fill-opacity": 0.2
        },
        "filter": ["==", "$type", "Polygon"]
    }, "points");

}

//Reset Map to zoomor expand to show all the points 
function resetBounds() {
    map.fitBounds(bounds, {
        padding: 40
    });
}

//Function to create the Circle GeoJSON
//Based on answer found here = http://stackoverflow.com/questions/37599561/drawing-a-circle-with-the-radius-in-miles-meters-with-mapbox-gl-js
var createGeoJSONCircle = function(center, radiusInKm, points) {
    var geoFeatures = [];
    var counts = [];
    var statCounts = [];
    for (var k = 0; k < 4; k++) {

        if (!points) points = 64;

        var coords = {
            latitude: center[1],
            longitude: center[0]
        };

        var km = radiusInKm * (k + 1);


        var ret = [];
        var distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
        var distanceY = km / 110.574;

        var theta, x, y;
        for (var i = 0; i < points; i++) {
            theta = (i / points) * (2 * Math.PI);
            x = distanceX * Math.cos(theta);
            y = distanceY * Math.sin(theta);

            ret.push([coords.longitude + x, coords.latitude + y]);
        }
        ret.push(ret[0]);
        var feature = {}
        feature['type'] = 'Feature'
        feature['geometry'] = {
            'type': 'Polygon',
            'coordinates': [ret],
        }
        feature['properties'] = { 'circle': k }
        geoFeatures.push(feature)
    }

    return {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": geoFeatures
        }
    };
};

//Reset Map and UI items
function reset() {

    resetBounds();
    curLat = 0;
    $('.curLocation').text('View: All');
    $('.proximityData').hide("fade", '', 500);
    $('.reset').hide();
    $('[lid="legendLive"]').show()
    $('[lid="legendCognos"]').show()

    //Reset Table
    $("[lid='List1'] tr").removeClass('trBlock');
    $("[lid='List1'] td").removeClass('tdBlock');
    $("[lid='List1'] tr").show();
}

//toggle layer view
function layerToggle(clickedLayer) {
    var visibility = map.getLayoutProperty(clickedLayer, 'visibility');
    if (visibility === 'visible') {
        map.setLayoutProperty(clickedLayer, 'visibility', 'none');
    } else {
        map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
    }
};