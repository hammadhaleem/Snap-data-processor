/**
 * Created by yiding on 2016/12/30.
 */

var controlModel = new Vue({
    el: '#control-view',
    data: {
        features: [
            {name: "LinkDistance", 'type': 'range', 'value': 50, 'min': 1, 'max': 500, 'step': 1},
            {name: "Charge", 'type': 'range', 'value': 36, 'min': 1, 'max': 800, 'step': 1},
            {name: "Gravity", 'type': 'range', 'value': 0.12, 'min': 0, 'max': 1, 'step': 0.001}
        ]
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

        test(){
            console.log('changed');
        }
    },
    created: function () {
        var _this = this;
        console.log('!!!!!!!emitChangeForceLayoutConfig -----');
        pipService.emitChangeForceLayoutConfig(this.features);
    }
});
