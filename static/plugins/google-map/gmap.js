window.marker = null;

function initialize() {
  var map;
  var latitude = $('#map_canvas').attr('data-latitude');
  var longitude = $('#map_canvas').attr('data-longitude');
  var mapMarker = $('#map_canvas').attr('data-marker');
  var mapMarkerName = $('#map_canvas').attr('data-marker-name');
  var nottingham = new google.maps.LatLng(latitude, longitude);
  var style = [{
      "featureType": "landscape",
      "stylers": [{
          "hue": "#FFAD00"
        },
        {
          "saturation": 50.2
        },
        {
          "lightness": -34.8
        },
        {
          "gamma": 1
        }
      ]
    },
    {
      "featureType": "road.highway",
      "stylers": [{
          "hue": "#FFAD00"
        },
        {
          "saturation": -19.8
        },
        {
          "lightness": -1.8
        },
        {
          "gamma": 1
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "stylers": [{
          "hue": "#FFAD00"
        },
        {
          "saturation": 72.4
        },
        {
          "lightness": -32.6
        },
        {
          "gamma": 1
        }
      ]
    },
    {
      "featureType": "road.local",
      "stylers": [{
          "hue": "#FFAD00"
        },
        {
          "saturation": 74.4
        },
        {
          "lightness": -18
        },
        {
          "gamma": 1
        }
      ]
    },
    {
      "featureType": "water",
      "stylers": [{
          "hue": "#00FFA6"
        },
        {
          "saturation": -63.2
        },
        {
          "lightness": 38
        },
        {
          "gamma": 1
        }
      ]
    },
    {
      "featureType": "poi",
      "stylers": [{
          "hue": "#FFC300"
        },
        {
          "saturation": 54.2
        },
        {
          "lightness": -14.4
        },
        {
          "gamma": 1
        }
      ]
    }
  ];
  var mapOptions = {
    center: nottingham,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    backgroundColor: "#000",
    zoom: 15,
    panControl: false,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    overviewMapControl: false,
    zoomControlOptions: {
      style: google.maps.ZoomControlStyle.LARGE
    }
  }
  map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
  var mapType = new google.maps.StyledMapType(style, {
    name: "Grayscale"
  });
  map.mapTypes.set('grey', mapType);
  map.setMapTypeId('grey');
  var marker_image = mapMarker;
  var pinIcon = new google.maps.MarkerImage(marker_image, null, null, null, new google.maps.Size(37, 55));
  marker = new google.maps.Marker({
    position: nottingham,
    map: map,
    icon: pinIcon,
    title: mapMarkerName
  });
}
var map = document.getElementById('map_canvas');
if (map != null) {
  google.maps.event.addDomListener(window, 'load', initialize);
}