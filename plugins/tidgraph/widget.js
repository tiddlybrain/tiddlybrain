/*\
title: $:/plugins/ihm/widgets/tidgraph.js
type: application/javascript
module-type: widget

Tidgraph widget to render HTML5/SVG graph of tiddlers

\*/
(function () {

    /*jslint node: true, browser: true */
    /*global $tw: false */
    "use strict";

    var Widget = require("$:/core/modules/widgets/widget.js").widget;

    var TidgraphWidget = function (parseTreeNode, options) {
        this.initialise(parseTreeNode, options);
    };

    var utils = require("$:/plugins/ihm/tidgraph/utils.js");

    /*Inherit from the base widget class */
    TidgraphWidget.prototype = new Widget();

    /*
    Render this widget into the DOM
    */
    TidgraphWidget.prototype.render = function (parent, nextSibling) {

        //Delete temp tiddlers if this widget had some
        if (this.tidtree)
            this.delTempTiddlers();

        //Start new rendering
        this.parentDomNode = parent;
        this.nextSiblingDomNode = nextSibling;
        this.computeAttributes();
        this.execute();

        //Read mode from tiddler with named $:/config/tidgraph/modes/<<mode>>
        //if it is not a default mode
        if (["tagging", "linking"].indexOf(this.mode) === -1) {
            var m = $tw.wiki.getTiddlerText("$:/config/tidgraph/modes/" + this.mode);
            this.mode = m || this.mode; //Use parameter as filter if tiddler doesn't exist
        }

        this.tidtree = [];
        this.tidtree.mode = this.mode;
        this.tidtree.maxdepth = this.maxdepth;
        this.tidtree.startat = this.startat;
        this.tidtree.nodetitle = this.nodetitle;
        this.tidtree.tooltip = this.tooltip;
        this.tidtree.filter = this.filter;
        this.tidtree.nocollapse = this.nocollapse;
        this.tidtree.document = this.document;
        this.tidtree.nodetemplate = this.nodetemplate;
        this.tidtree.layout = this.layout;
        this.tidtree.collapseDefault = this.collapseDefault;

        //templatesInUse is used for refresh only
        this.templatesInUse = $tw.utils.parseStringArray(this.nodetemplate);


        this.tidtree.id = (new Date()).valueOf();

        //Don't output anything if root tiddler doesn't exist
        if (!$tw.wiki.getTiddler(this.startTid)) return;

        // Create container divs
        //    Widget div
        this.div = this.document.createElement("div");
        this.div.className = "tgr-container tgr";

        //    Table div
        this.tablediv = this.document.createElement("div");
        this.tablediv.className = "ihm-tgr-tablediv";
        this.table = undefined;
        this.div.appendChild(this.tablediv);

        //    SVG div
        this.svgdiv = this.document.createElement("div");
        this.svgdiv.className = "tgr-svg-int";
        this.div.appendChild(this.svgdiv);

        this.parentDomNode.insertBefore(this.div, this.nextSiblingDomNode);
        this.domNodes.push(this.div);

        //Build tidtree from tiddlers
        this.tidtree.root = utils.makeTidTree(this.startTid, this.tidtree, { "widget": this })
        this.paint();

        var timeOut = null;
        var self = this;

        var resize_updateSVG = function () {
            self.svgdiv.innerHTML = utils.buildSVG(self.tablediv, self.tidtree);
            if (self.oldresize) self.oldresize();
        }

        var scroll_updateSVG = function () {
            self.svgdiv.innerHTML = utils.buildSVG(self.tablediv, self.tidtree);
        }

        this.div.onscroll = function () {
            if (!self.scroll_to) clearTimeout(self.scroll_to);
            self.scroll_to = setTimeout(scroll_updateSVG, 100);
        }

        if (!this.onresize_updated) {
            //Handle window resize
            if (window.onresize && this.oldresize == undefined)
                this.oldresize = window.onresize;

            window.onresize = function () {
                if (!self.resize_to) clearTimeout(self.resize_to);
                self.resize_to = setTimeout(resize_updateSVG, 100);
            }
            this.onresize_updated = true;
        }

        //DEBUG console.log("widget = ",this);
    }

    //Delete temporary tiddlers used for node content transclusion
    TidgraphWidget.prototype.delTempTiddlers = function () {
        var tmptids = $tw.wiki.filterTiddlers("[prefix[$:/temp/tidgraph/"
            + this.tidtree.id + "]]");
        $tw.utils.each(tmptids, function (tid) {
            $tw.wiki.deleteTiddler(tid);
        });
    }

    TidgraphWidget.prototype.paint = function () {
        //We need to redraw arrows if sidebar is closed/opened
        //this variable is used to check if sidebar status has changed on refresh
        this.sidebar = $tw.wiki.getTiddlerText("$:/state/sidebar");

        // Construct a table starting at the root tiddler
        var tbl = utils.buildTable(this.startTid, this.tidtree);

        // Add/replace the table and the SVG in the DOM 
        if (this.table) this.tablediv.replaceChild(tbl, this.table);
        else this.tablediv.appendChild(tbl);

        this.svgdiv.innerHTML = utils.buildSVG(this.tablediv, this.tidtree);

        this.table = tbl;
    }

    /*
    Compute the internal state of the widget
    */
    TidgraphWidget.prototype.execute = function () {
        // Get parameters from our attributes
        this.startTid = this.getAttribute("start");
        this.mode = this.getAttribute("mode", "tagging");
        this.maxdepth = parseInt(this.getAttribute("maxdepth", "10"));
        this.startat = this.getAttribute("startat", "0");
        this.nodetitle = this.getAttribute("nodetitle");
        this.tooltip = this.getAttribute("tooltip", "summary");
        this.filter = this.getAttribute("filter", "[!is[system]]");
        this.nocollapse = this.hasAttribute("nocollapse");
        this.nodetemplate = this.getAttribute("nodetemplate", "");
        this.layout = this.getAttribute("layout", "E");
        this.collapseDefault = (this.getAttribute("collapseDefault") === "yes") ? true : false;
        if (["E", "S"].indexOf(this.layout) == -1) this.layout = "E";

        // FIXME: We could build the descendant tree here?
    };

    /*
    Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
    */
    TidgraphWidget.prototype.refresh = function (changedTiddlers) {
        //DEBUG   console.log("changedtiddlers=",changedTiddlers);

        var dirty = false, t;
        this.computeAttributes();
        this.execute();
        var self = this;

        function isTemplate(t) {
            return self.templatesInUse.indexOf(t) !== -1;
        }

        function isStylesheet(t) {
            var tid = $tw.wiki.getTiddler(t);
            if (tid && tid.hasTag("$:/tags/Stylesheet")) return true;
            return false;
        }

        function isInDom(t) {
            return document.getElementById(self.tidtree.id + '-' +
                encodeURIComponent(t));
        }

        function isDescendant(t) {
            return utils.isDescendant(t, self.startTid, self.tidtree);
        }

        function isMode(t) {
            return (t.indexOf("$:/config/tidgraph/modes") !== -1);
        }

        //Set dirty flag if children have changed
        for (t in changedTiddlers) {
            if (isInDom(t) ||  //for node deletion/change
                isDescendant(t) ||  //for node addition 
                isTemplate(t) ||  //for nodetemplate
                isStylesheet(t) ||  //for CSS stylesheet
                isMode(t)            //for mode tiddlers
            ) {
                //DEBUG console.log(`change triggered by "${t}"`);
                dirty = true;
                break;
            }
        }

        // Refresh if sidebar has been closed/opened since previous rendering
        var sb = $tw.wiki.getTiddlerText("$:/state/sidebar")
        if (sb !== this.sidebar)
            //dirty = true;
            this.paint();

        //Refresh if dirty
        if (dirty) {
            this.refreshSelf();
            return true;
        } else {
            return false;
        }
    };

    exports.tidgraph = TidgraphWidget;

})();