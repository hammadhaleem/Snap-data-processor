/**
 * Created by wangyong on 8/3/2017.
 */

var commonCustomerView = new Vue({
    el: '#commonCustomerComparisonView',
    delimiters: ['{{', '}}'],
    data: {
        view_svg_handler: undefined,
        selected_venue_info: [],
        common_customer_rating_reviews: []
    },
    methods: {
        initDrawing: function () {
            this.view_svg_handler = d3.select('#commonCustomerComparisonView')
                .select('section')
                .append('svg')
                .attr('width', '770px')
                .attr('height', '450px');
        },

    },
    created: function () {

    },
    mounted: function () {
        this.initDrawing();

        var _this = this;
        pipService.onVenueSelectionIsReady(function (selected_glyphs) {
            console.log('selected glyph list: ', selected_glyphs);
            var bs_id1 = selected_glyphs[0]['business_id'], bs_id2 = selected_glyphs[1]['business_id'];
            var data_getter_handler = dataService.getCommonCustomerInfoOfTwoVenues(bs_id1, bs_id2);
            data_getter_handler.then(function (resp) {
                console.log('Common Customer Info: ', resp);
                var links_list = resp.links;
                var nodes_list = resp.nodes;

                _this.common_customer_rating_reviews = nodes_list;

            }, function (error) {
                console.log('Error in getting common customer information!', error);
            });
        });
    },
    watch: {},
});