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
        cities: ['All', 'Las Vegas', 'Tempe', 'Phoenix'],
        selected_city: 'Las Vegas',
        types: ['All', 'Restaurant', 'Gas Station', 'Gym', 'Book Store'],
        selected_type: 'Restaurant',
        area_selection: false,
        area_selection_flag: false, //since some posts say that event response and value change may not happen simultaneously
    },
    methods: {
        onAreaSelectionChange: function () {
            console.log('area_selection_flag is changed! ', this.area_selection);
            this.area_selection_flag = !this.area_selection_flag;
            pipService.emitStartAreaSelection(this.area_selection_flag);
        },
        onSubmitSelectionArea: function () {
            console.log('onSubmitSelectionArea!');
            pipService.emitSubmitSelectionArea('submit selection area!');
        },
        onClearSelectionArea: function () {
            console.log('onClearSelectionArea!');
            pipService.emitClearSelectionArea('clear selection area!');
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
    }
});
