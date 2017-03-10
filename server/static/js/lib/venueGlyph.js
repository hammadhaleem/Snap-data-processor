/**
 * Created by wangyong on 2/3/2017.
 */

d3.myLink = function (outer_leaflet_map) {
    var init_zoom_level = 15;
    var zoom_scale = Math.pow(1.3, init_zoom_level - outer_leaflet_map.getZoom()); //zoom scaling

    function my(selection) {
        selection.each(function (d, i) {
            // console.log('link: d, i: ', d, i);
            var element = d3.select(this);

            //get the data
            var start = d['start_pos'], end = d['end_pos'];
            start = JSON.parse(start);
            end = JSON.parse(end);
            var start_latlng = new L.LatLng(start[0], start[1]), end_latlng = new L.LatLng(end[0], end[1]);

            var line_attributes = {
                'x1': outer_leaflet_map.latLngToLayerPoint(start_latlng).x,
                'y1': outer_leaflet_map.latLngToLayerPoint(start_latlng).y,
                'x2': outer_leaflet_map.latLngToLayerPoint(end_latlng).x,
                'y2': outer_leaflet_map.latLngToLayerPoint(end_latlng).y,
            };

            //draw the lines
            element.append('line')
                .attr(line_attributes)
                .classed('start_' + d['start'] + ' end_' + d['end'], true)
                .style('stroke', '#de2d26')
                .style('opacity', 0.4)
                .style('stroke-width', d['weight'] / (3 * zoom_scale)); //zoom scaling

        });
    }

    return my;
}

