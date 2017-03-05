/**
 * Created by yiding on 2017/1/1.
 */

var navbar = new Vue({
    el: '#mapView',
    delimiters: ['{{', '}}'],
    data: {
        my_map: undefined, //the map
        locations: [{'city': 'tempe', 'focus_location': [33.4230242165, -111.940247586]},
            {'city': 'las_vegas', 'focus_location': [36.2162287, -115.2446964]}],
        selected_venues: null, //selected venues
        area_coordinate: {
            'start': {'lat': '#', 'lng': '#'},
            'end': {'lat': '#', 'lng': '#'}
        }, //init it as non-number
        area_selection_mode: false,
        focus_location: [33.4230242165, -111.940247586],
        counter_of_mouse_event_adding: 0,
        current_city: 'tempe',
        current_type: 'all',
    },
    methods: {
        drawInitMap: function () {
            var init_zoom_level = 15;
            this.my_map = L.map('mapViewRealMap');
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw',
                {
                    maxZoom: 22,
                    id: 'mapbox.streets'
                }).addTo(this.my_map);
            this.my_map.setView([33.4230242165, -111.940247586], init_zoom_level);

        },
        drawGraph: function (locs, focus) {
            var init_zoom_level = 15, radius = 1.5;
            var _this = this;
            this.my_map.setView(focus, init_zoom_level);

            var svg_handler = d3.select('#mapViewRealMap').select('svg');
            if (svg_handler[0][0] != null) {
                svg_handler.remove();
            }
            var svgLayer = L.svg();
            svgLayer.addTo(this.my_map);

            //check the area_selection_mode, and do corresponding mode-setting
            if (_this.area_selection_mode == true) {
                d3.select('#mapViewRealMap').select('svg').classed('areaSelectionPointer', true);
            }
            else {
                d3.select('#mapViewRealMap').select('svg').classed('areaSelectionPointer', false);
            }

            //draw all the circles
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

            this.my_map.on('zoom', update);
            update();

            function update() {
                console.log('zoom: ', _this.my_map.getZoom(), _this.my_map.getSize(2));

                //handle all the initial circles
                circles.attr('transform', function (d) {
                    var latlng = new L.LatLng(d['latitude'], d['longitude']);
                    return "translate(" + _this.my_map.latLngToLayerPoint(latlng).x + ',' + _this.my_map.latLngToLayerPoint(latlng).y + ')';
                });
                var zoom_scale = Math.pow(2, init_zoom_level - _this.my_map.getZoom());
                circles.attr('r', radius / zoom_scale);

                //handle the glyphs and their links


                //handle the area selection rectangle
                var brush_rect = d3.select('#brush_rect_id');
                if (brush_rect[0][0] != null) {
                    console.log('update brush_rect: ', _this.area_coordinate, brush_rect);
                    var x = _this.my_map.latLngToLayerPoint(_this.area_coordinate.start).x;
                    var y = _this.my_map.latLngToLayerPoint(_this.area_coordinate.start).y;
                    var width = _this.my_map.latLngToLayerPoint(_this.area_coordinate.end).x - _this.my_map.latLngToLayerPoint(_this.area_coordinate.start).x;
                    var height = _this.my_map.latLngToLayerPoint(_this.area_coordinate.end).y - _this.my_map.latLngToLayerPoint(_this.area_coordinate.start).y;

                    d3.select('rect#brush_rect_id')
                        .attr('x', x)
                        .attr('y', y)
                        .attr('width', width)
                        .attr('height', height);
                }
            }
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
        },
        removeBrushRect: function () {
            var svg = d3.select('#mapViewRealMap').select('svg');
            var brush_rect = svg.select('#brush_rect_id');
            if (brush_rect[0][0] != null) {
                brush_rect.remove();
            }
        },
        clearAreaCoordinate: function () {
            this.area_coordinate = {
                'start': {'lat': '#', 'lng': '#'},
                'end': {'lat': '#', 'lng': '#'}
            };
        },
    },

    created: function () {
        console.log('Map view is created!');
        this.selected_venues = new Set();
    },

    mounted: function () {
        var _this = this;
        console.log('Map view is mounted!');

        this.drawInitMap();//draw the initial map
        pipService.onCityOrTypeIsChanged(function (msg) {
            _this.current_city = msg.city, _this.current_type = msg.type, _this.focus_location = msg.focus;
            dataService.getVenueInfoOfOneCityAndType(_this.current_city, _this.current_type);
        });

        // dataService.getVenueInfoOfOneCityAndType(_this.locations[0].city);
        pipService.onBusinessDataIsReady(function (msg) {
            // _this.drawGraph(dataService.business_of_one_city_type, _this.locations[0].focus_location);
            _this.drawGraph(dataService.business_of_one_city_type, _this.focus_location);

            //monitor the selection of a region
            if (_this.counter_of_mouse_event_adding < 1) {
                _this.counter_of_mouse_event_adding++;

                var area_selection_flag = false;
                _this.my_map.on('mousedown', function (e) {
                    if (_this.area_selection_mode) {
                        area_selection_flag = true;
                        console.log('map mousedown here: ', e, e.latlng);
                        _this.clearAreaCoordinate();
                        _this.area_coordinate.start = e.latlng;

                        //remove
                        _this.removeBrushRect();
                    }
                });
                _this.my_map.on('mousemove', function (e) {
                    if (_this.area_selection_mode && area_selection_flag) {
                        // console.log('map mouse move: ', e, e.latlng);
                        _this.area_coordinate.end = e.latlng;
                    }
                });
                _this.my_map.on('mouseup', function (e) {
                    if (_this.area_selection_mode && area_selection_flag) {
                        area_selection_flag = false;
                        console.log('map mouse up: ', e, e.latlng);
                        _this.area_coordinate.end = e.latlng;
                    }
                });
            }

            //start drawing the glyphs
            var svg = d3.select('#mapViewRealMap').select('svg').append('g').attr('class', 'linked_glyphs');
            var glyph_items = [
                {'id': 'aaaa', 'price': 2, 'rating': [10, 20, 42, 20, 50], 'avg_rate': 3.5, 'pos': [100, 100]},
                {'id': 'bbbb', 'price': 1, 'rating': [4, 20, 12, 32, 190], 'avg_rate': 4.5, 'pos': [540, 340]},
                {'id': 'cccc', 'price': 3, 'rating': [20, 10, 10, 20, 42], 'avg_rate': 3.0, 'pos': [490, 90]}
            ];
            var link_items = [
                {
                    'start_id': 'aaaa',
                    'end_id': 'bbbb',
                    'start': 0,
                    'end': 1,
                    'weight': 20,
                    'start_pos': [100, 100],
                    'end_pos': [540, 340]
                },
                {
                    'start_id': 'aaaa',
                    'end_id': 'cccc',
                    'start': 0,
                    'end': 2,
                    'weight': 40,
                    'start_pos': [100, 100],
                    'end_pos': [490, 90]
                },
                {
                    'start_id': 'bbbb',
                    'end_id': 'cccc',
                    'start': 1,
                    'end': 2,
                    'weight': 10,
                    'start_pos': [540, 340],
                    'end_pos': [490, 90]
                }
            ];
            _this.drawLinkedGlyphs(_this.my_map, svg, glyph_items, link_items);
        });
        pipService.onStartAreaSelection(function (msg) {
            _this.area_selection_mode = msg;
            var svg = d3.select('#mapViewRealMap').select('svg');

            if (_this.area_selection_mode == true) {
                _this.my_map.dragging.disable();
                svg.classed('areaSelectionPointer', true);
            }
            else {
                _this.my_map.dragging.enable();
                svg.classed('areaSelectionPointer', false);
            }

        });
        pipService.onSubmitSelectionArea(function (msg) {
            //query data for a region
            if (_this.area_coordinate.start.lat == _this.area_coordinate.end.lat &&
                _this.area_coordinate.start.lng == _this.area_coordinate.end.lng) {
                alert('You have not brush a region on map!');
                return;
            }

            dataService.getBusinessAndLinksOfSelectedRegion(_this.current_city, _this.current_type,
                _this.area_coordinate.start, _this.area_coordinate.end);
        });
        pipService.onClearSelectionArea(function (msg) {
            //clear selected area
            _this.clearAreaCoordinate();
            _this.removeBrushRect();
        });
        pipService.onBusinessAndLinksOfSelectedRegionIsReady(function (msg) {
            console.log('Result of loading the data of specific region and type: ', msg);


        });

        //init the whole map as tempe
        var msg = {'city': _this.current_city, 'type': _this.current_type, 'focus': _this.focus_location};
        pipService.emitCityOrTypeIsChanged(msg);
    },

    watch: {
        area_coordinate: {
            handler: function (new_value, old_value) {
                var svg = d3.select('#mapViewRealMap').select('svg');
                if (new_value.start.lat != '#' && new_value.start.lng != '#' && new_value.end.lat != '#' && new_value.end.lng != '#') {
                    var brush_rect = svg.select('#brush_rect_id');
                    var x = this.my_map.latLngToLayerPoint(new_value.start).x;
                    var y = this.my_map.latLngToLayerPoint(new_value.start).y;
                    var width = this.my_map.latLngToLayerPoint(new_value.end).x - this.my_map.latLngToLayerPoint(new_value.start).x;
                    var height = this.my_map.latLngToLayerPoint(new_value.end).y - this.my_map.latLngToLayerPoint(new_value.start).y;

                    if (brush_rect[0][0] == null) {
                        svg.append('rect')
                            .attr('id', 'brush_rect_id')
                            .attr('x', x)
                            .attr('y', y)
                            .attr('width', width)
                            .attr('height', height)
                            .style('fill', 'none')
                            .style('stroke', 'red')
                            .style('stroke-width', '2px');
                    }
                    else {
                        svg.select('rect#brush_rect_id')
                            .attr('width', width)
                            .attr('height', height);
                    }
                }

            },
            deep: true
        }
    }
});
