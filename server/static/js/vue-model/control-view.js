/**
 * Created by yiding on 2016/12/30.
 */

var controlModel = new Vue({
    el: '#control-view',
    delimiters: ["{{", "}}"],
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
        area_selection: false,
        area_selection_flag: false, //since some posts say that event response and value change may not happen simultaneously
        area_selection_button_mode: false, //false: you can brush a region to select now; true: you can re-load all the red circles now
        area_selection_button_text: 'Submit Selection', // or 'Reload Dataset'
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
            else{
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
        }
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
    },
    created: function () {
        var _this = this;
        console.log('!!!!!!!emitChangeForceLayoutConfig -----');
        pipService.emitChangeForceLayoutConfig(this.features);
    },
    mounted: function () {
        ;
    }
});
