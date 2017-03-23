/**
 * Created by wangyong on 21/3/2017.
 */

var augmentedWordCloudView = new Vue({
    el: '#wordCloudView',
    delimiters: ["{{", "}}"],
    data: {
        svg_h: 600,
    },
    methods: {

    },
    created: function () {
        
    },
    mounted: function () {
        // var width = d3.select(this.$el).node().parentNode.getBoundingClientRect()['width'];

        
        // var width = 405;
        //
        // d3.select(this.$el).append('svg')
        //     .attr('width', width)
        //     .attr('height', this.svg_h);

        pipService.onUpdateWordCloudViewData(function (review_id_list) {
            console.log('new review ids:', review_id_list);



        });

    }
});
