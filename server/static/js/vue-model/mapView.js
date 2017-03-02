/**
 * Created by yiding on 2017/1/1.
 */

var navbar = new Vue({
    el: '#mapView',
    delimiters: ['{{', '}}'],
    data: {
        locations: [{'city': 'tempe', 'focus_location': [33.4230242165, -111.940247586]},
            {'city': 'las_vegas', 'focus_location': [36.2162287, -115.2446964]}],
        selected_venues: null, //selected venues
    },
    methods: {
        drawGraph: function (locs, focus) {
            var init_zoom_level = 15, radius = 1.5;
            var mymap = L.map('mapViewRealMap').setView(focus, init_zoom_level);
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
                maxZoom: 20,
                id: 'mapbox.streets'
            }).addTo(mymap);

            // mymap.dragging.disable();

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
                    if (d.review_count < 30)
                        return 0.1;
                    else if (d.review_count >= 300)
                        return 1.0;
                    else
                        return d.review_count / 300;
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
            svg_group.selectAll('circle')
                .append('title')
                .text(function (d, i) {
                    return 'Name: ' + d['name'] + '\n' + 'Review Count: ' + d['review_count'] + '\n'
                        + 'Stars: ' + d['stars'] + '\n' + 'Business ID: ' + d['business_id'];
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

            return mymap;
        },
        drawLinkedGlyphs: function (my_map, svg, glyph_items, link_items) {
            var glyph = d3.myGlyph(my_map);
            var interLink = d3.myLink();
            var draw_link = svg.selectAll('xx')
                .data(link_items)
                .enter()
                .append('g')
                .attr('class', 'interLink')
                .call(interLink);

            var draw_glyph = svg.selectAll('xxx')
                .data(glyph_items)
                .enter()
                .append('g')
                .attr('transform', function (d, i) {
                    return "translate(" + d.pos[0] + ',' + d.pos[1] + ')';
                })
                .call(glyph);
        }

    },

    created: function () {
        console.log('Map view is created!');
        this.selected_venues = new Set();
    },

    mounted: function () {
        var _this = this;
        console.log('Map view is mounted!');
        dataService.getVenueInfoOfOneCity(_this.locations[0].city);
        pipService.onBusinessDataIsReady(function (msg) {
            var my_map = _this.drawGraph(dataService.business_of_one_city, _this.locations[0].focus_location);
            var svg = d3.select('#mapViewRealMap').select('svg').append('g').attr('class', 'linked_glyphs');

            var glyph_items = [
                {'id': 'aaaa', 'price': 2, 'rating': [10, 20, 42, 20, 50], 'avg_rate': 3.5, 'pos': [100, 100]},
                {'id': 'bbbb', 'price': 1, 'rating': [4, 20, 12, 32, 190], 'avg_rate': 4.5, 'pos': [540, 340]},
                {'id': 'cccc', 'price': 3, 'rating': [20, 10, 10, 20, 42], 'avg_rate': 3.0, 'pos': [490, 90]}
            ];
            var link_items = [
                {'start_id': 'aaaa', 'end_id': 'bbbb', 'start': 0, 'end': 1, 'weight': 20, 'start_pos': [100, 100], 'end_pos': [540, 340]},
                {'start_id': 'aaaa', 'end_id': 'cccc', 'start': 0, 'end': 2, 'weight': 40, 'start_pos': [100, 100], 'end_pos': [490, 90]},
                {'start_id': 'bbbb', 'end_id': 'cccc', 'start': 1, 'end': 2, 'weight': 10, 'start_pos': [540, 340], 'end_pos': [490, 90]}
            ];
            _this.drawLinkedGlyphs(my_map, svg, glyph_items, link_items);
        });
    }
});
