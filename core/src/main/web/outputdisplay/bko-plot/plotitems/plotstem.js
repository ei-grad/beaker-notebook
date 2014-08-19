/*
*  Copyright 2014 TWO SIGMA OPEN SOURCE, LLC
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*         http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/

(function() {
  'use strict';
  var retfunc = function(plotUtils) {
    var PlotStem = function(data) {
      this.elements = data.elements;
      delete data.elements;
      $.extend(true, this, data);
      this.format();

      if (this.color != null) {
        this.tip_color = plotUtils.createColor(this.color, this.color_opacity);
      } else {
        this.tip_color = "gray";
      }
    };

    PlotStem.prototype.render = function(scope) {
      if (this.shown === false) {
        this.clear(scope);
        return;
      }
      this.filter(scope);
      this.prepare(scope);
      if (this.vlength === 0) {
        this.clear(scope);
      } else {
        this.draw(scope);
      }
    };

    PlotStem.prototype.getRange = function() {
      var eles = this.elements;
      var range = {
        xl : 1E100,
        xr : -1E100,
        yl : 1E100,
        yr : -1E100
      };
      for (var i = 0; i < eles.length; i++) {
        var ele = eles[i];
        range.xl = Math.min(range.xl, ele.x);
        range.xr = Math.max(range.xr, ele.x);
        range.yl = Math.min(range.yl, ele.y);
        range.yr = Math.max(range.yr, ele.y2);
      }
      return range;
    };

    PlotStem.prototype.applyAxis = function(xAxis, yAxis) {
      this.xAxis = xAxis;
      this.yAxis = yAxis;
      for (var i = 0; i < this.elements.length; i++) {
        var ele = this.elements[i];
        ele.x = xAxis.getPercent(ele.x);
        ele.y = yAxis.getPercent(ele.y);
        ele.y2 = yAxis.getPercent(ele.y2);
      }
      this.createTips();
    };

    PlotStem.prototype.createTips = function() {
      var xAxis = this.xAxis,
          yAxis = this.yAxis;
      for (var i = 0; i < this.elements.length; i++) {
        var ele = this.elements[i];
        var txt = "";
        var valx = plotUtils.getTipString(ele._x, xAxis, true),
            valy = plotUtils.getTipString(ele._y, yAxis, true),
            valy2 = plotUtils.getTipString(ele._y2, yAxis, true);

        var tip = {};
        if (this.legend != null) {
          tip.title = this.legend;
        }
        tip.x = valx;
        tip.y = valy;
        tip.y2 = valy2;

        this.elementProps[i].t_txt = plotUtils.createTipString(tip);
      }
    };

    PlotStem.prototype.format = function() {

      this.itemProps = {
        "id" : this.id,
        "iidx" : this.index,
        "eidx" : i,
        "cls" : "plot-stem",
        "st" : this.color,
        "st_op": this.color_opacity,
        "st_w": this.width,
        "st_da": this.stroke_dasharray
      };

      this.elementProps = [];
      for (var i = 0; i < this.elements.length; i++) {
        var ele = this.elements[i];
        var stem = {
          "id" : this.id + "_" + i,
          "cls" : "plot-resp",
          "st" : ele.color,
          "st_op": ele.color_opacity,
          "st_w" : ele.width,
          "st_da": ele.stroke_dasharray,
          "t_txt" : ele.tip_text,
          "t_clr" : plotUtils.createColor(this.color, this.color_opacity)
        };
        this.elementProps.push(stem);
      }

      this.pipe = [];
    };

    PlotStem.prototype.filter = function(scope) {
      var eles = this.elements;
      var l = plotUtils.upper_bound(eles, "x", scope.focus.xl) + 1,
          r = plotUtils.upper_bound(eles, "x2", scope.focus.xr);

      l = Math.max(l, 0);
      r = Math.min(r, eles.length - 1);

      if (l > r || l == r && eles[l].x2 < scope.focus.xl) {
        // nothing visible, or all elements are to the left of the svg, vlength = 0
        l = 0;
        r = -1;
      }
      this.vindexL = l;
      this.vindexR = r;
      this.vlength = r - l + 1;
    };

    PlotStem.prototype.prepare = function(scope) {
      var eles = this.elements, eleprops = this.elementProps;
      var mapX = scope.data2scrX, mapY = scope.data2scrY;

      this.pipe.length = 0;
      for (var i = this.vindexL; i <= this.vindexR; i++) {
        var ele = eles[i];
        _(eleprops[i]).extend({
          "x1" : mapX(ele.x),
          "y1" : mapY(ele.y),
          "x2" : mapX(ele.x),
          "y2" : mapY(ele.y2),
          "t_x" : mapX(ele.x),
          "t_y" : mapY(ele.y)
        });
        this.pipe.push(eleprops[i]);
      }
    };

    PlotStem.prototype.draw = function(scope) {
      var svg = scope.maing;
      var props = this.itemProps,
          pipe = this.pipe;

      if (svg.select("#" + this.id).empty()) {
        svg.selectAll("g")
          .data([props], function(d) { return d.id; }).enter().append("g")
          .attr("id", function(d) { return d.id; })
          .attr("class", function(d) { return d.cls; })
          .style("stroke", function(d) { return d.st; })
          .style("stroke-opacity", function(d) { return d.st_op; })
          .style("stroke-dasharray", function(d) { return d.st_da; })
          .style("stroke-width", function(d) { return d.st_w; });
      }

      var itemsvg = svg.select("#" + this.id);
      itemsvg.selectAll("line")
        .data(pipe, function(d) { return d.id; }).exit().remove();
      itemsvg.selectAll("line")
        .data(pipe, function(d) { return d.id; }).enter().append("line")
        .attr("id", function(d) { return d.id; })
        .attr("class", function(d) { return d.cls; })
        .style("stroke", function(d) { return d.st; })
        .style("stroke-opacity", function(d) { return d.st_op; })
        .style("stroke-dasharray", function(d) { return d.st_da; })
        .style("stroke-width", function(d) { return d.st_da; });
      itemsvg.selectAll("line")
        .data(pipe, function(d) { return d.id; })
        .attr("x1", function(d) { return d.x1; })
        .attr("x2", function(d) { return d.x2; })
        .attr("y1", function(d) { return d.y1; })
        .attr("y2", function(d) { return d.y2; });
    };

    PlotStem.prototype.clear = function(scope) {
      scope.maing.select("#" + this.id).remove();
    };

    return PlotStem;
  };
  beaker.bkoFactory('PlotStem', ['plotUtils', retfunc]);
})();