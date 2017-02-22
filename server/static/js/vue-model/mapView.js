/**
 * Created by yiding on 2017/1/1.
 */

var navbar = new Vue({
    el: '#mapView',
    delimiters: ['{{', '}}'],
    data: {
        locations: [{'city': 'Tempe', 'focus_location': [33.4215513185, -111.916703354]},
            {'city': 'Las Vegas', 'focus_location': [36.2162287, -115.2446964]}],
        selected_venues: null, //selected venues
    },
    methods: {
        drawGraph: function (locs, focus) {
            var init_zoom_level = 15, radius = 5;
            var mymap = L.map('mapViewRealMap').setView(focus, init_zoom_level);
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
                maxZoom: 20,
                id: 'mapbox.streets'
            }).addTo(mymap);

            var _this = this;
            var svgLayer = L.svg();
            svgLayer.addTo(mymap);
            var svg_group = d3.select('#mapViewRealMap').select('svg').select('g');
            var circle_handler = svg_group.selectAll('circle').data(locs);
            var circles = circle_handler.enter()
                .append('circle')
                .attr('id', function (d, i) {
                    return d['business_id'];
                })
                .attr('r', radius)
                .attr('opacity', function (d, i) {
                    if (d.review_count < 10)
                        return 0.1;
                    else if (d.review_count >= 100)
                        return 1.0;
                    else
                        return d.review_count / 100;
                })
                .attr('fill', '#f03')
                .on('click', function (d, i) {
                    console.log('circle is clicked!', d, d['review_count']);

                    var color = d3.select(this).attr('fill');
                    if (color == '#f03') {
                        if (_this.selected_venues.size < 2) {
                            d3.select(this).attr('fill', 'blue');
                            _this.selected_venues.add(d['business_id']);
                        }
                        if (_this.selected_venues.size == 2) {
                            //get and show the common graph
                            var selected_venues_list = Array.from(_this.selected_venues);
                            dataService.getSocialNetworkOfTwoBusiness(selected_venues_list[0], selected_venues_list[1]);
                            console.log('Two venues are selected: ', selected_venues_list[0], selected_venues_list[1]);
                        }
                    }
                    else {
                        d3.select(this).attr('fill', '#f03');
                        _this.selected_venues.delete(d['business_id']);
                    }
                });

            mymap.on('zoom', update);
            update();

            function update() {
                console.log('zoom: ', mymap.getZoom(), mymap.getSize(2));
                circles.attr('transform', function (d) {
                    var latlng = new L.LatLng(d['latitude'], d['longitude']);
                    return "translate(" + mymap.latLngToLayerPoint(latlng).x + ',' + mymap.latLngToLayerPoint(latlng).y + ')';
                });

                var zoom_scale = Math.pow(2, init_zoom_level - mymap.getZoom());
                circles.attr('r', radius / zoom_scale);
            }

        },
    },

    created: function () {
        console.log('Map view is created!');
        this.selected_venues = new Set();
    },

    mounted: function () {
        var _this = this;
        console.log('Map view is mounted!');
        dataService.getVenueInfoOfOneCity(_this.locations[1].city);
        pipService.onBusinessDataIsReady(function (msg) {
            _this.drawGraph(dataService.business_of_one_city, _this.locations[1].focus_location);
        });
    }
});
