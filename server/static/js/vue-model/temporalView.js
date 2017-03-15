/**
 * Created by wangyong on 12/3/2017.
 */

var temporalView = new Vue({
    el: '#temporalView',
    delimiters: ['{{', '}}'],
    data: {
        svg_width: 770,
        svg_height: 600,
        two_venue_review_rating: undefined,
        bs1_id: undefined,
        bs2_id: undefined,
        data_processing_mode: ['by_year', 'by_quarter_year'],
        cur_processing_mode: 'by_quarter_year',
        first_venue_color_mapping: ['#edf8e9', '#bae4b3', '#74c476', '#31a354', '#006d2c'],
        second_venue_color_mapping: ['#ffffd4', '#fed98e', '#fe9929', '#d95f0e', '#993404'],
        h_scale: undefined, //scale function for horizontal bars on the right in temporal view

    },
    methods: {
        init: function () {
            // var width = 770, height = 600;
            var svg = d3.select(this.$el)
                .append('svg')
                .attr('width', this.svg_width)
                .attr('height', this.svg_height);
        },
        date2Year: function (date_str) {
            var date = date_str.split('-');
            var year = parseInt(date[0]);
            return year;
        },
        date2Quarter: function (date_str) {
            var date = date_str.split('-');
            var year = parseInt(date[0]);
            var quarter = parseInt((parseInt(date[1]) - 1) / 3) + 1; //[1, 2, 3, 4]
            return [year, quarter];
        },
        date2QuarterIndex: function (cur_date_str, min_date_str) {
            var cur_quarter = this.date2Quarter(cur_date_str),
                min_quarter = this.date2Quarter(min_date_str);

            var idx = 0;
            if (cur_quarter[0] > min_quarter[0]) { //not the same year
                idx = 4 * (cur_quarter[0] - min_quarter[0] - 1) + cur_quarter[1] + (4 - min_quarter[1]);
                return idx;
            }
            else { //the same year
                idx = cur_quarter[1] - min_quarter[1];
            }

            return idx;
        },
        quarterIndex2Quarter: function (idx, min_date_str) { //assume idx starts from 0
            var min_quarter = this.date2Quarter(min_date_str);
            var cur_year = min_quarter[0] + parseInt((min_quarter[1] + idx - 1) / 4), //
                cur_quarter = (min_quarter[1] + idx - 1) % 4 + 1; //[1, 2, 3, 4]
            return [cur_year, cur_quarter];
        },
        getReviewArrayByYear: function (reviews, min_year, max_year) {
            var years = max_year - min_year + 1;
            var review_arr = new Array(years);
            for (var i = 0; i < years; i++) {
                review_arr[i] = [];
            }

            for (var i = 0; i < reviews.length; i++) {
                var cur_review = reviews[i];
                var cur_year = this.date2Year(cur_review['date']);
                var idx = cur_year - min_year;
                review_arr[idx].push(cur_review);
            }

            //sort by rating
            for (var i = 0; i < years; i++) {
                review_arr[i].sort(function (a, b) {
                    if (a.stars < b.stars) {
                        return -1;
                    }
                    else if (a.stars > b.stars) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });
            }

            return review_arr;
        },
        getReviewArrayByQuarterYear: function (reviews, min_date_str, review_quarter_num) {
            var review_arr = new Array(review_quarter_num);
            for (var i = 0; i < review_quarter_num; i++) {
                review_arr[i] = [];
            }

            for (var i = 0; i < reviews.length; i++) {
                var cur_review = reviews[i];
                var idx = this.date2QuarterIndex(cur_review['date'], min_date_str);
                review_arr[idx].push(cur_review);
            }

            //sort by rating
            for (var i = 0; i < review_quarter_num; i++) {
                review_arr[i].sort(function (a, b) {
                    if (a.stars < b.stars) {
                        return -1;
                    }
                    else if (a.stars > b.stars) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });
            }

            return review_arr;
        },
        processDataByQuarterYear: function (two_venue_review_rating) {
            var max_date = two_venue_review_rating['max_date'], min_date = two_venue_review_rating['min_date'];
            var bs1_reviews = two_venue_review_rating['data'][this.bs1_id],
                bs2_reviews = two_venue_review_rating['data'][this.bs2_id];

            var review_quarter_num = this.date2QuarterIndex(max_date, min_date) + 1;
            var bs1_reviews_by_quarter_year = this.getReviewArrayByQuarterYear(bs1_reviews, min_date, review_quarter_num);
            var bs2_reviews_by_quarter_year = this.getReviewArrayByQuarterYear(bs2_reviews, min_date, review_quarter_num);

            console.log('processDataByQuarterYear: ', bs1_reviews_by_quarter_year, bs2_reviews_by_quarter_year);
            return [bs1_reviews_by_quarter_year, bs2_reviews_by_quarter_year];
        },
        processDataByYear: function (two_venue_review_rating) {
            var max_date = two_venue_review_rating['max_date'], min_date = two_venue_review_rating['min_date'];
            var bs1_reviews = two_venue_review_rating['data'][this.bs1_id],
                bs2_reviews = two_venue_review_rating['data'][this.bs2_id];

            var max_year = this.date2Year(max_date), min_year = this.date2Year(min_date);
            var bs1_reviews_by_year = this.getReviewArrayByYear(bs1_reviews, min_year, max_year);
            var bs2_reviews_by_year = this.getReviewArrayByYear(bs2_reviews, min_year, max_year);

            console.log('processDataByYear: ', bs1_reviews_by_year, bs2_reviews_by_year);
            return [bs1_reviews_by_year, bs2_reviews_by_year];
        },
        drawTemporalViewByQuarterYear: function (review_ratings) {
            var _this = this;
            var bs1_review_ratings = review_ratings[0],
                bs2_review_ratings = review_ratings[1];
            var padding_w = 2, padding_h = 2, extra_padding_w = 50, extra_padding_h = 15;// width, height
            var rect_size = 12;

            //fixed size
            var each_axis_label_height = 45, horizontal_bar_chart_width = 150;
            var max_w = bs1_review_ratings.length;
            var bs1_h_arr = bs1_review_ratings.map(function (d, i) {
                    return d.length;
                }),
                bs2_h_arr = bs2_review_ratings.map(function (d, i) {
                    return d.length;
                });
            var bs1_max_h = Math.max(...bs1_h_arr
            ),
            bs2_max_h = Math.max(...bs2_h_arr
            )
            ; //max height


            //determine tentative size
            var h_tentative = 2 * each_axis_label_height + 2 * extra_padding_h + (bs1_max_h + bs2_max_h) * (rect_size + padding_h),
                w_tentative = horizontal_bar_chart_width + extra_padding_w + max_w * (rect_size + padding_w);

            //remove previous svg and append a new one
            d3.select(this.$el).select('svg').remove();
            d3.select(this.$el).select('section')
                .style('overflow', 'auto')
                .append('svg')
                .attr('width', w_tentative)
                .attr('height', h_tentative);

            //append view groups
            var bs1_temporal_view = d3.select(this.$el)
                .select('svg')
                .append('g')
                .attr('class', 'bs1_temporal_view')
                .attr('transform', function () {
                    return 'translate(0,' + (extra_padding_h + bs1_max_h * (rect_size + padding_h) + each_axis_label_height) + ')';
                });
            var bs2_temporal_view = d3.select(this.$el)
                .select('svg')
                .append('g')
                .attr('class', 'bs2_temporal_view')
                .attr('transform', function () {
                    return 'translate(0,' + h_tentative + ')';
                });

            //append axis and labels for bs1
            var tick_arr = new Array(max_w);
            var bs1_axis_g = bs1_temporal_view.append('g')
                .attr('class', 'bs1_x_axis')
                .attr('transform', function () {
                    return 'translate(0' + ',' + (-each_axis_label_height * 0.75) + ')';
                });
            bs1_axis_g.append('line')
                .attr('x1', rect_size)
                .attr('y1', 0)
                .attr('x2', (padding_w + rect_size) * max_w)
                .attr('y2', 0)
                .attr('stroke', 'black')
                .attr('stroke-width', 1);
            bs1_axis_g.append('g')
                .attr('class', 'bs1_ticks')
                .selectAll('line')
                .data(tick_arr)
                .enter()
                .append('line')
                .attr('x1', function (d, i) {
                    return rect_size + i * (padding_w + rect_size);
                })
                .attr('y1', -9)
                .attr('x2', function (d, i) {
                    return rect_size + i * (padding_w + rect_size);
                })
                .attr('y2', 0)
                .attr('stroke', 'black')
                .attr('stroke-width', 1);
            bs1_axis_g.append('g')
                .attr('class', 'bs1_axis_label')
                .selectAll('g')
                .data(tick_arr)
                .enter()
                .append('g')
                .attr('transform', function (d, i) {
                    return 'translate(' + (rect_size + i * (padding_w + rect_size) ) + ',0)';
                    // return rect_size + i * (padding_w + rect_size);
                })
                .append('text')
                .style('text-anchor', 'start')
                .attr("x", 4)
                .attr("y", 4)
                .attr("transform", function (d) {
                    return "rotate(65)";
                })
                .text(function (d, i) {
                    var year_quarter = _this.quarterIndex2Quarter(i, _this.two_venue_review_rating['min_date']);
                    var year_quarter_str = '' + year_quarter[0] + '.' + year_quarter[1];
                    return year_quarter_str;
                })
                .attr('font-family', 'sans-serif')
                .attr('font-size', '8px')
                .attr('fill', 'black');


            //append rectangles for bs1
            bs1_temporal_view.append('g')
                .attr('class', 'bs1_temporal_rects')
                .selectAll('g')
                .data(bs1_review_ratings)
                .enter()
                .append('g')
                .attr('class', function (d, i) {
                    if (d.length == 0) {
                        return 'no_review';
                    }
                    var year_quarter = _this.date2Quarter(d[0]['date']);
                    var str = '' + year_quarter[0] + year_quarter[1];
                    return str;
                })
                .attr('transform', function (d, i) {
                    return 'translate(' + (i * (padding_w + rect_size) + rect_size / 2) + ',' + (-each_axis_label_height) + ')';
                })
                .each(function (d, i) {
                    console.log('draw rectangles: ', d, i);
                    if (d.length == 0) {
                        return;
                    }

                    //draw rectangles
                    d3.select(this).selectAll('rect')
                        .data(d)
                        .enter()
                        .append('rect')
                        .attr('width', rect_size)
                        .attr('height', rect_size)
                        .attr('x', 0)
                        .attr('y', function (item, j) {
                            return -(rect_size + j * (padding_h + rect_size));
                        })
                        .attr('fill', function (item, j) {
                            var rating = item['stars'];
                            return _this.first_venue_color_mapping[rating - 1];
                        });
                });

            //append horizontal bars for bs1 and bs2
            //selection of rectangles
            var bs1_selection_rect = [[0, 0], [0, 0]], bs2_selection_rect = [[0, 0], [0, 0]];
            var bs1_selected_five_rating_arr = undefined, bs2_selected_five_rating_arr = undefined;
            var two_bs_dividing_y = (extra_padding_h + bs1_max_h * (rect_size + padding_h) + each_axis_label_height);
            var selection_start_pos = [0, 0];

            var bs1_selection_handler = undefined, bs2_selection_handler = undefined;
            var bs_drag = d3.behavior.drag()
                .on('dragstart', function (d, i) {
                    console.log('dragstart: ', d3.mouse(this));
                    selection_start_pos = d3.mouse(this);
                    if (selection_start_pos[1] < two_bs_dividing_y) { //bs1
                        bs1_selection_rect = [selection_start_pos, selection_start_pos]; //init
                        bs1_selection_handler = d3.select(_this.$el)
                            .select('section')
                            .select('svg')
                            .append('rect')
                            .attr('class', 'bs1_selection_rect')
                            .attr('x', selection_start_pos[0])
                            .attr('y', selection_start_pos[1])
                            .attr('width', 0)
                            .attr('height', 0)
                            .attr('fill', 'none')
                            .attr('stroke', 'red')
                            .attr('stroke-width', 2);
                    }
                    else { //bs2
                        bs2_selection_rect = [selection_start_pos, selection_start_pos]; //init
                        bs2_selection_handler = d3.select(_this.$el)
                            .select('section')
                            .select('svg')
                            .append('rect')
                            .attr('class', 'bs2_selection_rect')
                            .attr('x', selection_start_pos[0])
                            .attr('y', selection_start_pos[1])
                            .attr('width', 0)
                            .attr('height', 0)
                            .attr('fill', 'none')
                            .attr('stroke', 'red')
                            .attr('stroke-width', 2);
                    }
                })
                .on('drag', function (d, i) {
                    console.log('drag: ', d3.mouse(this));
                    var pos = d3.mouse(this);

                    if (selection_start_pos[1] < two_bs_dividing_y) { //bs1
                        bs1_selection_rect[1] = pos;
                        bs1_selection_handler.attr('width', pos[0] - selection_start_pos[0])
                            .attr('height', pos[1] - selection_start_pos[1]);
                    }
                    else { //bs2
                        bs2_selection_rect[1] = pos;
                        bs2_selection_handler.attr('width', pos[0] - selection_start_pos[0])
                            .attr('height', pos[1] - selection_start_pos[1]);
                    }
                })
                .on('dragend', function (d, i) {
                    console.log('dragend: ', d3.mouse(this));
                    var pos = d3.mouse(this);
                    if (selection_start_pos[1] < two_bs_dividing_y) { //bs1
                        bs1_selection_rect[1] = pos;
                        var remove_flag = (bs1_selection_rect[1][0] == bs1_selection_rect[0][0])
                            && bs1_selection_rect[1][1] == bs1_selection_rect[0][1];
                        if (remove_flag) {
                            d3.select(_this.$el).selectAll('rect.bs1_selection_rect').remove();
                        }
                        updateHorizontalBarCharts();
                    }
                    else { //bs2
                        bs2_selection_rect[1] = pos;
                        var remove_flag = (bs2_selection_rect[1][0] == bs2_selection_rect[0][0])
                            && bs2_selection_rect[1][1] == bs2_selection_rect[0][1];
                        if (remove_flag) {
                            d3.select(_this.$el).selectAll('rect.bs2_selection_rect').remove();
                        }
                        updateHorizontalBarCharts();
                    }
                });
            d3.select(this.$el).select('section')
                .select('svg')
                .call(bs_drag);

            //draw the rectangles
            // var h_scale = undefined; //will store the scale when use this for the first time
            updateHorizontalBarCharts();

            function updateHorizontalBarCharts() {
                bs1_selected_five_rating_arr = getBs1HorizontalBarChartData(bs1_selection_rect, bs1_review_ratings);
                bs2_selected_five_rating_arr = getBs2HorizontalBarChartData(bs2_selection_rect, bs2_review_ratings);
                drawTwoHorizontalBarCharts(bs1_temporal_view, bs2_temporal_view, bs1_selected_five_rating_arr, bs2_selected_five_rating_arr);
            }

            function drawTwoHorizontalBarCharts(_bs1_temporal_view, _bs2_temporal_view,
                                                _bs1_selected_five_rating_arr, _bs2_selected_five_rating_arr) {
                var h_bar_size = 20, h_bar_padding = 10;
                var bs1_horizontal_bar_g = _bs1_temporal_view.select('g.bs1_horizontal_bar_g'),
                    bs2_horizontal_bar_g = _bs2_temporal_view.select('g.bs2_horizontal_bar_g');

                //get the max width of the two horizontal bars and calculate the scale
                var max_bs1_arr = _bs1_selected_five_rating_arr.map(function (item) {
                    return item.length;
                });
                var max_bs2_arr = _bs2_selected_five_rating_arr.map(function (item) {
                    return item.length;
                });
                var max_bs1_h = Math.max(...max_bs1_arr
            ),
                max_bs2_h = Math.max(...max_bs2_arr
            )
                ;
                var max_horizontal = Math.max(max_bs1_h, max_bs2_h);
                // var h_scale = undefined; //will store the scale when use this for the first time
                if (bs1_horizontal_bar_g[0][0] == null || bs2_horizontal_bar_g[0][0] == null) { //use it for the first time
                    _this.h_scale = d3.scale.linear().domain([0, max_horizontal]).range([0, horizontal_bar_chart_width]);
                }

                //create horizontal bars for bs1
                if (bs1_horizontal_bar_g[0][0] == null) {
                    //not created before
                    //determine the initial starting position of y
                    var bs1_horizontal_h_start = 0, bs1_h_bar_padding = h_bar_padding;
                    var bs1_max_horizontal_h = bs1_max_h * (rect_size + padding_h) + extra_padding_h,
                        tentative_bs1_horizontal_h = (h_bar_size + bs1_h_bar_padding) * 4 + h_bar_size;
                    if (bs1_max_horizontal_h >= tentative_bs1_horizontal_h) {
                        bs1_horizontal_h_start = bs1_max_horizontal_h / 2 - tentative_bs1_horizontal_h / 2;
                    }
                    else {
                        bs1_h_bar_padding = (bs1_max_horizontal_h - 5 * h_bar_size) / 4;
                        bs1_h_bar_padding = Math.max(bs1_h_bar_padding, 1); //in case < 0;
                        bs1_horizontal_h_start = 0;
                    }

                    //create the group now
                    bs1_horizontal_bar_g = _bs1_temporal_view.append('g')
                        .attr('class', 'bs1_horizontal_bar_g')
                        .attr('transform', function () {
                            // w_tentative = horizontal_bar_chart_width + extra_padding_w + max_w * (rect_size + padding_w);
                            return 'translate(' + (w_tentative - horizontal_bar_chart_width - extra_padding_w / 4)
                                + ',' + (-each_axis_label_height - bs1_horizontal_h_start) + ')';
                        });
                    //x axis
                    var bs1_xAxis = d3.svg.axis()
                        .orient('bottom')
                        .scale(_this.h_scale)
                        .ticks(3);
                    bs1_horizontal_bar_g.append('g')
                        .attr('class', 'bs1_x_axis')
                        .call(bs1_xAxis);
                    //y axis
                    var bs1_y_axis_length = 4 * (bs1_h_bar_padding + h_bar_size);
                    var bs1_y_label_scale = d3.scale.ordinal().domain(['1', '2', '3', '4', '5']).rangePoints([0, -bs1_y_axis_length]);
                    var bs1_y_axis = d3.svg.axis()
                        .orient('left')
                        .scale(bs1_y_label_scale);
                    bs1_horizontal_bar_g.append('g')
                        .attr('class', 'bs1_y_axis')
                        .attr('transform', function (item, i) {
                            return 'translate(-5,' + (-h_bar_size / 2) + ')';
                        })
                        .call(bs1_y_axis);

                    //rects
                    bs1_horizontal_bar_g.append('g')
                        .attr('class', 'bs1_h_rects')
                        .selectAll('g')
                        .data(max_bs1_arr)
                        .enter()
                        .append('g')
                        .attr('transform', function (item, i) {
                            return 'translate(0,' + (-h_bar_size - i * (h_bar_size + h_bar_padding) ) + ')';
                        })
                        .append('rect')
                        .attr('height', h_bar_size)
                        .attr('width', function (item, i) {
                            return _this.h_scale(item);
                        })
                        .attr('fill', function (item, i) {
                            return _this.first_venue_color_mapping[i];
                        });
                }
                else { //created before
                    var bs1_h_bar_handler = _bs1_temporal_view.select('g.bs1_horizontal_bar_g')
                        .select('g.bs1_h_rects')
                        .selectAll('g')
                        .data(max_bs1_arr, function (item, i) {
                            return ('' + item + i); // make it unique
                        });

                    bs1_h_bar_handler.exit().remove();
                    bs1_h_bar_handler.enter()
                        .append('g')
                        .attr('transform', function (item, i) {
                            return 'translate(0,' + (-h_bar_size - i * (h_bar_size + h_bar_padding) ) + ')';
                        })
                        .append('rect')
                        .attr('height', h_bar_size)
                        .attr('width', function (item, i) {
                            return _this.h_scale(item);
                        })
                        .attr('fill', function (item, i) {
                            return _this.first_venue_color_mapping[i];
                        });
                }

                //create horizontal bars for bs2
                if (bs2_horizontal_bar_g[0][0] == null) {
                    //not created before
                    //determine the initial starting position of y
                    var bs2_horizontal_h_start = 0, bs2_h_bar_padding = h_bar_padding;
                    var bs2_max_horizontal_h = bs2_max_h * (rect_size + padding_h) + extra_padding_h,
                        tentative_bs2_horizontal_h = (h_bar_size + bs2_h_bar_padding) * 4 + h_bar_size;
                    if (bs2_max_horizontal_h >= tentative_bs2_horizontal_h) {
                        bs2_horizontal_h_start = bs2_max_horizontal_h / 2 - tentative_bs2_horizontal_h / 2;
                    }
                    else {
                        bs2_h_bar_padding = (bs2_max_horizontal_h - 5 * h_bar_size) / 4;
                        bs2_h_bar_padding = Math.max(bs2_h_bar_padding, 1); //in case < 0;
                        bs2_horizontal_h_start = 0;
                    }

                    //create the group now
                    bs2_horizontal_bar_g = _bs2_temporal_view.append('g')
                        .attr('class', 'bs2_horizontal_bar_g')
                        .attr('transform', function () {
                            // w_tentative = horizontal_bar_chart_width + extra_padding_w + max_w * (rect_size + padding_w);
                            return 'translate(' + (w_tentative - horizontal_bar_chart_width - extra_padding_w / 4)
                                + ',' + (-each_axis_label_height - bs2_horizontal_h_start) + ')';
                        });
                    //x axis
                    var bs2_xAxis = d3.svg.axis()
                        .orient('bottom')
                        .scale(_this.h_scale)
                        .ticks(3);
                    bs2_horizontal_bar_g.append('g')
                        .attr('class', 'bs2_x_axis')
                        .call(bs2_xAxis);
                    //y axis
                    var bs2_y_axis_length = 4 * (bs2_h_bar_padding + h_bar_size);
                    var bs2_y_label_scale = d3.scale.ordinal().domain(['1', '2', '3', '4', '5']).rangePoints([0, -bs2_y_axis_length]);
                    var bs2_y_axis = d3.svg.axis()
                        .orient('left')
                        .scale(bs2_y_label_scale);
                    bs2_horizontal_bar_g.append('g')
                        .attr('class', 'bs2_y_axis')
                        .attr('transform', function (item, i) {
                            return 'translate(-5,' + (-h_bar_size / 2) + ')';
                        })
                        .call(bs2_y_axis);

                    //rects
                    bs2_horizontal_bar_g.append('g')
                        .attr('class', 'bs2_h_rects')
                        .selectAll('g')
                        .data(max_bs2_arr)
                        .enter()
                        .append('g')
                        .attr('transform', function (item, i) {
                            return 'translate(0,' + (-h_bar_size - i * (h_bar_size + h_bar_padding) ) + ')';
                        })
                        .append('rect')
                        .attr('height', h_bar_size)
                        .attr('width', function (item, i) {
                            return _this.h_scale(item);
                        })
                        .attr('fill', function (item, i) {
                            return _this.second_venue_color_mapping[i];
                        });
                }
                else { //created before
                    var bs2_h_bar_handler = _bs2_temporal_view.select('g.bs2_horizontal_bar_g')
                        .select('g.bs2_h_rects')
                        .selectAll('g')
                        .data(max_bs2_arr, function (item, i) {
                            return ('' + item + i);
                        });

                    bs2_h_bar_handler.exit().remove();
                    bs2_h_bar_handler.enter()
                        .append('g')
                        .attr('transform', function (item, i) {
                            return 'translate(0,' + (-h_bar_size - i * (h_bar_size + h_bar_padding) ) + ')';
                        })
                        .append('rect')
                        .attr('height', h_bar_size)
                        .attr('width', function (item, i) {
                            return _this.h_scale(item);
                        })
                        .attr('fill', function (item, i) {
                            return _this.second_venue_color_mapping[i];
                        });
                }
            }

            function getBs2HorizontalBarChartData(_bs2_select_rect, _bs2_review_ratings) {
                var selected_five_rating_arr = new Array(5);
                for (var i = 0; i < 5; i++) {
                    selected_five_rating_arr[i] = [];
                }

                var start = _bs2_select_rect[0], end = _bs2_select_rect[1];
                if (start[0] == end[0] && start[1] == end[1]) {     //select All
                    for (var i = 0; i < _bs2_review_ratings.length; i++) {
                        var row = _bs2_review_ratings[i];
                        for (var j = 0; j < row.length; j++) {
                            var rating = row[j]['stars'];
                            selected_five_rating_arr[rating - 1].push(row[j]);
                        }
                    }
                }
                else if (start[0] <= end[0] && start[1] <= end[1]) { //select only a specific region
                    for (var i = 0; i < _bs2_review_ratings.length; i++) {
                        var row = _bs2_review_ratings[i];
                        for (var j = 0; j < row.length; j++) {
                            var x = (i * (padding_w + rect_size) + rect_size / 2);
                            var y = h_tentative - each_axis_label_height
                                - (rect_size + j * (padding_h + rect_size));

                            var flag = x >= start[0] && y >= start[1] && x <= end[0] && y <= end[1];
                            if (flag) {
                                var rating = row[j]['stars'];
                                selected_five_rating_arr[rating - 1].push(row[j]);
                            }
                        }
                    }
                }
                else {
                    alert('Selection Area is NOT correct!');
                }

                return selected_five_rating_arr;
            }

            function getBs1HorizontalBarChartData(_bs1_select_rect, _bs1_review_ratings) {
                var selected_five_rating_arr = new Array(5);
                for (var i = 0; i < 5; i++) {
                    selected_five_rating_arr[i] = [];
                }

                var start = _bs1_select_rect[0], end = _bs1_select_rect[1];
                if (start[0] == end[0] && start[1] == end[1]) {     //select All
                    for (var i = 0; i < _bs1_review_ratings.length; i++) {
                        var row = _bs1_review_ratings[i];
                        for (var j = 0; j < row.length; j++) {
                            var rating = row[j]['stars'];
                            selected_five_rating_arr[rating - 1].push(row[j]);
                        }
                    }
                }
                else if (start[0] <= end[0] && start[1] <= end[1]) { //select only a specific region
                    for (var i = 0; i < _bs1_review_ratings.length; i++) {
                        var row = _bs1_review_ratings[i];
                        for (var j = 0; j < row.length; j++) {
                            var x = (i * (padding_w + rect_size) + rect_size / 2);
                            var y = (extra_padding_h + bs1_max_h * (rect_size + padding_h) + each_axis_label_height) + (-each_axis_label_height)
                                - (rect_size + j * (padding_h + rect_size));
                            var flag = x >= start[0] && y >= start[1] && x <= end[0] && y <= end[1];
                            if (flag) {
                                var rating = row[j]['stars'];
                                selected_five_rating_arr[rating - 1].push(row[j]);
                            }
                        }
                    }
                }
                else {
                    alert('Selection Area is NOT correct!');
                }

                return selected_five_rating_arr;
            }


            //append axis and labels for bs2
            var tick_arr = new Array(max_w);
            var bs2_axis_g = bs2_temporal_view.append('g')
                .attr('class', 'bs2_x_axis')
                .attr('transform', function () {
                    return 'translate(0' + ',' + (-each_axis_label_height * 0.75) + ')';
                });
            bs2_axis_g.append('line')
                .attr('x1', rect_size)
                .attr('y1', 0)
                .attr('x2', (padding_w + rect_size) * max_w)
                .attr('y2', 0)
                .attr('stroke', 'black')
                .attr('stroke-width', 1);
            bs2_axis_g.append('g')
                .attr('class', 'bs2_ticks')
                .selectAll('line')
                .data(tick_arr)
                .enter()
                .append('line')
                .attr('x1', function (d, i) {
                    return rect_size + i * (padding_w + rect_size);
                })
                .attr('y1', -9)
                .attr('x2', function (d, i) {
                    return rect_size + i * (padding_w + rect_size);
                })
                .attr('y2', 0)
                .attr('stroke', 'black')
                .attr('stroke-width', 1);
            bs2_axis_g.append('g')
                .attr('class', 'bs2_axis_label')
                .selectAll('g')
                .data(tick_arr)
                .enter()
                .append('g')
                .attr('transform', function (d, i) {
                    return 'translate(' + (rect_size + i * (padding_w + rect_size) ) + ',0)';
                    // return rect_size + i * (padding_w + rect_size);
                })
                .append('text')
                .style('text-anchor', 'start')
                .attr("x", 4)
                .attr("y", 4)
                .attr("transform", function (d) {
                    return "rotate(65)";
                })
                .text(function (d, i) {
                    var year_quarter = _this.quarterIndex2Quarter(i, _this.two_venue_review_rating['min_date']);
                    var year_quarter_str = '' + year_quarter[0] + '.' + year_quarter[1];
                    return year_quarter_str;
                })
                .attr('font-family', 'sans-serif')
                .attr('font-size', '8px')
                .attr('fill', 'black');


            //append rectangles for bs2
            bs2_temporal_view
                .append('g')
                .attr('class', 'bs2_temporal_rects')
                .selectAll('g')
                .data(bs2_review_ratings)
                .enter()
                .append('g')
                .attr('class', function (d, i) {
                    if (d.length == 0) {
                        return 'no_review';
                    }
                    var year_quarter = _this.date2Quarter(d[0]['date']);
                    var str = '' + year_quarter[0] + year_quarter[1];
                    return str;
                })
                .attr('transform', function (d, i) {
                    return 'translate(' + (i * (padding_w + rect_size) + rect_size / 2) + ',' + (-each_axis_label_height) + ')';
                })
                .each(function (d, i) {
                    console.log('draw rectangles: ', d, i);
                    if (d.length == 0) {
                        return;
                    }

                    //draw rectangles
                    d3.select(this).selectAll('rect')
                        .data(d)
                        .enter()
                        .append('rect')
                        .attr('width', rect_size)
                        .attr('height', rect_size)
                        .attr('x', 0)
                        .attr('y', function (item, j) {
                            return -(rect_size + j * (padding_h + rect_size));
                        })
                        .attr('fill', function (item, j) {
                            var rating = item['stars'];
                            return _this.second_venue_color_mapping[rating - 1];
                        });
                });


        },
        drawTemporalViewByYear: function (review_ratings) {
            var _this = this;
            var bs1_review_ratings = review_ratings[0],
                bs2_review_ratings = review_ratings[1];
            var padding_column = 40, padding_row = 2;// width, height
            var rect_size = 4;


            var bs1_temporal_view = d3.select(this.$el)
                .select('svg')
                .append('g')
                .attr('class', 'bs1_temporal_view')
                .attr('transform', function () {
                    return 'translate(0,' + _this.svg_height / 2 + ')';
                });
            var bs2_temporal_view = d3.select(this.$el)
                .select('svg')
                .append('g')
                .attr('class', 'bs2_temporal_view')
                .attr('transform', function () {
                    return 'translate(0,' + _this.svg_height + ')';
                });

            bs1_temporal_view.selectAll('g')
                .data(bs1_review_ratings)
                .enter()
                .append('g')
                .attr('class', function (d, i) {
                    var year = _this.date2Year(_this.two_venue_review_rating['min_date']) + i;
                    return year;
                })
                .attr('transform', function (d, i) {
                    return 'translate(' + (i * padding_column + rect_size / 2) + ',0)';
                })
                .each(function (d, i) {
                    console.log('draw rectangles: ', d, i);
                    //draw rectangles
                    d3.select(this).selectAll('rect')
                        .data(d)
                        .enter()
                        .append('rect')
                        .attr('width', rect_size)
                        .attr('height', rect_size)
                        .attr('x', 0)
                        .attr('y', function (item, j) {
                            return -(rect_size + j * (padding_row + rect_size));
                        })
                        .attr('fill', function (item, j) {
                            var rating = item['stars'];
                            return _this.first_venue_color_mapping[rating - 1];
                        });

                });


        },

    },
    created: function () {
        console.log('Temporal View is Created!');


    },
    mounted: function () {
        console.log('Temporal View is mounted!');
        var _this = this;
        this.init();

        //two venue are selected
        pipService.onVenueSelectionIsReady(function (selected_two_venues) {
            console.log('Selected two venues:', selected_two_venues);
            _this.bs1_id = selected_two_venues[0]['business_id'], _this.bs2_id = selected_two_venues[1]['business_id'];
            dataService.getReviewRatingTemporalInfo(_this.bs1_id, _this.bs2_id)
                .then(function (resp) {
                    console.log('response review ratings: ', resp.data);
                    _this.two_venue_review_rating = resp.data;

                    //draw the view
                    if (_this.two_venue_review_rating != undefined) {
                        if (_this.cur_processing_mode == _this.data_processing_mode[0]) {
                            var review_rating_by_year = _this.processDataByYear(_this.two_venue_review_rating);
                            _this.drawTemporalViewByYear(review_rating_by_year);
                        }
                        else if (_this.cur_processing_mode == _this.data_processing_mode[1]) {
                            var review_rating_by_quarter_year = _this.processDataByQuarterYear(_this.two_venue_review_rating);
                            _this.drawTemporalViewByQuarterYear(review_rating_by_quarter_year);
                        }
                    }

                }, function (error) {
                    console.log('Error in loading the venue info!', error);
                });

        });

    },
    watch: {
        // two_venue_review_rating: {
        //     handler: function (new_value, old_value) {
        //         if (new_value != undefined) {
        //             if (this.cur_processing_mode == this.data_processing_mode[0]) {
        //                 var review_rating_by_year = this.processDataByYear(new_value);
        //                 this.drawTemporalViewByYear(review_rating_by_year);
        //             }
        //             else if (this.cur_processing_mode == this.data_processing_mode[1]) {
        //                 var review_rating_by_quarter_year = this.processDataByQuarterYear(new_value);
        //                 this.drawTemporalViewByQuarterYear(review_rating_by_quarter_year);
        //             }
        //
        //         }
        //     },
        //     deep: false
        // },

    }

});
