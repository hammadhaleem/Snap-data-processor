/**
 * Created by wangyong on 12/3/2017.
 */

var temporalView = new Vue({
    el: '#temporalView',
    delimiters: ['{{', '}}'],
    data: {},
    methods: {
        init: function () {
            var width = 770, height = 600;
            var svg = d3.select(this.$el)
                .append('svg')
                .attr('width', width)
                .attr('height', height);
        },
        

    },
    created: function () {
        console.log('Temporal View is Created!');


    },
    mounted: function () {
        console.log('Temporal View is mounted!');
        this.init();


    }


});
