/**
 * Created by yiding on 2017/1/1.
 */
var dataService = new Vue({
    data: {
        graphData: null,
        business_of_one_city: null
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
        getVenueInfoOfOneCity: function (city) {
            var url = '/api/get_business_information_city/' + city;
            this.$http.get(url).then(function (response) {
                this.business_of_one_city = response.data;
                pipService.emitBusinessDataIsReady(this.business_of_one_city);
            }, function (error) {
                console.log('error exist: ', error);
            });
        },
        getSocialNetworkOfTwoBusiness: function (business1, business2) {
            // var url = '/api/get_social_graph_of_two_business/' + business1 + '/' + business2;
            var url = '/api/get_social_graph_common/' + business1 + '/' + business2;
            this.$http.get(url).then(function (resp) {
                console.log('Two business: ', resp.data);
                pipService.emitSocialNetworkOfBusinessVenueIsReady(resp.data);
            }, function (error) {
                console.log('Error in getSocialNetworkOfTwoBusiness', error);
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