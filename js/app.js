//This file contains 3 main functions: ViewModel, wikipediaAPI, and initMap (and its error handling function 'mapsAuthError')

//////MAP//////
//To create Qusoor map using googleMaps API, similar code is available from the googlemaps documentation: https://developers.google.com/maps/documentation/javascript/tutorial
var map;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 26.349351,
            lng: 50.149871
        },
        zoom: 15,
        //I imported this "Nature" style from https://snazzymaps.com/style/47/nature
        styles: [{
                "featureType": "landscape",
                "stylers": [{
                        "hue": "#FFA800"
                    },
                    {
                        "saturation": 0
                    },
                    {
                        "lightness": 0
                    },
                    {
                        "gamma": 1
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "stylers": [{
                        "hue": "#53FF00"
                    },
                    {
                        "saturation": -73
                    },
                    {
                        "lightness": 40
                    },
                    {
                        "gamma": 1
                    }
                ]
            },
            {
                "featureType": "road.arterial",
                "stylers": [{
                        "hue": "#FBFF00"
                    },
                    {
                        "saturation": 0
                    },
                    {
                        "lightness": 0
                    },
                    {
                        "gamma": 1
                    }
                ]
            },
            {
                "featureType": "road.local",
                "stylers": [{
                        "hue": "#00FFFD"
                    },
                    {
                        "saturation": 0
                    },
                    {
                        "lightness": 30
                    },
                    {
                        "gamma": 1
                    }
                ]
            },
            {
                "featureType": "water",
                "stylers": [{
                        "hue": "#00BFFF"
                    },
                    {
                        "saturation": 6
                    },
                    {
                        "lightness": 8
                    },
                    {
                        "gamma": 1
                    }
                ]
            },
            {
                "featureType": "poi",
                "stylers": [{
                        "hue": "#679714"
                    },
                    {
                        "saturation": 33.4
                    },
                    {
                        "lightness": -25.4
                    },
                    {
                        "gamma": 1
                    }
                ]
            }
        ]
    });
    //Binding, to allow the use of knockout
    ko.applyBindings(new ViewModel());
}

//To handle any GoogleMaps loading errors
function mapsAuthError() {
    alert('Failed to load Qusoor District map.');
}

//////My Neighborhood Spots//////
var qusoorSpots = [{
        title: 'Smoothie Factory',
        lat: 26.345138,
        lng: 50.146387,
        wikipediaPageName: 'Smoothie'
    },
    {
        title: 'Tamimi Market',
        lat: 26.339648,
        lng: 50.151902,
        wikipediaPageName: 'Supermarket'
    },
    {
        title: 'Mishwar Express',
        lat: 26.347820,
        lng: 50.143466,
        wikipediaPageName: 'Shawarma'
    },
    {
        title: 'Beauty Factory',
        lat: 26.346820,
        lng: 50.144946,
        wikipediaPageName: 'Skin_care'
    },
    {
        title: 'Altilal Gas Station',
        lat: 26.348897,
        lng: 50.142525,
        wikipediaPageName: 'Filling_station'
    },
    {
        title: 'Majlis Cafe',
        lat: 26.345291,
        lng: 50.146332,
        wikipediaPageName: 'Coffeehouse'
    },
];

//////Wikipedia API//////
//To request wikipedia pages about somethings related to Qusoor spots
function wikipediaAPI(spot) {

    //To handle wikipedia timeout error if there's no response for 5 seconds
    //I knew about the setTimeout function and how to use it from https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout
    var wikiRequestTimeOut = setTimeout(function() {
        alert('Failed to load wikipedia api.');
    }, 5000);

    //To call the wikipedia API
    //I understood its uses from here https://www.mediawiki.org/wiki/API:Main_page
    //Then wrote my own and used what I needed
    $.ajax({
        url: "https://en.wikipedia.org/w/api.php?action=opensearch&search=" + spot.wikipediaPageName + "&format=json&callback=wikiCallback;",
        dataType: "JSONP",
        success: function(response) {
            //To retrieve articls from wikipedia
            var wikipediaArticle = response[1];
            var url = "http://en.wikipedia.org/wiki/" + wikipediaArticle[0];
            spot.url = url
            spot.extract = response[2]
            clearTimeout(wikiRequestTimeOut);
        }
    });
}

//////ViewModel//////
//Includes: InfoWindow setup, markers setup, and filtering function
var ViewModel = function() {

    var self = this;

    //To use userInput in knockout filtering
    self.userInput = ko.observable("");

    //Generate array of markers
    self.markers = [];

    //////InfoWindow//////
    var infoWindow = new google.maps.InfoWindow();

    //Loop 'qusoorSpots' array to place the pins
    self.spots = ko.observableArray(qusoorSpots);
    self.spots().forEach(function(spot) {
        //Call API to each spot
        wikipediaAPI(spot);
        //////MARKER//////
        //inspired from GoogleMaps documentation: https://developers.google.com/maps/documentation/javascript/examples/marker-animations
        //1. Setup -> pins will drop on specified spots
        var marker = new google.maps.Marker({
            map: map,
            position: {
                lat: spot.lat,
                lng: spot.lng
            },
            title: spot.title,
            animation: google.maps.Animation.DROP
        });
        spot.marker = marker;

        //2. When activated -> listener will take action to bounce
        marker.addListener('click', function() {
            self.genWindow(marker, infoWindow, spot);
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                spot.marker.setAnimation(null);
            }, 900);
        });
    });

		//Activate marker after clicking item from the 'qusoorSpots' list
		self.spotInformation = function(spot) {
			marker = spot.marker;
			self.genWindow(marker, infoWindow, spot);
			marker.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function() {
				marker.setAnimation(null);
			}, 900);
		};


    //Generate infoWindow that displays the spot Title, and related Wikipedia article
    self.genWindow = function(marker, infowindow, spot) {
        infowindow.marker = marker;
        infowindow.setContent('<div><h3 class="spotName">' + marker.title + '</h3></div><div><b><h5 class="spotLink"> Visit wikipedia page about:  <a target="_blank" href="' +
            spot.url + '">' + spot.wikipediaPageName + '</a></h5></b></div>');
        infowindow.open(map, marker);
    };


    //Filtering the list based on user input
    self.search = ko.computed(function() {
        //Set userInput to lower case
        var spotFilter = self.userInput().toLowerCase();
        return ko.utils.arrayFilter(self.spots(), function(spot) {
            //If spot title matches any index of userInput, show it
            if (spot.title.toLowerCase().indexOf(spotFilter) !== -1) {
                spot.marker.setVisible(true);
                return true;
            }
            //If not, hide
            else {
                spot.marker.setVisible(false);
                return false;
            }
        });
    });
};

/////Activate Burger Menu///////
//Display and/or hide list when menu icon is clicked
//I understood it from https://learn.jquery.com/using-jquery-core/document-ready/
//Then I wrote my own
$(document).ready(function() {
    $('.menuIcon').on('click', function() {
        $('.sideMenu').toggleClass('sideMenu-display');
    });
});
