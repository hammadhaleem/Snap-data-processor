/**
 * Created by wangyong on 8/3/2017.
 */

var commonCustomerView = new Vue({
    el: '#commonCustomerComparisonView',
    delimiters: ['{{', '}}'],
    data: {
        // view_svg_handler: undefined,
        // selected_venue_info: [],
        common_customer_rating_reviews: []
    },
    methods: {
        initDrawing: function () {
            var width = 770, height = 450;
            var svg_tmp = d3.select('#commonCustomerComparisonView').select('svg');
            if (svg_tmp[0][0] != null) {
                svg_tmp.remove();
            }

        },
        processNodeList: function (raw_nodes) {
            //build links
            var tmp_link = {};
            for (var i = 0; i < raw_nodes.length; i++) {
                var bs1_rating = raw_nodes[i]['details']['business_1_rating'],
                    bs2_rating = raw_nodes[i]['details']['business_2_rating'];

                //check if the rating does not exist
                if (bs1_rating == null)
                    bs1_rating = 3;
                if (bs2_rating == null)
                    bs2_rating = 3;

                // //l->r
                // var l_attr = 'l' + bs1_rating,
                //     r_attr = 'r' + bs2_rating;
                // var attr = l_attr + ',' + r_attr;
                // if (tmp_link.hasOwnProperty(attr)) {
                //     tmp_link[attr]++;
                // }
                // else {
                //     tmp_link[attr] = 1;
                // }

                //l->m
                var l_attr = 'l' + bs1_rating,
                    r_attr = 'r' + bs2_rating;
                var bs_diff = bs1_rating - bs2_rating;
                var m_attr = 'm' + bs_diff;
                var attr = l_attr + ',' + m_attr;
                if (tmp_link.hasOwnProperty(attr)) {
                    tmp_link[attr]++;
                }
                else {
                    tmp_link[attr] = 1;
                }

                //m->r
                attr = m_attr + ',' + r_attr;
                if (tmp_link.hasOwnProperty(attr)) {
                    tmp_link[attr]++;
                }
                else {
                    tmp_link[attr] = 1;
                }
            }
            var links = []; //final info of nodes
            for (var prop in tmp_link) {
                if (tmp_link.hasOwnProperty(prop)) {
                    var tmp_prop = prop.split(',');
                    var tmp = {'source': tmp_prop[0], 'target': tmp_prop[1], 'value': tmp_link[prop]};
                    links.push(tmp);
                }
            }

            //Node info and update link nodes
            var node_set = new Set();
            for (var i = 0; i < links.length; i++) {
                node_set.add(links[i]['source']);
                node_set.add(links[i]['target']);
            }
            var node_array = Array.from(node_set);
            node_array.sort(function (a, b) {
                if (b[0] > a[0])
                    return 1;
                else if (b[0] < a[0])
                    return -1;
                else {
                    return a.substring(1) - b.substring(1);
                }
            });
            for (var i = 0; i < links.length; i++) {
                links[i]['source'] = node_array.indexOf(links[i]['source']);
                links[i]['target'] = node_array.indexOf(links[i]['target']);
            }

            var nodes = []; //final info of nodes
            for (var i = 0; i < node_array.length; i++) {
                var tmp = {'name': node_array[i]};
                nodes.push(tmp);
            }

            return {'nodes': nodes, 'links': links};
        },
        drawSankeyDiagram: function (nodes, links) {
            var width = 770, height = 450;
            var view_svg_handler = d3.select('#commonCustomerComparisonView')
                .select('section')
                .append("svg")
                .attr('width', width)
                .attr('height', height);


            var units = "Widgets";
            var formatNumber = d3.format(",.0f"), // zero decimal places
                format = function (d) {
                    return formatNumber(d) + " " + units;
                },
                color = d3.scale.category20();

            // Set the sankey diagram properties
            var sankey = d3.sankey()
                .nodeWidth(36)
                .nodePadding(50)
                .width(760)
                .size([760, 420]); //width, height

            var path = sankey.link();

            sankey
                .nodes(nodes)
                .links(links)
                .layout(32); //iteration number

            // add in the links
            var link = view_svg_handler
                .append("g").selectAll(".link")
                .data(links)
                .enter().append("path")
                .attr("class", "link")
                .attr("d", path)
                .style("stroke-width", function (d) {
                    return Math.max(1, d.dy);
                })
                .sort(function (a, b) {
                    return b.dy - a.dy;
                });

            // add the link titles
            link.append("title")
                .text(function (d) {
                    return d.source.name + " → " +
                        d.target.name + "\n" + format(d.value);
                });

            // add in the nodes
            var node = view_svg_handler
                .append("g").selectAll(".node")
                .data(nodes)
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                })
                .call(d3.behavior.drag()
                    .origin(function (d) {
                        return d;
                    })
                    .on("dragstart", function () {
                        this.parentNode.appendChild(this);
                    })
                    .on("drag", dragmove));

            // add the rectangles for the nodes
            node.append("rect")
                .attr("height", function (d) {
                    return d.dy;
                })
                .attr("width", sankey.nodeWidth())
                .style("fill", function (d) {
                    // return d.color = color(d.name.replace(/ .*/, ""));
                    return d.color = color(d.name);
                })
                .style("stroke", function (d) {
                    return d3.rgb(d.color).darker(2);
                })
                .append("title")
                .text(function (d) {
                    return d.name + "\n" + format(d.value);
                });

            // add in the title for the nodes
            node.append("text")
                .attr("x", -6)
                .attr("y", function (d) {
                    return d.dy / 2;
                })
                .attr("dy", ".35em")
                .attr("text-anchor", "end")
                .attr("transform", null)
                .text(function (d) {
                    return d.name;
                })
                .filter(function (d) {
                    return d.x < width / 2;
                })
                .attr("x", 6 + sankey.nodeWidth())
                .attr("text-anchor", "start");

            // the function for moving the nodes
            function dragmove(d) {
                d3.select(this).attr("transform",
                    "translate(" + d.x + "," + (
                        d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
                    ) + ")");
                sankey.relayout();
                link.attr("d", path);
            }


        }
    },
    created: function () {

    },
    mounted: function () {

        var _this = this;
        pipService.onVenueSelectionIsReady(function (selected_glyphs) {
            console.log('selected glyph list: ', selected_glyphs);
            var bs_id1 = selected_glyphs[0]['business_id'], bs_id2 = selected_glyphs[1]['business_id'];
            var data_getter_handler = dataService.getCommonCustomerInfoOfTwoVenues(bs_id1, bs_id2);
            data_getter_handler.then(function (resp) {
                console.log('Common Customer Info: ', resp.data);
                var links_list = resp.data.links;
                var nodes_list = resp.data.nodes;

                _this.common_customer_rating_reviews = nodes_list;
                // console.log('_this.common_customer_rating_reviews: ', _this.common_customer_rating_reviews);
                var processed_nodes_links = _this.processNodeList(nodes_list);

                _this.initDrawing();
                _this.drawSankeyDiagram(processed_nodes_links['nodes'], processed_nodes_links['links']);
            }, function (error) {
                console.log('Error in getting common customer information!', error);
            });
        });
    },
    watch: {},
});