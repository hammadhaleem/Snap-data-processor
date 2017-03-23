/**
 * Created by wangyong on 23/3/2017.
 */

var detailedReviewContentView = new Vue({
    el: '#detailedReviewContentView',
    delimiters: ["{{", "}}"],
    data: {
        curent_review_content: '',

    },
    methods: {

    },
    created: function () {

    },
    mounted: function () {

        pipService.onLoadDetailedReviewContent(function (one_review_content) {
            console.log('one review content:', one_review_content);
            


        });

    }
});