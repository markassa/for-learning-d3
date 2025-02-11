function SampleSelector(bounds, sample_box, locationScales) {
  this.bounds = bounds;
  this.sample_box = sample_box;
  this.locationScales = locationScales;
  this.bar_width = 5;
  this.spill = 20;

  let ten_days = 1000 * 60 * 60 * 24 * 10;
  this.bounds.time_viewbox_max = this.bounds.time_viewbox_min + ten_days;

  this.sample_box.append("g").attr("id", this.getId());
}

SampleSelector.prototype.getId = function() {
  return "sampleSelector";
};

SampleSelector.norm_time = function(time, bounds, box) {
  return (
    ((time - bounds.time_min) / (bounds.time_max - bounds.time_min)) *
    box.attr("width")
  );
};

SampleSelector.reverse_norm_time = function(pixel, bounds, box) {
  return (
    (pixel / box.attr("width")) * (bounds.time_max - bounds.time_min) +
    bounds.time_min
  );
};

SampleSelector.prototype.draw = function() {
  let this_class = this;

  let innerLeft = SampleSelector.norm_time(
    this_class.bounds.time_viewbox_min,
    this_class.bounds,
    this_class.sample_box
  );

  let innerRight = SampleSelector.norm_time(
    this_class.bounds.time_viewbox_max,
    this_class.bounds,
    this_class.sample_box
  );

  this_class.locationScales.drawDayTicks(innerLeft, innerRight);

  let box = this.sample_box.select("#" + this_class.getId());

  box.selectAll("rect").remove();
  box.selectAll("polygon").remove();

  let get_left_bar_coors = function(zero) {
    return [
      [zero - this_class.bar_width - 5, 0],
      [zero, 0],
      [zero, this_class.sample_box.attr("height")],
      [zero - this_class.bar_width, this_class.sample_box.attr("height")],
      [zero - this_class.bar_width, 20],
      [zero - this_class.bar_width - 5, 10]
    ];
  };

  box
    .append("polygon")
    .attr("id", "leftBar")
    .attr("points", function() {
      return get_left_bar_coors(innerLeft)
        .map(function(d) {
          return d.join(",");
        })
        .join(" ");
    })
    .attr("fill", "black")
    .attr("stroke", "none")
    .call(
      d3
        .drag()
        .on("drag", function() {
          let new_innerLeft =
            parseFloat(box.select("#centerRect").attr("x")) + d3.event.dx;

          if (
            new_innerLeft >=
            parseFloat(box.select("#centerRect").attr("x")) +
              parseFloat(box.select("#centerRect").attr("width"))
          ) {
            new_innerLeft =
              parseFloat(box.select("#centerRect").attr("x")) +
              parseFloat(box.select("#centerRect").attr("width")) -
              1;
          } else if (0 >= new_innerLeft + this_class.spill) {
            new_innerLeft = 0 - this_class.spill + 1;
          }

          this_class.locationScales.drawDayTicks(new_innerLeft, innerRight);

          box.select("#leftBar").attr("points", function() {
            return get_left_bar_coors(new_innerLeft)
              .map(function(d) {
                return d.join(",");
              })
              .join(" ");
          });
          box
            .select("#centerRect")
            .attr("x", new_innerLeft)
            .attr("width", innerRight - new_innerLeft);
        })
        .on("end", function() {
          innerLeft = box.select("#centerRect").attr("x");
          this_class.bounds.time_viewbox_min = SampleSelector.reverse_norm_time(
            innerLeft,
            this_class.bounds,
            this_class.sample_box
          );
        })
    );

  let get_right_bar_coors = function(zero) {
    return [
      [zero, 0],
      [zero + this_class.bar_width + 5, 0],
      [zero + this_class.bar_width + 5, 10],
      [zero + this_class.bar_width, 20],
      [zero + this_class.bar_width, this_class.sample_box.attr("height")],
      [zero, this_class.sample_box.attr("height")]
    ];
  };

  box
    .append("polygon")
    .attr("id", "rightBar")
    .attr("points", function() {
      return get_right_bar_coors(innerRight)
        .map(function(d) {
          return d.join(",");
        })
        .join(" ");
    })
    .attr("fill", "black")
    .attr("stroke", "none")
    .call(
      d3
        .drag()
        .on("drag", function() {
          let new_innerRight =
            parseFloat(box.select("#centerRect").attr("x")) +
            parseFloat(box.select("#centerRect").attr("width")) +
            d3.event.dx;

          if (
            parseFloat(box.select("#centerRect").attr("x")) >= new_innerRight
          ) {
            new_innerRight =
              parseFloat(box.select("#centerRect").attr("x")) + 1;
          } else if (
            new_innerRight + this_class.bar_width - this_class.spill >=
            this_class.sample_box.attr("width")
          ) {
            new_innerRight =
              parseFloat(this_class.sample_box.attr("width")) +
              this_class.spill -
              this_class.bar_width -
              1;
          }

          this_class.locationScales.drawDayTicks(innerLeft, new_innerRight);

          box.select("#centerRect").attr("width", new_innerRight - innerLeft);
          box.select("#rightBar").attr("points", function() {
            return get_right_bar_coors(new_innerRight)
              .map(function(d) {
                return d.join(",");
              })
              .join(" ");
          });
        })
        .on("end", function() {
          innerRight =
            parseFloat(box.select("#centerRect").attr("x")) +
            parseFloat(box.select("#centerRect").attr("width"));
          this_class.bounds.time_viewbox_max = SampleSelector.reverse_norm_time(
            innerRight,
            this_class.bounds,
            this_class.sample_box
          );
        })
    );

  // instead of shading the area between bars, what if we shaded the area outside of them?
  box
    .append("rect")
    .attr("id", "centerRect")
    .attr("x", innerLeft)
    .attr("y", 0)
    .attr("width", innerRight - innerLeft)
    .attr("height", this_class.sample_box.attr("height"))
    .attr("fill", "black")
    .style("opacity", 0.5)
    .call(
      d3
        .drag()
        .on("drag", function() {
          let new_innerLeft =
            parseFloat(box.select("#centerRect").attr("x")) + d3.event.dx;
          let new_innerRight =
            parseFloat(box.select("#centerRect").attr("x")) +
            parseFloat(box.select("#centerRect").attr("width")) +
            d3.event.dx;

          if (0 >= new_innerLeft + this_class.spill) {
            new_innerLeft = 0 - this_class.spill + 1;
            new_innerRight =
              new_innerLeft +
              parseFloat(box.select("#centerRect").attr("width"));
          } else if (
            new_innerRight + this_class.bar_width - this_class.spill >=
            this_class.sample_box.attr("width")
          ) {
            new_innerRight =
              parseFloat(this_class.sample_box.attr("width")) +
              this_class.spill -
              this_class.bar_width -
              1;
            new_innerLeft =
              new_innerRight - box.select("#centerRect").attr("width");
          }

          this_class.locationScales.drawDayTicks(new_innerLeft, new_innerRight);

          box.select("#leftBar").attr("points", function() {
            return get_left_bar_coors(new_innerLeft)
              .map(function(d) {
                return d.join(",");
              })
              .join(" ");
          });
          box.select("#centerRect").attr("x", new_innerLeft);
          box.select("#rightBar").attr("points", function() {
            return get_right_bar_coors(new_innerRight)
              .map(function(d) {
                return d.join(",");
              })
              .join(" ");
          });
        })
        .on("end", function() {
          innerLeft = box.select("#centerRect").attr("x");
          this_class.bounds.time_viewbox_min = SampleSelector.reverse_norm_time(
            innerLeft,
            this_class.bounds,
            this_class.sample_box
          );
          innerRight =
            parseFloat(box.select("#centerRect").attr("x")) +
            parseFloat(box.select("#centerRect").attr("width"));
          this_class.bounds.time_viewbox_max = SampleSelector.reverse_norm_time(
            innerRight,
            this_class.bounds,
            this_class.sample_box
          );
        })
    );
};

SampleSelector.prototype.updateBounds = function() {
  this.bounds.time_viewbox_lag_min = this.bounds.time_viewbox_min;
  this.bounds.time_viewbox_lag_max = this.bounds.time_viewbox_max;
};