d3.myGlyph = function (outer_leaflet_map) {
    // var my_color = ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'];
    var my_color = ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'];
    var min_r = 1.5, max_r = 6;
    var outer_radius_scale = d3.scale.linear().domain([40, 200]).range([min_r, max_r]);
    var central_color_scale = d3.scale.linear().domain([1.0, 5.0]).range([my_color[0], my_color[my_color.length - 1]]);

    //handle the zoom-in/out operation
    var init_zoom_level = 15;
    var zoom_scale = Math.pow(1.5, init_zoom_level - outer_leaflet_map.getZoom());
    // circles.attr('r', radius / zoom_scale);

    //record the selected glyphs
    var selected_glyphs_counting = [];

    function my(selection) {
        selection.each(function (d, i) {
            // console.log('d,i', d, i);
            var element = d3.select(this).attr('class', 'glyph_group');

            //calculate params
            var outer_radius = 0, inner_radius = min_r;
            inner_radius = inner_radius / zoom_scale; //zoom scaling
            for (var k = 0; k < d.rating.length; k++) {
                outer_radius += d.rating[k]; //待修改
                // d.rating[k] = 40; //待修改
                // outer_radius += 40;
            }
            outer_radius = outer_radius_scale(outer_radius);
            outer_radius = outer_radius / zoom_scale; //zoom scaling

            //central circle
            element.append('circle')
                .attr('r', inner_radius)
                .style('fill', function () {
                    return central_color_scale(d.stars);
                });

            //pie chart
            var arc = d3.svg.arc()
                .outerRadius(outer_radius)
                .innerRadius(inner_radius);
            var pie = d3.layout.pie()
                .sort(null)
                .value(function (d, i) {
                    return d;
                });
            var g_arc = element.selectAll('.arc')
                .data(pie(d.rating))
                .enter()
                .append('g')
                .attr('class', 'arc')
                .append('path')
                .attr('d', arc)
                .style('fill', function (item, j) {
                    return my_color[j];
                })
                .style('stroke', 'black')
                .style('stroke-width', '2px');

            //draw price bar
            var rect_size = 3, l_shift = 0, bars = [1, 1, 1, 1];
            rect_size = rect_size / zoom_scale; //zoom scaling
            var padding_bar_to_circle = 3 / zoom_scale;//zoom scaling
            var g_price_bars = element.append('g')
                .attr('class', 'price_bars')
                .selectAll('rect')
                .data(bars)
                .enter()
                .append('rect')
                .attr('x', function (item, j) {
                    // d.price_range = 3; //待修改
                    return (j - d.price_range) * rect_size;
                })
                .attr('y', -(outer_radius + padding_bar_to_circle + rect_size))
                .attr('width', rect_size)
                .attr('height', rect_size)
                .style('fill', function (item, j) {
                    if (j < d.price_range) {
                        return 'green';
                    }
                    else {
                        return 'white';
                    }
                })
                .style('stroke', 'brown')
                .style('stroke-width', '2px');

            //draw the arrow pointing to the price bars
            var arrow = [[0, -inner_radius / 2 - 1 / zoom_scale], [0, -(outer_radius + padding_bar_to_circle)]]; //need to scale the padding
            var line = d3.svg.line()
                .x(function (d, j) {
                    return d[0];
                })
                .y(function (d, j) {
                    return d[1];
                });
            var g_arrow = element.append('g') //line
                .attr('class', 'arrow_line')
                .selectAll('path')
                .data([arrow])
                .enter()
                .append('path')
                .attr('d', line)
                .style('stroke', 'black')
                .style('stroke-width', '2px');

            var triangle_size = 10;
            triangle_size = triangle_size / zoom_scale; //zoom scaling
            var triangle = d3.svg.symbol().type('triangle-up').size(triangle_size);
            var g_triangle = element.append('g') //triangle
                .attr('class', 'arrow_triangle')
                .attr('transform', function () {
                    return 'translate(0,' + (-(outer_radius + padding_bar_to_circle - 3)) + ')';
                })
                .selectAll('path')
                .data([1])
                .enter()
                .append('path')
                .attr('d', triangle)
                .style('fill', 'black');

            // //drag event that works on a transparent circle
            // var active_class_name = 'active_d3_item';
            // var drag = d3.behavior.drag()
            //     .origin(function () {
            //         var cur_x = d3.transform(d3.select(this.parentNode).attr('transform')).translate[0],
            //             cur_y = d3.transform(d3.select(this.parentNode).attr('transform')).translate[1];
            //         return {'x': cur_x, 'y': cur_y};
            //     })
            //     .on('dragstart', function (item, j) {
            //         console.log('drag start!    ', d3.mouse(this)[0], d3.mouse(this)[1]);
            //         d3.select(this.parentNode).classed(active_class_name, true);
            //         outer_leaflet_map.dragging.disable();
            //
            //     })
            //     .on('dragend', function (item, j) {
            //         console.log('drag end!');
            //         d3.select(this.parentNode).classed(active_class_name, false);
            //         outer_leaflet_map.dragging.enable();
            //     })
            //     .on('drag', function (item, j) { //item is still a row of glyph_items
            //         console.log('item: ', item);
            //         var cur_x = d3.transform(d3.select(this.parentNode).attr('transform')).translate[0],
            //             cur_y = d3.transform(d3.select(this.parentNode).attr('transform')).translate[1];
            //         // var x = cur_x + d3.event.dx;
            //         // var y = cur_y + d3.event.dy;
            //         var x = cur_x + d3.mouse(this)[0];
            //         var y = cur_y + d3.mouse(this)[1];
            //         // console.log('x, y: ', x, y, d3.mouse(this));
            //
            //         //move current group
            //         d3.select(this.parentNode).attr('transform', function () {
            //             return 'translate(' + x + ',' + y + ')';
            //         });
            //
            //         //move the links between glyphs
            //         var cur_id = item.id;
            //         d3.selectAll('line.' + 'start_' + cur_id)
            //             .attr('x1', x)
            //             .attr('y1', y);
            //         d3.selectAll('line.' + 'end_' + cur_id)
            //             .attr('x2', x)
            //             .attr('y2', y);
            //     });
            //
            // element.append('circle')
            //     .attr('r', outer_radius)
            //     .style('opacity', 0.9)
            //     .call(drag);

            //drag event can work on groups
            var active_class_name = 'active_d3_item';
            var drag = d3.behavior.drag()
                .on('dragstart', function (item, j) {
                    console.log('drag start!');
                    d3.select(this).classed(active_class_name, true);
                    outer_leaflet_map.dragging.disable();
                })
                .on('dragend', function (item, j) {
                    console.log('drag end!');
                    d3.select(this).classed(active_class_name, false);
                    outer_leaflet_map.dragging.enable();
                })
                .on('drag', function (item, j) { //item is still a row of glyph_items
                    // console.log('item: ', item);
                    var cur_x = d3.transform(d3.select(this).attr('transform')).translate[0],
                        cur_y = d3.transform(d3.select(this).attr('transform')).translate[1];
                    var x = cur_x + d3.event.dx;
                    var y = cur_y + d3.event.dy;

                    //move current group
                    d3.select(this).attr('transform', function () {
                        return 'translate(' + x + ',' + y + ')';
                    });

                    //move the link
                    var cur_id = item['business_id'];
                    d3.selectAll('line.' + 'start_' + cur_id)
                        .attr('x1', x)
                        .attr('y1', y);
                    d3.selectAll('line.' + 'end_' + cur_id)
                        .attr('x2', x)
                        .attr('y2', y);
                });
            element.append('circle') //Because of the bug of leaflet, we should make the whole area respond to dragging event!
                .attr('r', outer_radius)
                .attr('class', 'hidden_circle')
                .style('opacity', 0.0);

            //handle the event of dragging elements
            element.on('touchmove', function () { //for distinguishing the click event and dragging event
                d3.event.preventDefault();
            }).call(drag);

            //handle the event of clicking
            //click circles to delete glyph
            element.select('circle.hidden_circle')
                .on('click', function (item, j) {
                    if (d3.event.defaultPrevented == false) { //it is click event
                        console.log('let us remove this glyph!');
                        console.log('clicked glyph-circle: ', item, j);

                        //remove the glyph
                        d3.select(this.parentNode).remove();
                        //remove the links
                        var start_class = 'start_' + item['business_id'], end_class = 'end_' + item['business_id'];
                        d3.selectAll('line.' + start_class).remove();
                        d3.selectAll('line.' + end_class).remove();
                    }
                });

            //click price rectangles to select a glyph
            var glyph_data_item = d;
            element.select('g.price_bars')
                .selectAll('rect')
                .on('click', function (item, j) {
                    if (d3.event.defaultPrevented == false) { //it is click event
                        console.log('let us select this glyph!');
                        console.log('clicked glyph-price_rectangles: ', glyph_data_item);


                        var glyph_group = this.parentNode.parentNode;
                        if (d3.select(glyph_group).select('g.highlight_rectangles')[0][0] == null) { //we need to highlight it
                            //check if we have selected two venues or not
                            if (selected_glyphs_counting.length >= 2) {
                                alert('You have already selected two venues! Please de-select one!');
                                return;
                            }

                            //otherwise
                            var highlight_group = d3.select(glyph_group).append('g').classed('highlight_rectangles', true);
                            var r = d3.select(glyph_group).select('circle.hidden_circle').attr('r') + 5;
                            var d = 'M' + (-r) + ' ' + (-r)
                                + ' L' + (r) + ' ' + (-r)
                                + ' L' + (r) + ' ' + (r)
                                + ' L' + (-r) + ' ' + (r)
                                + ' L' + (-r) + ' ' + (-r);
                            highlight_group.append('path').attr('d', d)
                                .attr('stroke', 'blue')
                                .attr('stroke-width', '3px')
                                .attr('fill', 'none');

                            //save it
                            selected_glyphs_counting.push(glyph_data_item);
                            if (selected_glyphs_counting.length == 2) {
                                console.log('Selection is done! ', selected_glyphs_counting);
                                pipService.emitVenueSelectionIsReady(selected_glyphs_counting);
                            }
                        }
                        else {
                            d3.select(glyph_group).select('g.highlight_rectangles').remove(); //we need to remove it

                            var tmp = []; //update the selection list
                            for (var k = 0; k < selected_glyphs_counting.length; k++) {
                                if (selected_glyphs_counting[k]['business_id'] != glyph_data_item['business_id']) {
                                    tmp.push(selected_glyphs_counting[k]);
                                }
                            }
                            selected_glyphs_counting = tmp;
                        }
                    }

                });

        });
    }

    return my;
}

