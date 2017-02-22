/**
 * Created by yiding on 2016/12/31.
 */
var pipService = new Vue({
    data: {
        GREETING: 'greeting',
        GRAPHREADY: 'graphready',
        CHANGE_FORCE_LAYOUT_CONFIG: 'changeForceLayoutConfig',
        BUSINESS_DATA_OF_ONE_CITY_READY: 'business_data_of_one_city_is_ready'
    },
    methods: {
        emitChangeAttributes: function (msg) {
            this.$emit(this.GREETING, msg);
        },
        onChangeAttributes: function (callback) {
            this.$on(this.GREETING, function (msg) {
                callback(msg);
            });
        },

        emitGraphDataReady: function (msg) {
            this.$emit(this.GRAPHREADY, msg);
        },
        onGraphDataReady: function (callback) {
            this.$on(this.GRAPHREADY, function (msg) {
                callback(msg);
            });
        },

        emitBusinessDataIsReady: function (msg) {
            this.$emit(this.BUSINESS_DATA_OF_ONE_CITY_READY, msg);
        },
        onBusinessDataIsReady: function (callback) {
            this.$on(this.BUSINESS_DATA_OF_ONE_CITY_READY, function (msg) {
                callback(msg);
            });
        },


        emitChangeForceLayoutConfig: function (msg) {
            this.$emit(this.CHANGE_FORCE_LAYOUT_CONFIG, msg);
        },
        onForceLayoutConfigIsReady: function (callback) {
            this.$on(this.CHANGE_FORCE_LAYOUT_CONFIG, function (msg) {
                callback(msg);
            });
        },
    }
})