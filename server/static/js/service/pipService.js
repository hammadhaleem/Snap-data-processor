/**
 * Created by yiding on 2016/12/31.
 */
var pipService = new Vue({
    data: {
        GREETING: 'greeting',
        GRAPHREADY: 'graphready',
        CHANGE_FORCE_LAYOUT_CONFIG: 'changeForceLayoutConfig',
        BUSINESS_DATA_OF_ONE_CITY_READY: 'business_data_of_one_city_is_ready',
        SOCIAL_NETWORK_OF_BUSINESS_VENUE_IS_READY: 'social_network_of_business_venue_is_ready',
        START_AREA_SELECTION_ON_MAP: 'start_area_selection_on_map',
        SUBMIT_SELECTION_AREA_IS_READY: 'submit_selection_area_is_ready',
        CLEAR_SUBMIT_SELECTION_AREA_IS_READY: 'clear_submit_selection_area_is_ready',
        BUSINESS_AND_LINKS_OF_SELECTED_REGION_IS_READY: 'business_and_links_of_selected_region_is_ready',
        CITY_OR_TYPE_IS_CHANGED: 'city_or_type_is_changed',
        FILTERING_SLIDER_IS_CHANGED: 'filtering_slider_is_changed',
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

        emitSocialNetworkOfBusinessVenueIsReady: function (msg) {
            this.$emit(this.SOCIAL_NETWORK_OF_BUSINESS_VENUE_IS_READY, msg);
        },
        onSocialNetworkOfBusinessVenueIsReady: function (callback) {
            this.$on(this.SOCIAL_NETWORK_OF_BUSINESS_VENUE_IS_READY, function (msg) {
                callback(msg);
            });
        },

        emitStartAreaSelection: function (msg) {
            this.$emit(this.START_AREA_SELECTION_ON_MAP, msg);
        },
        onStartAreaSelection: function (callback) {
            this.$on(this.START_AREA_SELECTION_ON_MAP, function (msg) {
                callback(msg);
            });
        },

        emitSubmitSelectionArea: function (msg) {
            this.$emit(this.SUBMIT_SELECTION_AREA_IS_READY, msg);
        },
        onSubmitSelectionArea: function (callback) {
            this.$on(this.SUBMIT_SELECTION_AREA_IS_READY, function (msg) {
                callback(msg);
            });
        },

        emitClearSelectionArea: function (msg) {
            this.$emit(this.CLEAR_SUBMIT_SELECTION_AREA_IS_READY, msg);
        },
        onClearSelectionArea: function (callback) {
            this.$on(this.CLEAR_SUBMIT_SELECTION_AREA_IS_READY, function (msg) {
                callback(msg);
            });
        },

        emitBusinessAndLinksOfSelectedRegionIsReady: function (msg) {
            this.$emit(this.BUSINESS_AND_LINKS_OF_SELECTED_REGION_IS_READY, msg);
        },
        onBusinessAndLinksOfSelectedRegionIsReady: function (callback) {
            this.$on(this.BUSINESS_AND_LINKS_OF_SELECTED_REGION_IS_READY, function (msg) {
                callback(msg);
            });
        },

        emitCityOrTypeIsChanged: function (msg) {
            this.$emit(this.CITY_OR_TYPE_IS_CHANGED, msg);
        },
        onCityOrTypeIsChanged: function (callback) {
            this.$on(this.CITY_OR_TYPE_IS_CHANGED, function (msg) {
                callback(msg);
            });
        },

        emitFilteringSliderIsChanged: function (msg) {
            this.$emit(this.FILTERING_SLIDER_IS_CHANGED, msg);
        },
        onFilteringSliderIsChanged: function (callback) {
            this.$on(this.FILTERING_SLIDER_IS_CHANGED, function (msg) {
                callback(msg);
            });
        },

    }
})