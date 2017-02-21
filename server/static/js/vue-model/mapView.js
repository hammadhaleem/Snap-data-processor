/**
 * Created by yiding on 2017/1/1.
 */

var navbar = new Vue({
    el: '#mapView',
    delimiters: ['{{', '}}'],
    data: {
        locations: [[51.508, -0.119], [51.503, -0.13], [51.506, -0.11]],
    },
    methods: {
        drawGraph: function (locs) {
            var mymap = L.map('mapViewRealMap').setView([51.505, -0.09], 13);
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
                maxZoom: 20,
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                'Imagery © <a href="http://mapbox.com">Mapbox</a>',
                id: 'mapbox.streets'
            }).addTo(mymap);

            // mymap.on('click', function (e,d) {
            //     console.log('the map is fired!!! ', e, d);
            // });
            // mymap.fireEvent('click');

            var radius = 20;
            var svgLayer = L.svg();
            svgLayer.addTo(mymap);
            var svg_group = d3.select('#mapViewRealMap').select('svg').select('g');
            var circle_handler = svg_group.selectAll('circle').data(locs);
            var circles = circle_handler.enter()
                .append('circle')
                .attr('r', radius)
                .attr('opacity', 0.8)
                .attr('fill', '#f03')
                .on('click', function (d, i) {
                    console.log('circle is clicked!', d, i);
                    
                    
                });

            mymap.on('zoom', update);
            update();

            function update() {
                console.log('zoom: ', mymap.getZoom(), mymap.getSize(2));
                circles.attr('transform', function (d) {
                    var latlng = new L.LatLng(d[0], d[1]);
                    return "translate(" + mymap.latLngToLayerPoint(latlng).x + ',' + mymap.latLngToLayerPoint(latlng).y + ')';
                });

                var zoom_scale = Math.pow(2, 13 - mymap.getZoom() );
                circles.attr('r', radius / zoom_scale);
            }
            
        },
    },

    created: function () {
        console.log('Map view is created!');

    },

    mounted: function () {
        console.log('Map view is mounted!');
        this.drawGraph(this.locations);
    }
});
