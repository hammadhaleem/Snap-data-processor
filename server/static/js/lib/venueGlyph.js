/**
 * Created by wangyong on 2/3/2017.
 */

d3.myLink = function () {

    function my(selection) {
        selection.each(function (d, i) {
            console.log('link: d, i: ', d, i);
            var element = d3.select(this);

            //get the data
            // var s_id = d['start'], e_id = d['end'];
            var start = d['start_pos'], end = d['end_pos'];
            var line_attributes = {
                'x1': start[0],
                'y1': start[1],
                'x2': end[0],
                'y2': end[1]
            };

            //draw the lines
            element.append('line')
                .attr(line_attributes)
                .classed('start_' + d['start_id'] + ' end_' + d['end_id'], true)
                .style('stroke', 'gray')
                .style('stroke-width', d['weight'] / 2);

        });
    }

    return my;
}

d3.myGlyph = function (outer_leaflet_map) {
    // var my_color = ['red', 'green', 'blue', 'brown', 'yellow'];
    var my_color = ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'];
    var min_r = 8, max_r = 60;
    var outer_radius_scale = d3.scale.linear().domain([40, 200]).range([min_r, max_r]);
    var central_color_scale = d3.scale.linear().domain([1.0, 5.0]).range([my_color[0], my_color[my_color.length - 1]]);

    function my(selection) {
        selection.each(function (d, i) {
            console.log('d,i', d, i);
            var element = d3.select(this);

            //calculate params
            var outer_radius = 0, inner_radius = min_r;
            for (var k = 0; k < d.rating.length; k++) {
                outer_radius += d.rating[k];
            }
            outer_radius = outer_radius_scale(outer_radius);

            //central circle
            element.append('circle')
                .attr('r', inner_radius)
                .style('fill', function () {
                    return central_color_scale(d.avg_rate);
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
            var rect_size = 12, l_shift = 0, bars = [1, 1, 1, 1];
            var g_price_bars = element.append('g')
                .attr('class', '.price_bars')
                .selectAll('rect')
                .data(bars)
                .enter()
                .append('rect')
                .attr('x', function (item, j) {
                    return (j - d.price) * rect_size;
                })
                .attr('y', -(outer_radius + 15 + rect_size))
                .attr('width', rect_size)
                .attr('height', rect_size)
                .style('fill', function (item, j) {
                    if (j < d.price) {
                        return 'green';
                    }
                    else {
                        return 'white';
                    }
                })
                .style('stroke', 'brown')
                .style('stroke-width', '2px');

            //draw the arrow pointing to the price bars
            var arrow = [[0, -inner_radius / 2 - 4], [0, -(outer_radius + 13)]];
            console.log('arrow: ', arrow);
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

            var triangle_size = 20;
            var triangle = d3.svg.symbol().type('triangle-up').size(triangle_size);
            var g_triangle = element.append('g') //triangle
                .attr('class', 'arrow_triangle')
                .attr('transform', function () {
                    return 'translate(0,' + (-(outer_radius + 15 - 3)) + ')';
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
                    console.log('item: ', item);
                    var cur_x = d3.transform(d3.select(this).attr('transform')).translate[0],
                        cur_y = d3.transform(d3.select(this).attr('transform')).translate[1];
                    var x = cur_x + d3.event.dx;
                    var y = cur_y + d3.event.dy;

                    //move current group
                    d3.select(this).attr('transform', function () {
                        return 'translate(' + x + ',' + y + ')';
                    });

                    //move the link
                    var cur_id = item.id;
                    d3.selectAll('line.' + 'start_' + cur_id)
                        .attr('x1', x)
                        .attr('y1', y);
                    d3.selectAll('line.' + 'end_' + cur_id)
                        .attr('x2', x)
                        .attr('y2', y);
                });
            element.append('circle') //Because of the bug of leaflet, we should make the whole area respond to dragging event!
                .attr('r', outer_radius)
                .style('opacity', 0.0);

            element.call(drag);

        });
    }

    return my;
}

