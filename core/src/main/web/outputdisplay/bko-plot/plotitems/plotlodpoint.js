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
    var PlotLodPoint = function(data){

      this.lodTypeIndex = 0;

      this.elements = data.elements;  // prevent copy elements
      delete data.elements;
      $.extend(true, this, data); // copy properties to itself

      this.format();

      this.sampleStep = -1;
      this.zoomHash = plotUtils.randomString(3);

      if (this.color != null) {
        this.tip_color = plotUtils.createColor(this.color, this.color_opacity);
      } else {
        this.tip_color = "gray";
      }
    };

    PlotLodPoint.prototype.respclass = "plot-resp plot-respdot";

    PlotLodPoint.prototype.render = function(scope, samples){
      this.elementSamples = samples;
      this.prepare(scope);
      this.draw(scope);
    };

    PlotLodPoint.prototype.zoomLevelChanged = function() {
      this.zoomHash = plotUtils.randomString(3);
    };

    PlotLodPoint.prototype.format = function() {
      this.itemProps = {
        "id" : this.id,
        "cls" : "plot-line",
        "st" : this.color,
        "st_op" : this.color_opacity,
        "st_w" : this.width,
        "st_da" : this.stroke_dasharray,
        "d" : ""
      };
      this.elementProps = [];
    };

    PlotLodPoint.prototype.prepare = function(scope) {
      var focus = scope.focus;
      var eleprops = this.elementProps;
      var mapX = scope.data2scrX,
          mapY = scope.data2scrY;
      var pstr = "", skipped = false;

      eleprops.length = 0;

      var samples = this.elementSamples;
      for (var i = 0; i < samples.length; i++) {
        var ele = samples[i];
        if (i === 0) {
          pstr += "M";
        } else if (i === 1) {
          pstr += "L";
        }
        var x = mapX(ele.x), y = mapY(ele.y);
        if (Math.abs(x) > 1E6 || Math.abs(y) > 1E6) {
          skipped = true;
          break;
        }

        var nxtp = x + "," + y + " ";

        if (focus.yl <= ele.y && ele.y <= focus.yr) {
          var hashid = this.id + "_" + this.zoomHash + "_" + ele.hash;

          var prop = {
            "id" : hashid,
            "iidx" : this.index,
            "eidx" : i,
            "cls" : this.respclassDot,
            "isresp" : true,
            "cx" : x,
            "cy" : y,
            "r" : 5,
            "t_x" : x,
            "t_y" : y,
            "op" : scope.tips[hashid] == null ? 0 : 1
          };
          eleprops.push(prop);
        }

        if (i < samples.length - 1) {
          if (this.interpolation === "none") {
            var ele2 = samples[i + 1];
            nxtp += x + "," + y + " " + mapX(ele2.x) + "," + y + " ";
          } else if (this.interpolation === "curve") {
            // TODO curve implementation
          }
        }

        pstr += nxtp;
      }

      if (skipped === true) {
        console.error("data not shown due to too large coordinate");
      }
      if (pstr.length > 0) {
        this.itemProps.d = pstr;
      }
    };

    PlotLodPoint.prototype.draw = function(scope) {
      var svg = scope.maing;
      var props = this.itemProps,
          eleprops = this.elementProps;

      if (svg.select("#" + this.id).empty()) {
        svg.selectAll("g")
          .data([props], function(d){ return d.id; }).enter().append("g")
          .attr("id", function(d) { return d.id; });
      }

      var itemsvg = svg.select("#" + this.id);

      itemsvg.selectAll("path")
        .data([props]).enter().append("path")
        .attr("class", function(d) { return d.cls; })
        .style("stroke", function(d) { return d.st; })
        .style("stroke-dasharray", function(d) { return d.st_da; })
        .style("stroke-width", function(d) { return d.st_w; })
        .style("stroke-opacity", function(d) { return d.st_op; });
      itemsvg.select("path")
        .attr("d", props.d);

      var item = this;
      if (scope.stdmodel.useToolTip === true) {
        itemsvg.selectAll("circle")
          .data(eleprops, function(d) { return d.id; }).exit().remove();
        itemsvg.selectAll("circle")
          .data(eleprops, function(d) { return d.id; }).enter().append("circle")
          .attr("id", function(d) { return d.id; })
          .attr("class", function(d) { return d.cls; })
          .style("stroke", item.tip_color);
        itemsvg.selectAll("circle")
          .data(eleprops, function(d) { return d.id; })
          .attr("cx", function(d) { return d.cx; })
          .attr("cy", function(d) { return d.cy; })
          .attr("r", function(d) { return d.r; })
          .style("opacity", function(d) { return d.op; });
      }
    };

    return PlotLodPoint;
  };
  beaker.bkoFactory('PlotLodPoint', ['plotUtils', retfunc]);
})();
