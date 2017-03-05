/**
 * Created by yiding on 2017/1/1.
 */
var dataService = new Vue({
    data: {
        graphData: null,
        business_of_one_city_type: null
    },
    methods: {
        getGraphDataFromBackend: function () {
            this.$http.get('/getGraph', []).then(function (response) {
                this.graphData = JSON.parse(response.data);
                pipService.emitGraphDataReady()
            }, function (response) {
                console.log('error raised');
            });
        },
        getGraphData: function () {
            if (this.graphData != null) {
                return this.graphData;
            } else {
                return null;
            }
        },
        getVenueInfoOfOneCityAndType: function (city, type) {
            var url = '/api/get_business_information_city/' + city;
            if(type != 'all'){
                url = '/api/get_business_information_city_type/' + city + '/' + type;
            }

            this.$http.get(url).then(function (response) {
                this.business_of_one_city_type = response.data;
                pipService.emitBusinessDataIsReady(this.business_of_one_city_type);
            }, function (error) {
                console.log('error exist: ', error);
            });
        },
        getSocialNetworkOfTwoBusiness: function (business1, business2) {
            var url = '/api/get_social_graph_of_two_business/' + business1 + '/' + business2;
            // var url = '/api/get_social_graph_common/' + business1 + '/' + business2;
            this.$http.get(url).then(function (resp) {
                console.log('Two business: ', resp.data);
                pipService.emitSocialNetworkOfBusinessVenueIsReady(resp.data);
            }, function (error) {
                console.log('Error in getSocialNetworkOfTwoBusiness', error);
            });

        },
        getBusinessAndLinksOfSelectedRegion: function (city, type, p_start, p_end) {
            var url = '/api/get_business_graph_box/' + city + '/' + type + '/' + p_start.lng + '/' + p_start.lat + '/'
                + p_end.lng + '/' + p_end.lat;
            if(type == 'all'){ //待修改,等待Hammd的API
                url = '/api/get_business_graph_box/' + city + '/' + 'restaurants' + '/' + p_start.lng + '/' + p_start.lat + '/'
                + p_end.lng + '/' + p_end.lat;
            }

            console.log('query url: ', url);
            this.$http.get(url).then(function (resp) {
                console.log('responded data: ', resp.data);
                pipService.emitBusinessAndLinksOfSelectedRegionIsReady(resp.data);
            }, function (error) {
                console.log('Error in loading business of selected region!', error);
            });
        }
    },
    created: function () {
        this.getGraphDataFromBackend();
        // this.getVenueInfoOfOneCity('Tempe');
    },
    watch: {
        graphData: {
            handler: function () {
                console.log('Graph data has been updated');
            },
            deep: true
        }
    }
})