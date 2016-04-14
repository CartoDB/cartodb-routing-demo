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

    var destIcon = L.icon({iconUrl: 'pin.svg', iconAnchor: [10, 37]});

    var queries = {
      country: cartodb._.template('SELECT <%= cacheBuster %>, name, cdb_geocode_admin0_polygon(name) the_geom FROM world_borders ORDER BY RANDOM() limit 1'),
      city: cartodb._.template('SELECT <%= cacheBuster %>, name, cdb_geocode_namedplace_point(name) the_geom FROM ne_110m_populated_places_simple ORDER BY RANDOM() limit 1')
    }

    var sql = new cartodb.SQL({
        user: 'nerik-awesomerouting',
        protocol: 'https',
        api_key: 'ea7bf48800b95e02c87a67f6cc74cbb1b29d1b79',
        sql_api_template: 'https://{user}.cartodb.com:443',
    });

    var map;

    function initViz() {

      map = vis.getNativeMap();

      map.setView([40.409, -3.705], 16);

      cartodb.$('.js-gcTab').on('click', onTabClick);
    }

    function onTabClick(event) {
      if (!map) return;

      cartodb.$('.js-gcTab').removeClass('selected');
      cartodb.$(event.target).addClass('selected');

      var type = cartodb.$(event.target).data('type');
      var query = queries[type]({cacheBuster: Math.random()});
      sql.execute(query, {}, {
        format: 'geojson'
      })
      .done(function(data){
        console.log(data);
        var geoJSONLayer = L.geoJson(data).addTo(map);
        if (['region','country'].indexOf(type) > -1) {
          map.fitBounds(geoJSONLayer.getBounds())
        } else {
          map.setView(geoJSONLayer.getBounds().getSouthWest(), 10);
        }
      })
      console.log(query)
    }


  }
  window.onload = main;
})();
