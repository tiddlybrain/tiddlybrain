/*\
title: $:/plugins/ihm/tidgraph/utils.js
type: application/javascript
module-type: library

Internal utility functions for tidgraph plugin.

\*/
(function () {

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

    function getOffsetRect(elem) {
        var box = elem.getBoundingClientRect()
        var body = document.body
        var docElem = document.documentElement
        var scrollTop = elem.scrollTop || window.pageYOffset || docElem.scrollTop || body.scrollTop
        var scrollLeft = elem.scrollLeft || window.pageXOffset || docElem.scrollLeft || body.scrollLeft
        var clientTop = docElem.clientTop || body.clientTop || 0
        var clientLeft = docElem.clientLeft || body.clientLeft || 0

        var top = box.top - scrollTop - clientTop
        var left = box.left - scrollLeft - clientLeft
        return { top: top, left: left, width: box.width, height: box.height, right: left + box.width, bottom: top + box.height }
    }

    //Return value of first field matching criteria in StringArray
    //titles: tiddlers in which the field(s) are sought
    //
    //The default criteria is to have a non-empty value
    function firstField(fieldStrArray, titles, criteria) {
        var criteria = criteria || function (value, field, title) { if (value) return true; }
        var fa = $tw.utils.parseStringArray(fieldStrArray);
        var lenfa = fa.length;
        var lenta = titles.length;
        for (var j = 0; j < lenta; j++)
            for (var i = 0; i < lenfa; i++) {
                var tid = $tw.wiki.getTiddler(titles[j]);
                if (tid) {
                    var val = tid.getFieldString(fa[i]);
                    if (criteria(val, fa[i], titles[j]))
                        return val;
                }
            }
        return "";
    }

    function getNodeClasses(node) {
        var def = "ihm-tgr-node tgr-node";
        //Chose css class for node
        //1. If tiddler has a _tgr_node class(_add) field use that, if not
        //2. If template has a _tgr_node_class(_add) field use that, if not
        //3. use default classes
        //4. use default classes if _tgr_node_class in any of the above
        //   is tgr-default
        //
        //   _tgr_node_class_add appends the class rather than replacing it
        var add = false;
        var nodeclass = firstField("_tgr_node_class _tgr_node_class_add",
            [node.id, node.template], function (val, field, title) {
                if (val) {
                    add = (field === '_tgr_node_class_add') ? true : false;
                    return true;
                }
            });
        if (!nodeclass || (nodeclass === "tgr-default")) return def
        else
            if (add) return def + " " + nodeclass;
        return nodeclass;
    }

    function getRenderedNode(node) {
        return $tw.wiki.renderTiddler("text/html", node.transcluder);
    }

    //Tiddler HTML wraped in <span> instead of the normal <p> of TW5
    function tiddlerSpan(title) {
        //TW5 surrounds the innerHTML with a paragraph, we replace it with a span
        return $tw.wiki.renderTiddler("text/html", title)
            .replace(/^<p>/, '<span>')
            .replace(/<\/p>$/, '</span>');
    }

    exports.buildTable = function (rootTid, tidtree) {
        function dm(tag, opts) {
            //Make sure document points to tidree.document in case we are under fakedom
            return $tw.utils.domMaker(tag,
                $tw.utils.extend(opts, { document: tidtree.document }));
        }

        function getNodeTitle(title, tidtree) {
            //Note we don't use a closure on tidtree to prevent creation
            //of a new function for every tidtree

            // Handle non existent tiddler 
            if (!$tw.wiki.tiddlerExists(title)) return title;

            //Get title from caption or title if nodetitle attribute doesn't exist or
            //from the first non-empty field in the fields listed in the nodetitle 
            //attribute.
            if (!tidtree.nodetitle) {
                return firstField("caption title", [title]);
            } else {
                return firstField(tidtree.nodetitle, [title]);
            }
        }

        function makeNodeDiv(node) {
            var esctitle = encodeURIComponent(node.id);
            var title = getNodeTitle(node.id, tidtree);
            var isMissing = !$tw.wiki.tiddlerExists(node.id);
            var linkclass = isMissing ? "tc-tiddlylink-missing" : "tc-tiddlylink-resolves";
            var linkclass = "tc-tiddlylink " + linkclass;
            var nodeclass = getNodeClasses(node);
            var nodecontent;
            if (node.template) {
                nodecontent = dm('div', {
                    "class": nodeclass,
                    innerHTML: getRenderedNode(node)
                });
            } else {
                var tidlink = dm('a', {
                    "class": linkclass,
                    text: title,
                    attributes: { href: '#' + esctitle }
                });
                nodecontent = dm('div', {
                    "class": nodeclass,
                    children: [tidlink]
                });
            }

            // Make node <a> element draggable so that listeners from other tiddlers can react on drop
            // See https://groups.google.com/forum/?utm_medium=email&utm_source=footer#!msg/tiddlywiki/V-sJ27fOjek/wBSZSR06BgAJ
            if (node && nodecontent) {
                var domnode = nodecontent.querySelector("a.tc-tiddlylink");
                if (domnode) {
                    $tw.utils.makeDraggable({
                        domNode: domnode,
                        dragTiddlerFn: function () { return node.id; },
                        widget: node.widget
                    });
                }
            }

            return nodecontent;
        }

        function makeCollapseLink(node) {
            //Build collapse link
            var collapsesvg, tmpl;
            var collapsetmpl = "$:/plugins/ihm/templates/" +
                ((node.collapse) ? "expand" : "collapse");
            var collapsesvg = tiddlerSpan(collapsetmpl);
            var layoutcls = (node.widget.tidtree.layout == 'E') ?
                "ihm-tgr-collapse-east" : "ihm-tgr-collapse-south";
            var collapse = dm('span', {
                "class": "ihm-tgr-collapse " + layoutcls + " tc-tiddlylink",
                innerHTML: collapsesvg
            });

            // Add a click event handler for the collapse + or -
            $tw.utils.addEventListeners(collapse, [
                {
                    name: "click",
                    handlerObject: node,
                    handlerMethod: "collapseClickEvent"
                }
            ]);
            return collapse;
        }

        function makeCell(node, nodecontent) {
            var cnt = 1 + countDescendants(node, true);//skipvisited shouldn't matter, tree is already prunned
            var esctitle = encodeURIComponent(node.id);
            var tooltip = getTooltip(node.id, tidtree);
            var tddiv, divchildren, td;
            //Add collapse link if needed
            if ((tidtree.nocollapse === false)
                && node.children
                && node.children.length > 0) {
                // Add collapse link to the content div of td
                var collapse = makeCollapseLink(node);
                divchildren = [nodecontent, collapse];
            } else {
                //Collapse link not needed
                divchildren = [nodecontent];
            }

            //Build td element
            var layoutcls = (node.widget.tidtree.layout == "E") ?
                "ihm-tgr-node-container-east" : "ihm-tgr-node-container-south";
            tddiv = dm('div', {
                "class": "ihm-tgr-node-container " + layoutcls,
                children: divchildren,
                attributes: {
                    id: tidtree.id + '-' + esctitle,
                    title: tooltip
                }
            });
            if (tidtree.layout === "E")
                td = dm('td', { attributes: { rowspan: cnt }, children: [tddiv] });
            else
                td = dm('div', { attributes: { "class": "ihm-tgr-node-cell" }, children: [tddiv] });

            return td;
        }

        function eastAddChild(node, table, currdepth) {
            if (currdepth >= tidtree.startat) {
                var nodecontent = makeNodeDiv(node);
                var td = makeCell(node, nodecontent);
                var tr = dm('tr', { children: [td] });
                table.appendChild(tr);
            }
        }

        function southAddChild(node, table, acc, currdepth) {
            if (currdepth >= tidtree.startat) {
                var nodecontent = makeNodeDiv(node);
                var cell = makeCell(node, nodecontent);
                var currgroup = acc.nodegroup[acc.nodegroup.length - 1];

                //Append this node to the apropriate nodegroup if it is
                //defined, otherwise append it to the main table
                if (currgroup) {
                    if (currdepth >= acc.lastdepth)
                        currgroup.appendChild(cell);
                    else if (currdepth < acc.lastdepth) {
                        acc.nodegroup.pop();
                        currgroup = acc.nodegroup[acc.nodegroup.length - 1];
                        currgroup.appendChild(cell);
                    }
                } else {
                    table.appendChild(cell);
                }

                //New node group added if this node has children
                //and we are deeper in the tree, otherwise pop back
                //to the previous level
                if (!node.collapse && (node.children.length > 0)) {
                    var ng = dm('div', { "class": "ihm-tgr-node-group" });
                    acc.nodegroup.push(ng);
                    cell.appendChild(ng);
                }
            }
            acc.lastdepth = currdepth;
        }

        function getTooltip(title, tidtree) {
            return firstField(tidtree.tooltip, [title]);
        }

        /*Add children to the unfinished table*/
        function addChildren(table) {
            switch (tidtree.layout) {
                case 'E':
                    dfvisit(tidtree.root, function (node, acc, currdepth) {
                        //Add tr(s) to table
                        eastAddChild(node, table, currdepth);
                        return true; //continue visiting nodes
                    }, {}, { skipvisited: true });
                    break;
                case 'S':
                    var acc = { nodegroup: [], lastdepth: -1 };
                    dfvisit(tidtree.root, function (node, acc, currdepth) {
                        //Add div cells and groups to table
                        southAddChild(node, table, acc, currdepth);
                        return true; //continue visiting nodes
                    }, acc, { skipvisited: true });
                    break;
            }
        }

        var filter, tiddlers = [],
            data = [];
        //DEBUG printtree(tidtree.root,true)
        var table;
        if (tidtree.layout == "E") {
            table = dm('table', {
                "class": "ihm-tgr-table",
                "attributes": { id: tidtree.id + "-table" }
            });
        } else {
            table = dm('div', {
                "class": "ihm-tgr-divtable",
                "attributes": { id: tidtree.id + "-table" }
            });
        }

        addChildren(table);

        //DEBUG console.log(" table = ", out.str, "\ntidtree: ",tidtree);
        //DEBUG console.log("outliers=",tidtree.outliers)
        return table;
    }

    function getPort(tgrdiv, edge, criteria) {
        var el;
        var cont_rect = getOffsetRect(tgrdiv);

        if (typeof criteria === "string") {
            el = document.querySelector(criteria);
            /* FIXME: show error */
            if (el == null) return null;
        } else if (criteria instanceof HTMLElement) el = criteria;

        var el_rect = getOffsetRect(el);
        //DEBUG console.log("el rect=",el_rect,"\ndivrect=",cont_rect);

        var r = {
            "bottom": el_rect.bottom - cont_rect.top,
            "left": el_rect.left - cont_rect.left,
            "right": el_rect.right - cont_rect.left,
            "top": el_rect.top - cont_rect.top
        };
        var p = "";
        switch (edge.toUpperCase()) {
            case 'L':
                p = [Math.round(r.left), Math.round(r.bottom / 2 + r.top / 2)];
                break;
            case 'R':
                p = [Math.round(r.right), Math.round(r.bottom / 2 + r.top / 2)];
                break;
            case 'T':
                p = [Math.round(r.right / 2 + r.left / 2), Math.round(r.top)];
                break;
            case 'B':
                p = [Math.round(r.right / 2 + r.left / 2), Math.round(r.bottom)];
                break;
        }

        //DEBUG console.log("\nport=",p);
        return p;
    }

    /* firgures our which ports to use to connect
       e1 and e2. There are four ports for each 
       element: T(op), B(ottom), R(ight), L(eft) */
    function whichPort(e1, e2, layout) {
        /* for now presume r,l */

        var e1r = getOffsetRect(e1);
        var e2r = getOffsetRect(e2);
        var e1x = e1r.left + e1r.width / 2;
        var e1y = e1r.top + e1r.height / 2;
        var e2x = e2r.left + e2r.width / 2;
        var e2y = e2r.top + e2r.height / 2;

        //DEBUG console.log(`e1=(${e1x},${e1y}) e2=(${e2x},${e2y})`)
        //console.log('e1=',e1r,e1,'e2=',e2r,e2)

        switch (layout) {
            case "E":
                //Because map is from left to right
                //default is [R,L]
                if (e2x - e1x < 4) return ["R", "R"];
                else return ["R", "L"]
                break;
            case "S":
                if (e2y - e1y < 4) return ["B", "B"];
                else return ["B", "T"];
                break;
        }
    }

    exports.error = function (msg) {
        return '<span style="color:green; font-size:1.5em">⚠ Tidgraph: </span><span style="color:red">' + msg + '</span>';
    }

    /* Produces an svg path element to connect e1 and e2 */
    function connect(tgrdiv, e1, e2, layout, weak) {
        var dir = whichPort(e1, e2, layout);
        //DEBUG console.log(`dir=${dir}`)
        var p1 = getPort(tgrdiv, dir[0], e1);
        var p2 = getPort(tgrdiv, dir[1], e2);
        var offy, offx, qoff = 10, weakcls = "";

        if (weak) weakcls = ' class="tgr-edge-weak"';

        if (e1 == null || e2 == null) return error("can't connect null element");
        if (p1 == null) return error('port not found for ' + e1.tagName + ' - ' + e1.innerHTML);
        if (p2 == null) return error('port not found for ' + e2.tagName + ' - ' + e2.innerHTML);
        var vdist = Math.abs(p2[1] - p1[1]);
        var hdist = Math.abs(p2[0] - p1[0]);
        switch (layout) {
            case "E":
                if (p2[1] > p1[1]) offy = vdist / 2; //+10;  // Curve down
                if (p2[1] < p1[1]) offy = -vdist / 2; //-10;  // Curve up
                if (vdist < 5) offy = 0;  //Straight line if vertical distance is less than 5px

                if (dir[1] == "L") offx = -10; // 10px left of edge
                if (dir[1] == "R") { offx = +10; qoff = 20 } // 10px right of edge
                //if ( hdist < 5) qoff = 18 //Larger loop if horizontal distance is less than 5px (ont )
                return '<path d="M' + p1[0] + ',' + p1[1] + ' Q' + (p1[0] + qoff) + ',' + p1[1] +
                    '  ' + (p1[0] + qoff) + ',' + (p1[1] + offy) + ' Q' + (p1[0] + qoff) + ',' + p2[1] +
                    '  ' + (p2[0] + offx) + ',' + p2[1] + '"' + weakcls +
                    ' marker-end="url(#tgr-arrow)"/>';
            case "S":
                if (p2[0] > p1[0]) offx = hdist / 2; //+10;  // Curve right
                if (p2[0] < p1[0]) offx = -hdist / 2; //-10;  // Curve left
                if (hdist < 5) offx = 0;  //Straight line if vertical distance is less than 5px

                if (dir[1] == "T") { offy = -10; qoff = 10 } // 10px above edge
                if (dir[1] == "B") { offy = +10; qoff = 20 } // 10px below edge
                //if ( hdist < 5) qoff = 18 //Larger loop if horizontal distance is less than 5px (ont )
                return '<path d="M' + p1[0] + ',' + p1[1] + ' Q' + p1[0] + ',' + (p1[1] + qoff) +
                    '  ' + (p1[0] + offx) + ',' + (p1[1] + qoff) + ' Q' + p2[0] + ',' + (p1[1] + qoff) +
                    '  ' + p2[0] + ',' + (p2[1] + offy) + '"' + weakcls +
                    ' marker-end="url(#tgr-arrow)"/>';
        }
        /*#aeb0b5 */
    }

    exports.buildSVG = function (tgrdiv, tidtree) {
        var div = document.getElementById(tidtree.id + '-table');
        if (!div) {
            //FIXME: this is done because the window.onresize function
            // is not cleaned up in widget.render when a tiddler is not
            // visibe any more or is deleted 
            return;
        }

        // from http://youmightnotneedjquery.com/
        var style = getComputedStyle(div);
        var height = tgrdiv.offsetHeight;
        var width = tgrdiv.offsetWidth;


        return '<svg  xmlns="http://www.w3.org/2000/svg" height="' + height + 'px" width="' + width +
            'px" style="overflow: visible">' +
            '<g class="ihm-tgr-link tgr-link tgr-edge" style="overflow: visible"> ' +
            '<defs> <marker id="tgr-arrow" viewBox="0 0 10 10" refX="1" refY="5" ' +
            'markerUnits="strokeWidth" orient="auto" ' +
            'markerWidth="8" markerHeight="6"> ' +
            '<polyline class="ihm-tgr-arrow tgr-arrow" points="0,0 10,5 0,10 0,5" style="opacity:1;" />' +
            '</marker>' + //FIXME: drop-shadow??
            /*'<filter id="shadow" x="0" y="0" width="200%" height="200%">'+
            '<feOffset result="offOut" in="SourceGraphic" dx="3" dy="3" />'+
            '<feColorMatrix result="matrixOut" in="offOut" type="matrix"'+
            'values="0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0" />'+
            '<feGaussianBlur result="blurOut" in="matrixOut" stdDeviation="10" />'+
            '<feBlend in="SourceGraphic" in2="blurOut" mode="normal" />'+
              '</filter>'+*/
            '</defs> ' +
            connectAll(tgrdiv, tidtree) +
            '</g> </svg>';
    }

    /* Return an array of the children of tiddler tid */
    function getChildren(tid, tidtree) {
        var filter, res;
        switch (tidtree.mode) {
            case 'tagging':
                filter = '[[' + tid + ']tagging[]]+' + tidtree.filter;
                break;
            case 'linking':
                filter = '[[' + tid + ']links[]!is[missing]]+' + tidtree.filter;
                break;
            default:
                filter = '[[' + tid + ']' + tidtree.mode + ']+' + tidtree.filter;
        }
        res = $tw.wiki.filterTiddlers(filter);
        return res;
    }

    /* Return true if the child tiddler is a descendant of parent */
    exports.isDescendant = function (child, parent, tidtree) {
        if (isChild(child, parent, tidtree)) return true;
        var isAChild = false;

        dfvisit(parent, function (node, acc, currdepth) {
            if (node === child) {
                isAChild = true;
                return false;
            }
        }, {}, {
            skipvisited: true, getCh: function (n) {
                return getChildren(n, tidtree)
            }
        });

        return isAChild;
    }

    /* Return true if the child tiddler is a child of parent */
    function isChild(child, parent, tidtree) {
        switch (tidtree.mode.toLowerCase()) {
            case 'tagging':
                var c = $tw.wiki.getTiddler(child);
                if (c) return c.hasTag(parent);
                else return false;
                break;
            default:
                var c = getChildren(parent, tidtree);
                return (c.indexOf(child) !== -1)
        }
    }

    function connectAll(tgrdiv, tidtree) {
        var res = [], el1, el2, title1, title2, esctitle1, esctitle2;

        function addPath(c, p, weak) {
            title1 = p;
            title2 = c;
            esctitle1 = encodeURIComponent(title1);
            esctitle2 = encodeURIComponent(title2);
            el1 = document.getElementById(tidtree.id + '-' + esctitle1);
            el2 = document.getElementById(tidtree.id + '-' + esctitle2);
            if (el1 && el2) res.push(connect(tgrdiv, el1, el2, tidtree.layout, weak))//DEBUG,console.log(`${p} -----> ${c}`,el1,el2);
        }
        //Collect SVG paths for all nodes in the main tree
        dfvisit(tidtree.root, function (child, acc, currdepth) {
            //We skip root
            var parent = child.parent;
            if (parent) addPath(child.id, parent.id)
        }, {}, { skipvisited: true })

        //Now collect SVG paths for outliers
        var len = tidtree.outliers.length;
        for (var i = 0; i < len; i++) {
            var c = tidtree.outliers[i][0];
            var p = tidtree.outliers[i][1];
            addPath(c, p, true);
        }

        return res.join(" ");
    }

    /*********************************************************************
     *                     Tree traversal functions                      *
     *********************************************************************/

    /* Depth first tree traversal 
     * Parameters: 
     * n: Start node
     * cb: callback function (node,acc,level)
     *     level: starts at 0 which is root
     *     node: the node being visited
     *     acc: an acumulator that gets passed from call to call
     *          it is an object passed by reference
     * accInit: Initial acc for cb
     * options: Object with the optional keys:
     *    getCh: function to get Children of node (n) (default returns n.children)
     *    skipvisited: true to skip nodes already visited (default true)
    */
    function dfvisit(n, cb, accInit, opts) {
        var opts = opts || {}
        var done = opts.done || []
        var getCh = opts.getCh || function (o) { return o.collapse ? [] : o.children }
        var lvl = opts.lvl || 0
        var skipvisited = opts.skipvisited === undefined ? true : opts.skipvisited
        opts.leave = opts.leave || false

        //DEBUG console.log('dfvisit node=',n,'skip=',skipvisited);
        // return if node already visited
        if (skipvisited && (done.indexOf(n) !== -1))
            return accInit

        //mark node as visited
        done.push(n)

        //get children
        var ch = getCh(n), len = ch.length, acc = accInit || {}

        // process node
        opts.lvl = lvl + 1
        opts.done = done

        if (cb(n, acc, lvl) === false) {
            opts.leave = true
            return acc
        }

        //recurse through children
        for (var i = 0; i < len; i++) {
            acc = dfvisit(ch[i], cb, acc, opts)
            if (opts.leave)
                return acc
        }
        opts.lvl--
        return acc
    }

    /* Breadth first tree traversal 
     * Parameters: 
     * n: Start node
     * cb: callback function (node,acc,startsLevel)
     * accInit: Initial accumulator for callback function
     * getCh: gets Children of node (one parameter: node)
    */
    function bfvisit(n, cb, accInit, opts) {
        function visited(n, done, skipvisited) {
            if (!skipvisited) return false
            if (done.indexOf(n) === -1) return false
            else return true
        }

        var opts = opts || {}
        var getCh = opts.getCh || function (o) { return o.collapse ? [] : o.children }
        var getId = opts.getId || function (o) { return o.id }
        var skipvisited = opts.skipvisited === undefined ? true : opts.skipvisited
        var maxdepth = opts.maxdepth || Number.MAX_VALUE;
        var accInit = accInit || {}
        var acc = accInit
        var queue = [], done = []
        var parent = [];
        var depth = 0;

        // enqueue root
        queue.push(n)
        parent[getId(n)] = undefined

        do {
            var len = queue.length

            // for each node in the queue
            for (var i = 0; i < len; i++) {
                // dequeue
                var n1 = queue.shift();

                // process node
                if (!visited(n1, done, skipvisited))
                    if (cb(n1, parent[getId(n1)], acc, depth) === false)
                        return acc

                done.push(n1)

                // enqueue children of the node
                var children = getCh(n1)
                queue = queue.concat(children)
                if (children) children.forEach(function (c) {
                    var p = parent[getId(c)];
                    if (!p) {
                        parent[getId(c)] = n1;
                    } else {
                        //See if it is an outlier
                        if ((getId(p) !== getId(n1)) && opts.outlier) {
                            opts.outlier(c, n1)
                        }
                    }
                })
            }

            // level finished
            depth++

            // repeat
        } while ((0 !== queue.length) && (depth <= maxdepth))
        return acc
    }

    /*********************************************************************
     *                     Tidtree utility functions                     *
     *********************************************************************/
    /* Build a tidtree from the starting tiddler 
     * Parameters:
     *    tid: the starting tiddler
     */
    exports.makeTidTree = function (tid, tidtree, opts) {
        var opts = opts || {};
        var alreadyThere = false;
        tidtree.outliers = [];

        //Get id of Tiddler
        function getId(n) {
            return n;
        }

        //Get Children of Tiddler
        function getCh(n) {
            return getChildren(n, tidtree)
        }

        //Lookup id in array of tidtree nodes
        function inArray(a, id) {
            var len = a.length;
            for (var i = 0; i < len; i++) {
                if (a[i].id === id) return a[i];
            }
            return undefined;
        }

        //Build the tidtree
        var root = new tnode(undefined, getId(tid), 0, opts.widget, tidtree.collapseDefault);
        bfvisit(tid, function (n, p, acc, level) {
            var node, added;
            //console.log("visited=",n.id," parent=",p ? p.id:"undef")
            //console.log(`looking for parent of ${n.id} which supposedly is ${p ? p.id:"undef"}`);
            if (p) {
                var n_id = getId(n), p_id = getId(p);
                node = inArray(acc.visited, p_id);
                added = node.addChild(n_id, level, opts.widget, tidtree.collapseDefault);
                acc.visited.push(added)
            }
            return true
        },
            { visited: [root] }, {
            "getId": getId, "getCh": getCh, maxdepth: tidtree.maxdepth, skipvisited: true,
            outlier: function (child, parent) {
                //Is thia an existing outlier pair?
                alreadyThere = false;
                $tw.utils.each(tidtree.outliers, function (el) {
                    if ((el[0] === child) && (el[1] === parent))
                        alreadyThere = true;
                })
                //Add pair if not repeated
                if (!alreadyThere) tidtree.outliers.push([child, parent])
            }
        })

        return root;
    }

    /* Count descendants for the specified tnode
     * Parameters:
     *   node: Children of this node will be included in the count
    */
    function countDescendants(node, skipvisited) {
        var acc = dfvisit(node, function (n, acc1) {
            acc1.cnt++;
            return true
        }, { cnt: 0 }, { "skipvisited": skipvisited })
        return acc.cnt - 1
    }
    /*********************************************************************
     *                    Tree node class functions                      *
     *********************************************************************/

    function findNodeTemplate(title, level, nodetemplate) {
        var usertemplates = $tw.utils.parseStringArray(nodetemplate);
        //If tiddler has a _tgr_node_template field, that is the template
        var template = firstField("_tgr_node_template", [title]);

        //Discard templates whose filter excludes this tiddler
        var remove = [];
        $tw.utils.each(usertemplates, function (templtitle) {
            var tid = $tw.wiki.getTiddler(templtitle);
            var filter = (tid) ? tid.getFieldString("_tgr_node_filter") : "";

            var tids = $tw.wiki.filterTiddlers(filter);
            if (filter && tids.indexOf(title) === -1)
                remove.push(templtitle);
        });

        if (remove.length > 0)
            $tw.utils.removeArrayEntries(usertemplates, remove);

        //If tiddler does not have individual template
        //1. seek for template with a matching filter, if not found,
        //2. seek for template that matches level, if not found
        //3. use generic template that has no level indication, if not found
        //4. use tgr-default template

        function matchesLevel(templtitle, templLevels) {
            var levels = $tw.utils.parseStringArray(templLevels);
            if (levels.indexOf(level.toString()) !== -1)
                return true;
        }

        if (!template) {
            //Seek filter template
            firstField("_tgr_node_filter", usertemplates, function (val, field, templtitle) {
                var tids = $tw.wiki.filterTiddlers(val);
                if (val && tids.indexOf(title) !== -1) {
                    var templLevels = $tw.wiki.getTiddler(templtitle)
                        .getFieldString("_tgr_node_level");
                    if (templLevels) {
                        //Process level field if it also has one.
                        //Choose template if it also matches level field.
                        if (matchesLevel(templtitle, templLevels)) {
                            template = templtitle;
                            return true;
                        }
                        //This is the template because the filter matched
                        //and it has no _tgr_node_level field
                    } else {
                        template = templtitle;
                        return true;
                    }
                }
            });
        }

        // If not found seek level template
        if (!template) {
            firstField("_tgr_node_level", usertemplates, function (val, field, templtitle) {
                if (matchesLevel(templtitle, val)) {
                    template = templtitle;
                    return true;
                }
            });
        }

        //if not found, Seek template without level or filter
        if (!template) {
            var len = usertemplates.length;
            for (var i = 0; i < len; i++) {
                var tid = $tw.wiki.getTiddler(usertemplates[i]);
                if (tid && !tid.hasField("_tgr_node_level")
                    && !tid.hasField("_tgr_node_filter")) {
                    template = usertemplates[i];
                    break;
                }
            }
        }

        //if nothing found, use default template
        if (!template) template = "tgr-default"

        return template;
    }

    /* Tree node functions
     * - Constructor
     * - addChild
     * - toString
    */
    //Tree node constructor
    function tnode(parent, id, level, widget, collapseDefault) {
        if (!(this instanceof tnode))
            throw "Error: call new tnode(id=" + id + ")";
        this.parent = parent;
        this.id = id;
        this.children = [];
        this.collapse = collapseDefault;
        this.widget = widget;
        this.template = undefined;
        var template = findNodeTemplate(id, level, widget.nodetemplate);
        //Add transcluder tiddler if a template is found
        if (template !== "tgr-default") {
            var text = "{{" + id + "||" + template + "}}";
            var title = "$:/temp/tidgraph/" + widget.tidtree.id + "/" + id;
            this.transcluder = title;
            this.template = template;
            $tw.wiki.addTiddler(new $tw.Tiddler({ "title": title, "text": text }));
            if (widget.templatesInUse.indexOf(template) === -1)
                widget.templatesInUse.push(template); //This is used only for refresh
        }
    }

    //Return child that was added
    tnode.prototype.addChild = function (id, level, widget, collapseDefault) {
        var ch = new tnode(this, id, level, widget, collapseDefault)
        this.children.push(ch)
        return ch;
    }

    tnode.prototype.toString = function () {
        return "tnode(id=" + this.id + ")"
    };


    //Node click event
    tnode.prototype.collapseClickEvent = function (ev) {
        this.collapse = !this.collapse;
        this.widget.paint()
    }

    function printtree(n, skipvisited, getStr) {
        var spaces = "├";
        var getStr = getStr || function (e) { return e.toString() }
        var str = "";
        var a = dfvisit(n, function (n, acc, lvl) {
            spaces = new Array(lvl + 1).join("-")
            str += spaces + getStr(n) + "\n"
            return true
        }, {}, { "skipvisited": skipvisited })
        console.log(str)
    }

    /*********************************************************************
     *                           Testing code                            *
     *********************************************************************/
    /*FIXME:
    var o11 = {id: 'o11', collapse: false, children: [ ] }
    var o12 = {id: 'o12', collapse: false, children: [ ] }
    var o13 = {id: 'o13', collapse: false, children: [ ] }
    var o211 = {id: 'o211', collapse: false, children: [ ] }
    var o212 = {id: 'o212', collapse: false, children: [ ] }
    var o21 = {id: 'o21', collapse: false, children: [ o211, o212 ] }
    var o22 = {id: 'o22', collapse: false, children: [ ] }
    var o3 = {id: 'o3', collapse: false, children: [ ] }
    var o1 = {id: 'o1', collapse: false, children: [ o11, o12, o13 ] }
    var o2 = {id: 'o2', collapse: false, children: [ o21,o22 ] }
    var o = {id: 'o', collapse: false, children: [ o12,o1, o2, o3 ] }
    
    var tidt = makeTidTree(o,{maxdepth:3})
    printtree(o,true,function(n) { return n.id })
    console.log('children of o:',countDescendants(o))
    console.log('children of o not skipping repeats:',countDescendants(o,false))
    console.log('children of o1:',countDescendants(o1))
    console.log('children of tidt o:',countDescendants(tidt))
    console.log('children of tidt o1:',countDescendants(o1)) */
})();