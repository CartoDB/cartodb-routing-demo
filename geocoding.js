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
            'urlTemplate':'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
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

    var destIcon = L.icon({iconUrl: 'pin.svg', iconAnchor: [10, 37]});

    var baseQuery = cartodb._.template("SELECT <%= cacheBuster %>, <%= selects %> FROM <%= table %> WHERE cartodb_id >= RANDOM() * (SELECT MAX (cartodb_id) FROM <%= table %>) ORDER BY cartodb_id limit 1");

    // var queries = {
    //   country: ["name, cdb_geocode_admin0_polygon(name) the_geom", "countries"],
    //   region: ["ain3 || ' (France)' as name, cdb_geocode_admin1_polygon(ain3, 'France') the_geom", "departement"],
    //   city: ["name, cdb_geocode_namedplace_point(name) the_geom", "cities"],
    //   postal_code: ["postal_code || ' (Canada)' as name, cdb_geocode_postalcode_polygon(postal_code::text, 'Canada') the_geom", "ca_postal_codes"],
    //   ip: ["ip as name, cdb_geocode_ipaddress_point(ip) the_geom", "ips"],
    //   street: ["name, cdb_geocode_street_point(name, NULL, NULL, 'USA') the_geom", "fastfood_addresses"]
    // }
    var queries = {
      country: ["name, the_geom", "countries"],
      region: ["ain3 || ' (France)' as name, the_geom", "departement"],
      city: ["name, the_geom", "cities"],
      postal_code: ["postal_code || ' (Canada)' as name, the_geom", "ca_postal_codes"],
      ip: ["ip as name, the_geom", "ips"],
      street: ["name, the_geom", "fastfood_addresses_copy"]
    }

    var sql = new cartodb.SQL({
        user: 'nerik-awesomerouting',
        protocol: 'https',
        sql_api_template: 'https://{user}.cartodb.com:443',
    });

    var map, geoJSONLayer, label;
    var currentType;

    function initViz() {

      map = vis.getNativeMap();

      map.setView([40.409, -3.705], 16);

      cartodb.$('.js-gcTab').on('click', onTabClick);

      loadFeature('country');
    }

    function onTabClick(event) {
      if (!map) return;

      cartodb.$('.js-gcTab').removeClass('selected');

      var tab = (cartodb.$(event.target).hasClass('js-gcTab')) ? cartodb.$(event.target) : cartodb.$(event.target).parents('.js-gcTab');
      tab.addClass('selected');

      var type = tab.data('type');

      loadFeature(type);

    }

    function loadFeature(type) {
      var isPoly = ['region','country', 'postal_code'].indexOf(type) > -1;

      var query = baseQuery({
        selects: queries[type][0],
        table: queries[type][1],
        cacheBuster: Math.random()
      });

      currentType = type;

      sql.execute(query, {}, {
        format: 'geojson'
      })
      .done(function(data){
        if (!data.features[0].geometry) {
          // console.log('geocoding failed')
          loadFeature(type)
          return;
        }
        if (geoJSONLayer) {
          map.removeLayer(geoJSONLayer);
          map.removeLayer(label);
        }
        geoJSONLayer = L.geoJson(data, {
          style: function (feature) {
            return {
              className: 'gc-feature'
            }
          },
          pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: destIcon});
          },
          onEachFeature: function(feature, layer) {
            var coords = (isPoly) ? layer.getBounds().getCenter() : layer.getLatLng();
            label = L.marker(coords, {
              icon: L.divIcon({
                className: '',
                html: cartodb._.template('<div class="gc-featureLabel"><div class="gc-featureLabelLbl<% if (isPoly) {%> gc-featureLabelLbl--poly<%}%>"><%= name %></div></div>')({
                  name: feature.properties.name,
                  isPoly: isPoly
                }),
              })
            }).addTo(map)
          }
        }).addTo(map);


        if (isPoly) {
          map.fitBounds(geoJSONLayer.getBounds().pad(.3))
        } else {
          map.setView(geoJSONLayer.getBounds().getSouthWest(), (['ip','city'].indexOf(type) > -1) ? 6 : 10);
        }
      })
      console.log(query)
    }

  }
  window.onload = main;
})();
