;(function() {
  function main() {
    var vizjson = {
      'version':'0.1.0',
      'scrollwheel':false,
      'legends':false,
      'map_provider':'leaflet',
      'bounds':[
        [
          -18.979025953255253,
          -155.7421875
        ],
        [
          80.58972691308571,
          261.2109375
        ]
      ],
      'center':'[51.505, -0.09]',
      'zoom':13,
      'updated_at':'2015-03-13T11:24:37+00:00',
      'datasource': {
        'user_name': 'nerik-awesomerouting',
        'maps_api_template': 'https://{user}.cartodb.com',
      },
      'layers':[
        {
          'options':{
            'id':'0a3d9104-99c6-482b-9f8c-7c6134bddcdc',
            'order':0,
            'visible':true,
            'type':'Tiled',
            'name':'Positron',
            'className':'default positron_rainbow',
            'base_type':'positron_rainbow',
            'urlTemplate':'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            'read_only':true,
            'minZoom':'0',
            'maxZoom':'18',
            'attribution':'\u00a9 <a href=\'http://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors \u00a9 <a href= \'http://cartodb.com/attributions#basemaps\'>CartoDB</a>',
            'subdomains':'abcd',
            'category':'CartoDB'
          },
          'infowindow':null,
          'tooltip':null,
          'id':'0a3d9104-99c6-482b-9f8c-7c6134bddcdc',
          'order':0,
          'type':'tiled'
        }
      ],
      'overlays':[
        {
          'type':'loader',
          'options':{
            'display':true,
            'x':20,
            'y':150
          }
        },
        {
          'type':'search',
          'options':{
            'display':true
          }
        },
        {
          'type':'zoom',
          'options':{
            'x':20,
            'y':20,
            'display':true
          }
        }
      ],
      'prev':null,
      'next':null,
      'transition_options':{}
    };

    cartodb.createVis('map', vizjson, {})
    .done(function(vis, layers) {
      initViz();
    })
    .error(function(err) {
      console.log(err);
    });

    var queryTpl = cartodb._.template("SELECT duration, length, shape as the_geom, '<%= mode %>' as mode FROM cdb_route_point_to_point('POINT(<%= s.lng %> <%= s.lat %>)'::geometry,'POINT(<%= d.lng %> <%= d.lat %>)'::geometry, '<%= mode %>')");
    var legendHtmlTpl = cartodb._.template(cartodb.$('#legend-tpl').html());

    var startIcon = L.divIcon({className: 'marker-start'});
    var destIcon = L.icon({iconUrl: 'pin.svg', iconAnchor: [10, 37]});

    function initViz() {
      var sql = new cartodb.SQL({
          user: 'nerik-awesomerouting',
          protocol: 'https',
          api_key: 'ea7bf48800b95e02c87a67f6cc74cbb1b29d1b79',
          sql_api_template: 'https://{user}.cartodb.com:443',
      });
      var map = vis.getNativeMap();
      var markerStart = L.marker([40.410789, -3.712235], {draggable: true, icon: startIcon}).addTo(map);
      var markerDest = L.marker([40.409938, -3.697953], {draggable: true, icon: destIcon}).addTo(map);
      var geoJSONLayer;

      map.setView([40.409, -3.705], 16);

      function onMarkerDrag(event) {
        fetchRoutes();
      }

      function fetchRoutes() {
        var queryParts = [];
        ['car','walk','bicycle'].forEach(function (mode) {
          var q = queryTpl({
            s: markerStart.getLatLng(),
            d: markerDest.getLatLng(),
            mode: mode
          });
          queryParts.push(q);
        })
        var query = queryParts.join('UNION ALL ');

        sql.execute(query, {}, {
          format: 'geojson'
        })
        .done(function(data){
          drawPaths(data);
        })
      }

      function drawPaths(data) {

        if (geoJSONLayer) {
          map.removeLayer(geoJSONLayer);
        }
        var durationMn = {};
        geoJSONLayer = L.geoJson(data, {
          style: function (feature) {
            console.log(feature.properties)
            return {
              className: 'path-' + feature.properties.mode
            }
          },
          onEachFeature: function (feature, layer) {

            pathCar = layer;
            layer.className = 'path-' + feature.properties.mode;
            durationMn[feature.properties.mode] = Math.ceil(feature.properties.duration/60) + 'min';
          }
        }).addTo(map);
        cartodb.$('.js-legend').html( legendHtmlTpl({durationMn: durationMn}) );
      }
      markerStart.on('dragend', onMarkerDrag);
      markerDest.on('dragend', onMarkerDrag);

      fetchRoutes();

    }


  }
  window.onload = main;
})();
