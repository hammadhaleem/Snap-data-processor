/**
 * Created by yiding on 2016/12/30.
 */

// import vueSlider from '../lib/vuejs-slider.min.js'

var controlModel = new Vue({
    el: '#control-view',
    delimiters: ["{{", "}}"],
    // components: {
    //     vueSlider
    // },
    data: {
        features: [
            {name: "LinkDistance", 'type': 'range', 'value': 50, 'min': 1, 'max': 500, 'step': 1},
            {name: "Charge", 'type': 'range', 'value': 36, 'min': 1, 'max': 800, 'step': 1},
            {name: "Gravity", 'type': 'range', 'value': 0.12, 'min': 0, 'max': 1, 'step': 0.001}
        ],
        cities: ['Tempe', 'Las Vegas', 'Phoenix', 'Toronto'],
        city_selection_focus: {'Tempe': [33.4230242165, -111.940247586], 'Las Vegas': [36.2162287, -115.2446964]},
        selected_city: 'Tempe',
        types: ['All', 'Restaurants', 'Shopping', 'Transportation', 'Entertainment', 'Hotel', 'Health', 'Services',
            'Education', 'Pets', 'Media', 'Religious', 'Parks', 'Null'],
        selected_type: 'All',
        layout_options: ['Stacked', 'Layered'],
        selected_temporal_layout: 'Stacked',

        area_selection: false,
        area_selection_flag: false, //since some posts say that event response and value change may not happen simultaneously
        area_selection_button_mode: false, //false: you can brush a region to select now; true: you can re-load all the red circles now
        area_selection_button_text: 'Submit Selection', // or 'Reload Dataset'

        //sliders
        price_slider: {'max': 5, 'min': 1, 'cur_min': 1, 'cur_max': 5},
        customer_slider: {'max': 9999, 'min': 1, 'cur_min': 1, 'cur_max': 9999},
        rating_slider: {'max': 5, 'min': 1, 'cur_min': 1, 'cur_max': 5},
        link_slider: {'max': 9999, 'min': 1, 'cur_min': 1, 'cur_max': 9999},

    },
    methods: {
        onAreaSelectionChange: function () {
            console.log('area_selection_flag is changed! ', this.area_selection);
            this.area_selection_flag = !this.area_selection_flag;
            pipService.emitStartAreaSelection(this.area_selection_flag);
        },
        onSubmitSelectionArea: function () {
            console.log('onSubmitSelectionArea!');
            this.area_selection_button_mode = !this.area_selection_button_mode;
            if (this.area_selection_button_mode) {
                this.area_selection_button_text = 'Reload Dataset';
                pipService.emitSubmitSelectionArea('submit selection area!');
            }
            else {
                this.area_selection_button_text = 'Submit Selection';
                this.onCityOrTypeChanged();
            }
        },
        onClearSelectionArea: function () {
            console.log('onClearSelectionArea!');
            pipService.emitClearSelectionArea('clear selection area!');
        },
        formatCityAndTypeAndFocus: function () {
            console.log('formatCityAndTypeAndFocus!');
            var city = this.selected_city;
            var focus = this.city_selection_focus[city];
            var type = this.selected_type.charAt(0).toLowerCase() + this.selected_type.substr(1);

            city = city.split(' ');
            for (var i = 0; i < city.length; i++) {
                city[i] = city[i].charAt(0).toLowerCase() + city[i].substr(1);
            }
            var city_str = city.join('_');

            return {'city': city_str, 'type': type, 'focus': focus};
        },
        onCityOrTypeChanged: function () {
            console.log('city or type is changed!');
            var query_params = this.formatCityAndTypeAndFocus();
            console.log('query_params: ', query_params);

            pipService.emitCityOrTypeIsChanged(query_params);
        },
        onConfirmSliderFiltering: function () {
            console.log('confirm filtering!');
            var slider = [this.price_slider, this.customer_slider, this.rating_slider, this.link_slider];
            pipService.emitConfirmFilteringResult(slider);
        },
        onLayoutChanged: function () {
            var layout = this.selected_temporal_layout;
            pipService.emitTemporalViewLayoutIsChanged(layout);
        },
    },
    watch: {
        features: {
            handler: function (newValues, oldValues) {
                let changedValues = [];
                for (var i = 0, ilen = newValues.length; i < ilen; i++) {
                    if (newValues[i]['value'] != oldValues[i]['value']) {
                        changedValues[i] = {'name': newValues[i]['name'], 'value': newValues[i]['value']};
                    } else {
                        changedValues[i] = {'name': oldValues[i]['name'], 'value': oldValues[i]['value']};
                    }
                }

                console.log('Features are changed! Begin to emit change attributes!');
                pipService.emitChangeAttributes(changedValues);
                console.log('control view: features are changed! ', this.features);
            },
            deep: true
        },
        'price_slider.cur_max': {
            handler: function (new_value, old_value) {
                console.log('price_slider["cur_max"]: ', new_value);
                var slider = [this.price_slider, this.customer_slider, this.rating_slider, this.link_slider];
                pipService.emitFilteringSliderIsChanged(slider);
            },
            deep: true
        },
        'customer_slider.cur_min': {
            handler: function (new_value, old_value) {
                console.log('customer_slider["cur_min"]: ', new_value);
                var slider = [this.price_slider, this.customer_slider, this.rating_slider, this.link_slider];
                pipService.emitFilteringSliderIsChanged(slider);
            },
            deep: true
        },
        'rating_slider.cur_min': {
            handler: function (new_value, old_value) {
                console.log('rating_slider["cur_min"]: ', new_value);
                var slider = [this.price_slider, this.customer_slider, this.rating_slider, this.link_slider];
                pipService.emitFilteringSliderIsChanged(slider);
            },
            deep: true
        },
        'link_slider.cur_min': {
            handler: function (new_value, old_value) {
                console.log('link_slider["cur_min"]: ', new_value);
                var slider = [this.price_slider, this.customer_slider, this.rating_slider, this.link_slider];
                pipService.emitFilteringSliderIsChanged(slider);
            },
            deep: true
        },
    },
    created: function () {
        var _this = this;
        console.log('!!!!!!!emitChangeForceLayoutConfig -----');
        pipService.emitChangeForceLayoutConfig(this.features);
    },
    mounted: function () {
        var _this = this;
        //for sliders
        pipService.onBusinessDataIsReady(function (msg) {
            var customers = dataService.business_of_one_city_type.map(function (item) {
                return item['review_count'];
            });
            var ratings = dataService.business_of_one_city_type.map(function (item) {
                return item['stars'];
            });
            var price = dataService.business_of_one_city_type.map(function (item) { //待修改
                if (item['price_range'] == null || isNaN(item['price_range']) == true) { //not number
                    return 1;
                }
                else { //number
                    return item['price_range'];
                }
            });

            _this.customer_slider.max = Math.max.apply(null, customers);
            _this.customer_slider.min = Math.min.apply(null, customers);
            _this.customer_slider.cur_max = _this.customer_slider.max;
            _this.customer_slider.cur_min = _this.customer_slider.min;

            _this.rating_slider.max = Math.max.apply(null, ratings);
            _this.rating_slider.min = Math.min.apply(null, ratings);
            _this.rating_slider.cur_max = _this.rating_slider.max;
            _this.rating_slider.cur_min = _this.rating_slider.min;

            _this.price_slider.max = Math.max.apply(null, price); //待修改
            _this.price_slider.min = Math.min.apply(null, price);
            _this.price_slider.cur_max = _this.price_slider.max;
            _this.price_slider.cur_min = _this.price_slider.min;

            console.log('=================this.customer_slider, this.rating_slider: =========== ', _this.customer_slider, _this.rating_slider);
        });

        pipService.onBusinessAndLinksOfSelectedRegionIsReady(function (msg) {
            var links = msg.links.map(function (item) {
                if (item['weight'] == null || isNaN(item['weight']) == true) { //not number
                    return 0;
                }
                else { //number
                    return item['weight'];
                }
            });
            var customers = msg.nodes.map(function (item) {
                return item['review_count'];
            });
            var ratings = msg.nodes.map(function (item) {
                return item['stars'];
            });
            var price = msg.nodes.map(function (item) {
                if (item['price_range'] == null || isNaN(item['price_range']) == true) { //not number
                    return 1;
                }
                else { //number
                    return item['price_range'];
                }
            });

            _this.link_slider.max = Math.max.apply(null, links);
            _this.link_slider.min = Math.min.apply(null, links);
            _this.link_slider.cur_max = _this.link_slider.max;
            _this.link_slider.cur_min = _this.link_slider.min;

            _this.customer_slider.max = Math.max.apply(null, customers);
            _this.customer_slider.min = Math.min.apply(null, customers);
            _this.customer_slider.cur_max = _this.customer_slider.max;
            _this.customer_slider.cur_min = _this.customer_slider.min;

            _this.rating_slider.max = Math.max.apply(null, ratings);
            _this.rating_slider.min = Math.min.apply(null, ratings);
            _this.rating_slider.cur_max = _this.rating_slider.max;
            _this.rating_slider.cur_min = _this.rating_slider.min;

            _this.price_slider.max = Math.max.apply(null, price);
            _this.price_slider.min = Math.min.apply(null, price);
            _this.price_slider.cur_max = _this.price_slider.max;
            _this.price_slider.cur_min = _this.price_slider.min;

            console.log('Data of selected region is ready; Finish Update slider value! ======', _this.price_slider.max, _this.customer_slider.min,
                _this.rating_slider.min, _this.link_slider.min);
            console.log('price:===== ', price);
            console.log('corresponding nodes: ', msg.nodes);

        });
    }
});
