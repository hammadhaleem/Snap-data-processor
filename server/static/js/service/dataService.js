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
            this.$http.post('/getVenueOfOneCity', {'name': city}).then(function(response){
                this.business_of_one_city = JSON.parse(response.data);
                console.log('business result: ', this.business_of_one_city);
            }, function (error) {
                console.log('error exist: ', error);
            });

            // this.$http.get('/api/get_business_information_city/Tempe').then(function (response) {
            //     this.business_of_one_city = JSON.parse(response.data);
            //     console.log('business result: ', this.business_of_one_city);
            // }, function (error) {
            //     console.log('error exist: ', error);
            // });

        }
    },
    created: function () {
        this.getGraphDataFromBackend();
        this.getVenueInfoOfOneCity('Tempe');
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