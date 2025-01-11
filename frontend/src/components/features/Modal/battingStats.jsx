import {
  fetchBattingStats,
  fetchPitchTrends,
  fetchSprayChartData,
  fetchZoneHeatmapData,
} from "@/services/battinginfoService";
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

const hitTypeColors = {
  SINGLE: "#F94144", // Red
  DOUBLE: "#277DA1", // Blue
  TRIPLE: "#F9C74F", // Yellow
  "HOME RUN": "#FF69B4", // Pink
};

const BattingStats = ({ playerId }) => {
  const [battingData, setBattingData] = useState(null);
  const [sprayChartData, setSprayChartData] = useState([]);
  const [zoneHeatmapData, setZoneHeatmapData] = useState(null);
  const [pitchTrendsData, setPitchTrendsData] = useState([]);
  const [viewType, setViewType] = useState("percentage");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sprayChartRef = useRef(null);
  const pitchPctHeatmapRef = useRef(null);
  const totalPitchesHeatmapRef = useRef(null);
  const swingPctHeatmapRef = useRef(null);
  const swingsByZoneHeatmapRef = useRef(null);
  const kPctHeatmapRef = useRef(null);
  const whiffPctHeatmapRef = useRef(null);
  const pitchTrendsRef = useRef(null);

  const drawSprayChart = (data) => {
    const svg = d3.select(sprayChartRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 500;
    const margin = { top: 40, right: 40, bottom: 10, left: 40 };

    const svgContainer = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height - margin.bottom})`);

    svgContainer
      .append("rect")
      .attr("x", -width / 2)
      .attr("y", -height)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#1c1c22");

    const fieldRadius = 350;
    const inFieldRadius = 95;

    const outfieldPath = d3.path();
    outfieldPath.moveTo(0, 0);
    outfieldPath.lineTo(
      fieldRadius * Math.sin(Math.PI / 4),
      -fieldRadius * Math.cos(Math.PI / 4)
    );
    outfieldPath.arc(0, 0, fieldRadius, -Math.PI / 4, (-3 * Math.PI) / 4, true);
    outfieldPath.lineTo(0, 0);

    svgContainer
      .append("path")
      .attr("d", outfieldPath.toString())
      .attr("fill", "#242424")
      .attr("stroke", "#333")
      .attr("stroke-width", 1);

    const inFieldPath = d3.path();
    inFieldPath.moveTo(0, 0);
    inFieldPath.lineTo(
      inFieldRadius * Math.sin(Math.PI / 4),
      -inFieldRadius * Math.cos(Math.PI / 4)
    );
    inFieldPath.lineTo(0, -inFieldRadius * 1.4);
    inFieldPath.lineTo(
      -inFieldRadius * Math.sin(Math.PI / 4),
      -inFieldRadius * Math.cos(Math.PI / 4)
    );
    inFieldPath.closePath();

    svgContainer
      .append("path")
      .attr("d", inFieldPath.toString())
      .attr("fill", "none")
      .attr("stroke", "#333")
      .attr("stroke-width", 1);

    [334, 396, 334].forEach((distance, i) => {
      const angle = ((i - 1) * Math.PI) / 4;
      const x = (fieldRadius - 20) * Math.sin(angle);
      const y = -(fieldRadius - 20) * Math.cos(angle);

      svgContainer
        .append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .attr("fill", "#666")
        .style("font-size", "14px")
        .text(distance);
    });

    const existingHitTypes = [...new Set(data.map((hit) => hit.type))];

    data.forEach((hit) => {
      const radians = (hit.hit_angle * Math.PI) / 180;
      const scaledDistance = (hit.distance / 400) * fieldRadius;

      const x = scaledDistance * Math.sin(radians);
      const y = -scaledDistance * Math.cos(radians);

      svgContainer
        .append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 5)
        .attr("fill", hitTypeColors[hit.type])
        .attr("opacity", 0.8)
        .style("cursor", "pointer")
        .on("mouseover", function (event) {
          d3.select(this)
            .attr("r", 8)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .style("cursor", "pointer");
          let tooltip = svgContainer.select(".tooltip");
          if (tooltip.empty()) {
            tooltip = svgContainer
              .append("g")
              .attr("class", "tooltip")
              .style("pointer-events", "none");

            tooltip
              .append("rect")
              .attr("class", "tooltip-bg")
              .attr("width", 160)
              .attr("height", 100)
              .attr("fill", "#1a1a1a")
              .attr("rx", 4)
              .attr("stroke", hitTypeColors[hit.type]);

            tooltip.append("text").attr("class", "tooltip-type");
            tooltip.append("text").attr("class", "tooltip-distance");
            tooltip.append("text").attr("class", "tooltip-exit-velo");
            tooltip.append("text").attr("class", "tooltip-launch");
            tooltip.append("text").attr("class", "tooltip-game-date");
          }

          tooltip.attr("transform", `translate(${x}, ${y - 70})`);

          tooltip.select(".tooltip-bg").attr("x", -80).attr("y", -42.5);

          tooltip
            .select(".tooltip-type")
            .attr("x", 0)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .attr("fill", "#fff")
            .style("font-size", "12px")
            .text(hit.type.charAt(0) + hit.type.slice(1).toLowerCase());

          tooltip
            .select(".tooltip-game-date")
            .attr("x", 0)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .attr("fill", "#fff")
            .style("font-size", "12px")
            .text(`Date: ${hit.game_date}`);

          tooltip
            .select(".tooltip-distance")
            .attr("x", 0)
            .attr("y", 10)
            .attr("text-anchor", "middle")
            .attr("fill", "#fff")
            .style("font-size", "12px")
            .text(`Distance: ${hit.distance.toFixed(0)} ft`);

          tooltip
            .select(".tooltip-exit-velo")
            .attr("x", 0)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("fill", "#fff")
            .style("font-size", "12px")
            .text(`Exit Velo: ${hit.exit_speed.toFixed(1)} mph`);

          tooltip
            .select(".tooltip-launch")
            .attr("x", 0)
            .attr("y", 50)
            .attr("text-anchor", "middle")
            .attr("fill", "#fff")
            .style("font-size", "12px")
            .text(`Launch: ${hit.launch_angle.toFixed(1)}°`);
        })
        .on("mouseout", function () {
          d3.select(this).attr("r", 5).attr("stroke", "none");
          svgContainer.select(".tooltip").remove();
        });
    });

    const legend = svgContainer
      .append("g")
      .attr(
        "transform",
        `translate(${fieldRadius - 50}, ${-fieldRadius - 100})`
      );

    existingHitTypes.forEach((type, i) => {
      const legendItem = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 25})`);

      legendItem
        .append("circle")
        .attr("r", 6)
        .attr("fill", hitTypeColors[type]);

      legendItem
        .append("text")
        .attr("x", 15)
        .attr("y", 4)
        .attr("fill", "#888")
        .style("font-size", "12px")
        .text(type.charAt(0) + type.slice(1).toLowerCase());
    });
  };

  const drawHeatmap = (data, containerRef, title, type = "pitch_percent") => {
    const svg = d3.select(containerRef.current);
    svg.selectAll("*").remove();

    const gridSize = 90;
    const size = gridSize * 3;
    const plateExtraHeight = 60; 
    const margin = {
      top: 40,
      right: 20,
      bottom: 40 + plateExtraHeight,
      left: 20,
    };
    const width = size + margin.left + margin.right;
    const height = size + margin.top + margin.bottom;

    const svgContainer = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    svgContainer
      .append("text")
      .attr("x", size / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("fill", "#fff")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(title);

    let colorScale;
    if (type === "k_percent") {
      colorScale = d3
        .scaleSequential()
        .domain([0, 100])
        .interpolator(d3.interpolateReds);
    } else if (type === "total_pitches") {
      colorScale = d3
        .scaleSequential()
        .domain([0, 75])
        .interpolator(d3.interpolateBlues);
    } else if (type === "swings") {
      colorScale = d3
        .scaleSequential()
        .domain([0, 51])
        .interpolator(d3.interpolateBlues);
    } else {
      colorScale = d3
        .scaleSequential()
        .domain([0, 100])
        .interpolator(d3.interpolateBlues);
    }

    const zoneGroup = svgContainer.append("g");

    zoneGroup
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", size)
      .attr("height", size)
      .attr("fill", "#1c1c22")
      .attr("stroke", "#333")
      .attr("stroke-width", 2);

    const cells = zoneGroup
      .selectAll(".cell")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "cell")
      .attr(
        "transform",
        (d) => `translate(${d.x * gridSize}, ${(2 - d.z) * gridSize})`
      );

    cells
      .append("rect")
      .attr("width", gridSize)
      .attr("height", gridSize)
      .attr("fill", (d) => {
        let value;
        switch (type) {
          case "total_pitches":
            value = d.total_pitches;
            break;
          case "swings":
            value = d.swings;
            break;
          case "swing_percent":
            value = d.swing_percent;
            break;
          case "k_percent":
            value = d.k_percent;
            break;
          case "whiff_percent":
            value = d.whiff_percent;
            break;
          default:
            value = d.pitch_percent;
        }
        return colorScale(value || 0);
      })
      .attr("stroke", "#333")
      .attr("stroke-width", 1);

    cells
      .append("text")
      .attr("x", gridSize / 2)
      .attr("y", gridSize / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("fill", (d) => {
        let value;
        switch (type) {
          case "total_pitches":
            value = d.total_pitches;
            break;
          case "swings":
            value = d.swings;
            break;
          default:
            value = d[`${type}`];
        }
        const cellColor = colorScale(value || 0);
        const rgb = d3.rgb(cellColor);
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 128 ? "#000" : "#fff";
      })
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text((d) => {
        switch (type) {
          case "total_pitches":
            return d.total_pitches || "0";
          case "swings":
            return d.swings || "0";
          case "swing_percent":
          case "k_percent":
          case "whiff_percent":
            return `${d[type] || 0}%`;
          default:
            return `${d.pitch_percent || 0}%`;
        }
      });

    const plateWidth = gridSize * 1.5;
    const plateMiddleWidth = plateWidth * 1;
    const plateHeight = plateWidth * 0.3;
    const totalHeight = plateHeight * 1.5;

    const homePlateGroup = svgContainer
      .append("g")
      .attr("transform", `translate(0, ${size + 15})`);

    homePlateGroup
      .append("path")
      .attr(
        "d",
        `
        M${size / 2 - plateWidth / 2},0
        L${size / 2 - plateMiddleWidth / 2},${plateHeight}
        L${size / 2},${totalHeight}
        L${size / 2 + plateMiddleWidth / 2},${plateHeight}
        L${size / 2 + plateWidth / 2},0
        Z
        `
      )
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", 2);
  };

  const drawPitchTrends = (data, type) => {
    const svg = d3.select(pitchTrendsRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 120, bottom: 100, left: 60 };
    const width = 950 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svgContainer = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom + 40)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    svgContainer
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "none")
      .attr("stroke", "none")
      .style("opacity", 0.5);

    const dates = data.map((d) => {
      const parts = d.date.split("-");
      return `Jul ${parts[2].padStart(2, "0")}`;
    });

    const maxPercentage =
      type === "quantity"
        ? d3.max(data, (d) => Math.max(d.Fastball, d.Breaking, d.Offspeed))
        : d3.max(data, (d) =>
            Math.max(d.FastballPct, d.BreakingPct, d.OffspeedPct)
          );

    const yAxisMax =
      type === "quantity" ? maxPercentage : Math.ceil(maxPercentage / 10) * 10;

    const xScale = d3
      .scalePoint()
      .domain(data.map((d) => `Jul ${d.date.split("-")[2]}`))
      .range([0, width])
      .padding(0.7);

    const yScale = d3
      .scaleLinear()
      .domain([0, yAxisMax])
      .range([height, 0])
      .nice();

    const lineTypes = [
      { key: "Fastball", color: "#F94144" },
      { key: "Breaking", color: "#4B91DD" },
      { key: "Offspeed", color: "#00ff00" },
    ];

    const tooltipContainer = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "#1a1a1a")
      .style("border", "2px solid")
      .style("border-radius", "4px")
      .style("padding", "8px 12px")
      .style("pointer-events", "none")
      .style("font-size", "14px")
      .style("color", "white")
      .style("transform", "translate(-50%, -100%)")
      .style("z-index", 1000);

    lineTypes.forEach(({ key, color }) => {
      const validData = data.filter((d) =>
        type === "quantity" ? d[key] > 0 : d[`${key}Pct`] > 0
      );
      const line = d3
        .line()
        .x((d) => xScale(`Jul ${d.date.split("-")[2]}`))
        .y((d) => yScale(type === "quantity" ? d[key] : d[`${key}Pct`]))
        .curve(d3.curveMonotoneX);

      svgContainer
        .append("path")
        .datum(validData)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2)
        .attr("d", line);

      svgContainer
        .selectAll(`.dot-${key}`)
        .data(validData)
        .enter()
        .append("circle")
        .attr("class", `dot-${key}`)
        .attr("cx", (d) => xScale(`Jul ${d.date.split("-")[2]}`))
        .attr("cy", (d) =>
          yScale(type === "quantity" ? d[key] : d[`${key}Pct`])
        )
        .attr("r", 5)
        .attr("fill", color)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          const value = type === "quantity" ? d[key] : d[`${key}Pct`];

          const dot = d3.select(this);
          const dotX = dot.attr("cx");
          const dotY = dot.attr("cy");

          const svgRect = svg.node().getBoundingClientRect();
          const pageX = svgRect.left + parseFloat(dotX) + margin.left;
          const pageY = svgRect.top + parseFloat(dotY) + margin.top;

          dot.attr("r", 8).style("stroke", "white").style("stroke-width", 2);

          tooltipContainer
            .style("visibility", "visible")
            .style("border-color", color)
            .style("left", `${pageX + window.pageXOffset}px`)
            .style("top", `${pageY + window.pageYOffset - 15}px`)
            .html(
              `
              <div style="font-weight: bold;">${d.date}</div>
              <div>${key}: ${value}${type === "quantity" ? "" : "%"}</div>
              ${
                type === "quantity"
                  ? `<div>Total Pitches: ${d.total}</div>`
                  : ""
              }
              `
            );
        })
        .on("mouseout", function () {
          d3.select(this).attr("r", 5).style("stroke", "none");
          tooltipContainer.style("visibility", "hidden");
        });
    });

    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat((d) => d)
      .tickValues(dates.filter((d, i) => i % 2 === 0));
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(10)
      .tickFormat((d) => d);

    svgContainer
      .append("g")
      .attr("class", "x-axis") 
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis)
      .selectAll("text") 
      .style("fill", "#6b7280");

    svgContainer
      .append("text")
      .attr("class", "x-axis-label")
      .attr("x", width / 2) 
      .attr("y", height + margin.bottom - 60) 
      .attr("text-anchor", "middle")
      .style("fill", "#6b7280")
      .style("font-size", "14px")
      .text("Date"); 

    svgContainer.selectAll(".x-axis .domain").style("stroke", "#6b7280");
    svgContainer.selectAll(".x-axis .tick line").style("stroke", "#6b7280");

    svgContainer
      .append("g")
      .attr("class", "y-axis") 
      .call(yAxis)
      .selectAll("text") 
      .style("fill", "#6b7280");

    svgContainer
      .append("text")
      .attr("class", "y-axis-label")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 20)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .style("fill", "#6b7280")
      .style("font-size", "14px")
      .text(type === "quantity" ? "Pitch Usage (#)" : "Pitch Usage (%)");

    svgContainer.selectAll(".y-axis .domain").style("stroke", "#6b7280");
    svgContainer.selectAll(".y-axis .tick line").style("stroke", "#6b7280");

    const legend = svgContainer
      .append("g")
      .attr("transform", `translate(${width + 10}, 10)`);

    lineTypes.forEach((type, i) => {
      const legendItem = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 25})`);

      legendItem
        .append("line")
        .attr("x1", 0)
        .attr("x2", 20)
        .attr("y1", 9)
        .attr("y2", 9)
        .style("stroke", type.color)
        .style("stroke-width", 2);

      legendItem
        .append("circle")
        .attr("cx", 10)
        .attr("cy", 9)
        .attr("r", 4)
        .style("fill", type.color);

      legendItem
        .append("text")
        .attr("x", 30)
        .attr("y", 13)
        .text(type.key)
        .style("font-size", "12px")
        .style("fill", "#6b7280");
    });

    const pitchTypeText = svg
      .append("text")
      .attr("text-anchor", "middle") 
      .attr("x", (width + margin.left + margin.right) / 2) 
      .attr("y", height + margin.bottom) 
      .style("font-size", "14px")
      .style("font-family", "Arial")
      .style("fill", "#fff");

    pitchTypeText
      .append("tspan")
      .attr("x", (width + margin.left + margin.right) / 2) 
      .attr("dy", "1.2em") 
      .style("fill", "#F94144")
      .text("Fastball: 4 Seam, 2 Seam, Cutter, Sinker");

    pitchTypeText
      .append("tspan")
      .attr("x", (width + margin.left + margin.right) / 2) 
      .attr("dy", "1.2em") 
      .style("fill", "#00ff00")
      .text("Offspeed: Split, Change");

    pitchTypeText
      .append("tspan")
      .attr("x", (width + margin.left + margin.right) / 2) 
      .attr("dy", "1.2em") 
      .style("fill", "#4B91DD")
      .text("Breaking: Slider, Curve, Knuckle, Sweeper");
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [stats, sprayChart, heatmaps, pitchTrends] = await Promise.all([
          fetchBattingStats(playerId),
          fetchSprayChartData(playerId),
          fetchZoneHeatmapData(playerId),
          fetchPitchTrends(playerId),
        ]);

        setBattingData(stats);
        setSprayChartData(sprayChart);
        setZoneHeatmapData(heatmaps);
        setPitchTrendsData(pitchTrends);
      } catch (err) {
        setError(err.message);
        setBattingData(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => {
      [
        sprayChartRef,
        pitchTrendsRef,
        pitchPctHeatmapRef,
        totalPitchesHeatmapRef,
        swingPctHeatmapRef,
        swingsByZoneHeatmapRef,
        kPctHeatmapRef,
        whiffPctHeatmapRef,
      ].forEach((ref) => {
        if (ref.current) {
          d3.select(ref.current).selectAll("*").remove();
        }
      });
    };
  }, [playerId]);

  useEffect(() => {
    if (sprayChartData.length > 0) {
      drawSprayChart(sprayChartData);
    }
  }, [sprayChartData]);

  useEffect(() => {
    if (zoneHeatmapData) {
      // Draw Pitch % Heatmap
      drawHeatmap(
        zoneHeatmapData,
        pitchPctHeatmapRef,
        "Pitch %",
        "pitch_percent"
      );

      // Draw Total Pitches Heatmap
      drawHeatmap(
        zoneHeatmapData,
        totalPitchesHeatmapRef,
        "Total Pitches",
        "total_pitches"
      );

      // Draw Swing % Heatmap
      drawHeatmap(
        zoneHeatmapData,
        swingPctHeatmapRef,
        "Swing % By Zone",
        "swing_percent"
      );

      // Draw Swings By Zone Heatmap
      drawHeatmap(
        zoneHeatmapData,
        swingsByZoneHeatmapRef,
        "Swings By Zone",
        "swings"
      );

      // Draw K % Heatmap
      drawHeatmap(zoneHeatmapData, kPctHeatmapRef, "K %", "k_percent");

      // Draw Whiff % Heatmap
      drawHeatmap(
        zoneHeatmapData,
        whiffPctHeatmapRef,
        "Whiff %",
        "whiff_percent"
      );
    }
  }, [zoneHeatmapData]);

  useEffect(() => {
    if (pitchTrendsData.length > 0) {
      drawPitchTrends(pitchTrendsData, viewType);
    }
  }, [pitchTrendsData, viewType]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96 text-red-500">
        {error}
      </div>
    );
  }

  if (!battingData) {
    return (
      <div className="flex justify-center items-center h-96 text-gray-300">
        No batting data available
      </div>
    );
  }

  const existingTypes = [...new Set(sprayChartData.map((hit) => hit.type))];

  return (
    <div className="space-y-8">
      {/* Batting Stats Overview */}
      <div className="grid grid-cols-7 gap-4 p-4 bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-gray-400">PA</div>
          <div className="text-xl font-bold text-white">{battingData.PA}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">HR</div>
          <div className="text-xl font-bold text-white">{battingData.HR}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">SB</div>
          <div className="text-xl font-bold text-white">{battingData.SB}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">AVG</div>
          <div className="text-xl font-bold text-white">
            {battingData.AVG.toFixed(3)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">OBP</div>
          <div className="text-xl font-bold text-white">
            {battingData.OBP.toFixed(3)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">SLG</div>
          <div className="text-xl font-bold text-white">
            {battingData.SLG.toFixed(3)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">OPS</div>
          <div className="text-xl font-bold text-white">
            {battingData.OPS.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Spray Chart */}
      <div className="space-y-4">
        <h2 className="text-center text-xl font-bold text-white mt-[12%] mb-[5%]">
          Hit Spray Chart
        </h2>
        <div className="flex justify-center">
          <svg ref={sprayChartRef} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-gray-300">Ball type</th>
                {existingTypes.map((type) => {
                  const formattedType = type
                    .toLowerCase()
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");

                  return (
                    <th key={type} className="px-4 py-3 text-gray-300">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: hitTypeColors[type] }}
                        ></div>
                        {formattedType}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              <tr className="bg-gray-800 bg-opacity-40">
                <td className="px-4 py-3 text-gray-300 font-medium">Total</td>
                {existingTypes.map((type) => {
                  const count = sprayChartData.filter(
                    (hit) => hit.type === type
                  ).length;
                  return (
                    <td key={type} className="px-4 py-3 text-gray-300">
                      {count}
                    </td>
                  );
                })}
              </tr>
              <tr className="bg-gray-800 bg-opacity-40">
                <td className="px-4 py-3 text-gray-300 font-medium">
                  Avg Distance
                </td>
                {existingTypes.map((type) => {
                  const hits = sprayChartData.filter(
                    (hit) => hit.type === type
                  );
                  const avgDistance =
                    hits.reduce((sum, hit) => sum + hit.distance, 0) /
                    hits.length;
                  return (
                    <td key={type} className="px-4 py-3 text-gray-300">
                      {avgDistance.toFixed(1)} ft
                    </td>
                  );
                })}
              </tr>
              <tr className="bg-gray-800 bg-opacity-40">
                <td className="px-4 py-3 text-gray-300 font-medium">
                  Avg Exit Velocity
                </td>
                {existingTypes.map((type) => {
                  const hits = sprayChartData.filter(
                    (hit) => hit.type === type
                  );
                  const avgExitVelo =
                    hits.reduce((sum, hit) => sum + (hit.exit_speed || 0), 0) /
                    hits.length;
                  return (
                    <td key={type} className="px-4 py-3 text-gray-300">
                      {avgExitVelo > 0
                        ? `${avgExitVelo.toFixed(1)} mph`
                        : "N/A"}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Heatmaps */}
      <div>
        <h2 className="text-center text-xl font-bold text-white mt-[12%]">
          Statcast Zone Charts (Pitcher Throws)
        </h2>
        <div className="grid grid-cols-3 gap-x-8 gap-y-8 mt-[5%]">
          <div>
            <svg ref={pitchPctHeatmapRef} />
          </div>
          <div>
            <svg ref={totalPitchesHeatmapRef} />
          </div>
          <div>
            <svg ref={swingPctHeatmapRef} />
          </div>
          <div>
            <svg ref={swingsByZoneHeatmapRef} />
          </div>
          <div>
            <svg ref={kPctHeatmapRef} />
          </div>
          <div>
            <svg ref={whiffPctHeatmapRef} />
          </div>
        </div>
      </div>

      {/* Pitch Trends */}
      <div>
        <h2 className="text-center text-xl font-bold text-white mt-[12%] mb-[1%]">
          Pitch Type Trends
        </h2>
        <div className="flex justify-center">
          <div className="inline-flex bg-stone-800 rounded-full p-1 gap-1">
            {["percentage", "quantity"].map((type) => (
              <button
                key={type}
                onClick={() => setViewType(type)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  viewType === type
                    ? "bg-accent text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <svg ref={pitchTrendsRef} />
        </div>
      </div>
    </div>
  );
};

export default BattingStats;
