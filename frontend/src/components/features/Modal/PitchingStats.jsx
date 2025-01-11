import {
  fetchPitchDistribution,
  fetchPitchingData,
  fetchPitchUsageByDate,
} from "@/services/pitchinginfoService";
import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

const legendLabels = {
  "4S": "4-Seam",
  "2S": "2-Seam",
  SL: "Slider",
  CB: "Curve",
  SW: "Sweeper",
  CH: "Change",
  CT: "Cutter",
  SP: "Splitter",
  KN: "Knuckle",
};

const colorMap = {
  "4S": "#FF5733", // Red
  "2S": "#FF6B6B", // Light Red
  SL: "#FFD700", // Gold
  CB: "#00CED1", // Cyan
  SW: "#8B4513", // Brown
  CH: "#32CD32", // Green
  CT: "#8B0000", // Dark Red
  SP: "#8A2BE2", // Purple
  KN: "#FF69B4", // Pink
};

const PitchingStats = ({ playerId }) => {
  const [pitchingData, setPitchingData] = useState({
    pitch_data: [],
    stats: null,
  });
  const [usageByDate, setUsageByDate] = useState([]);
  const [distributionData, setDistributionData] = useState(null);
  const [usageMetric, setUsageMetric] = useState("percentage");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const svgRef = useRef(null);
  const usageChartRef = useRef(null);
  const velocityChartRef = useRef(null);

  const drawRadialChart = (data) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 800;
    const margin = { top: 40, right: 40, bottom: 180, left: 40 };
    const radius =
      Math.min(
        width - margin.left - margin.right,
        height - margin.top - margin.bottom
      ) / 2;

    const svgContainer = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2 - 40})`);

    svgContainer
      .append("circle")
      .attr("r", radius)
      .attr("fill", "#1c1c22")
      .attr("stroke", "#2a2a3e")
      .attr("stroke-width", 1);

    svgContainer
      .append("circle")
      .attr("r", radius)
      .attr("fill", "none")
      .attr("stroke", "#2a2a3e")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4");

    svgContainer
      .append("line")
      .attr("x1", -radius)
      .attr("x2", radius)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", "#2a2a3e")
      .attr("stroke-width", 1);

    svgContainer
      .append("line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", -radius)
      .attr("y2", radius)
      .attr("stroke", "#2a2a3e")
      .attr("stroke-width", 1);

    svgContainer
      .append("text")
      .attr("y", -radius - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .attr("class", "text-sm")
      .text("MORE RISE");

    svgContainer
      .append("text")
      .attr("y", radius + 30)
      .attr("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .attr("class", "text-sm")
      .text("MORE DROP");

    svgContainer
      .append("text")
      .attr("x", -radius - 20)
      .attr("y", 5)
      .attr("text-anchor", "end")
      .attr("fill", "#6b7280")
      .attr("class", "text-sm")
      .text("◀ 1B");

    svgContainer
      .append("text")
      .attr("x", radius + 20)
      .attr("y", 5)
      .attr("text-anchor", "start")
      .attr("fill", "#6b7280")
      .attr("class", "text-sm")
      .text("3B ▶");

    const radialScale = d3
      .scaleLinear()
      .domain([-24, 24])
      .range([-radius, radius]);

    let tooltip = d3.select("#radial-tooltip");
    if (tooltip.empty()) {
      tooltip = d3
        .select("body")
        .append("div")
        .attr("id", "radial-tooltip")
        .style("position", "fixed")
        .style("visibility", "hidden")
        .style("background-color", "#1a1a1a")
        .style("color", "white")
        .style("padding", "6px 8px")
        .style("border", "1px solid #fbbf24")
        .style("border-radius", "4px")
        .style("font-size", "14px")
        .style("line-height", "0.8")
        .style("font-family", "monospace")
        .style("pointer-events", "none")
        .style("z-index", "1000")
        .style("white-space", "pre-line")
        .style("min-width", "90px");
    }

    const existingPitchTypes = [...new Set(data.map((d) => d.pitch_type))];

    const points = svgContainer
      .selectAll(".data-point-group")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "data-point-group")
      .style("cursor", "pointer");

    points
      .append("circle")
      .attr("class", "data-point")
      .attr("cx", (d) => radialScale(d.horz_break))
      .attr("cy", (d) => -radialScale(d.induced_vert_break))
      .attr("r", 3.5)
      .attr("fill", (d) => colorMap[d.pitch_type] || "#666")
      .attr("opacity", 0.8)
      .on("mouseover", function (event, d) {
        const dot = d3.select(this);

        dot
          .attr("r", 6)
          .attr("stroke", "white")
          .attr("stroke-width", 2)
          .attr("opacity", 1);

        const svgRect = svg.node().getBoundingClientRect();
        const xPos = svgRect.left + parseFloat(dot.attr("cx")) + width / 2;
        const yPos = svgRect.top + parseFloat(dot.attr("cy")) + height / 2 - 13;

        const date = new Date(d.game_date);
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

        const tooltipContent = `
    <div style="text-align: center;">${d.pitch_type}</div>
    <div style="text-align: center;">${formattedDate}</div>
    <div>Release Speed: ${
      d.rel_speed ? d.rel_speed.toFixed(1) : "N/A"
    } mph</div>
    <div>Horizontal Break: ${
      d.horz_break ? d.horz_break.toFixed(1) : "N/A"
    } in</div>
    <div>Vertical Break: ${
      d.induced_vert_break ? d.induced_vert_break.toFixed(1) : "N/A"
    } in</div>
  `;

        tooltip
          .html(tooltipContent)
          .style("border", `1px solid ${colorMap[d.pitch_type]}`)
          .style("visibility", "visible")
          .style("left", `${xPos - tooltip.node().offsetWidth / 2}px`)
          .style("top", `${yPos - 40 - tooltip.node().offsetHeight}px`);
      })
      .on("mouseout", function () {
        const dot = d3.select(this);

        dot.attr("r", 3.5).attr("stroke", "none").attr("opacity", 0.8);

        tooltip.style("visibility", "hidden");
      });

    const legend = svgContainer
      .append("g")
      .attr("transform", `translate(${radius + 70}, ${-radius + 20})`);

    const validPitchTypes = existingPitchTypes.filter(
      (type) => type && type.trim() !== ""
    );

    validPitchTypes.forEach((type, i) => {
      const legendItem = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 25})`);

      legendItem
        .append("circle")
        .attr("r", 6)
        .attr("fill", colorMap[type] || "#666");

      legendItem
        .append("text")
        .attr("x", 15)
        .attr("y", 4)
        .attr("fill", "#888")
        .style("font-size", "12px")
        .text(type.charAt(0) + type.slice(1).toLowerCase());
    });
  };

  const drawUsageChart = (data, metric) => {
    const svg = d3.select(usageChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 160, bottom: 60, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svgContainer = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const groupedData = d3.groups(data, (d) => d.pitch_type);

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => new Date(d.date)))
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d[metric])])
      .range([height, 0]);

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %d"));
    const yAxis = d3.axisLeft(yScale);

    svgContainer
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis)
      .attr("color", "#6b7280")
      .selectAll("text")
      .attr("fill", "#6b7280");

    svgContainer
      .append("g")
      .call(yAxis)
      .attr("color", "#6b7280")
      .selectAll("text")
      .attr("fill", "#6b7280");

    groupedData.forEach(([pitchType, values]) => {
      const line = d3
        .line()
        .x((d) => xScale(new Date(d.date)))
        .y((d) => yScale(d[metric]))
        .curve(d3.curveMonotoneX);

      svgContainer
        .append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", colorMap[pitchType] || "#666")
        .attr("stroke-width", 2)
        .attr("d", line);

      const points = svgContainer
        .selectAll(`.data-points-${pitchType}`)
        .data(values)
        .enter()
        .append("g")
        .attr("class", `data-points-${pitchType}`);

      points
        .append("circle")
        .attr("cx", (d) => xScale(new Date(d.date)))
        .attr("cy", (d) => yScale(d[metric]))
        .attr("r", 5)
        .attr("fill", colorMap[pitchType])
        .style("cursor", "pointer")
        .attr("class", "hover:r-6 transition-all duration-200")
        .on("mouseover", function (event, d) {
          const dot = d3.select(this);

          dot.attr("r", 8).attr("stroke", "white").attr("stroke-width", 2);

          const xPos = xScale(new Date(d.date));
          const yPos = yScale(d[metric]);

          const svgRect = svg.node().getBoundingClientRect();

          let tooltip = d3.select("#chart-tooltip");
          if (tooltip.empty()) {
            tooltip = d3
              .select("body")
              .append("div")
              .attr("id", "chart-tooltip")
              .style("position", "fixed")
              .style("pointer-events", "none")
              .style("background-color", "#1a1a1a")
              .style("color", "white")
              .style("border-radius", "4px")
              .style("padding", "8px")
              .style("font-size", "12px")
              .style("z-index", "1000")
              .style("opacity", "0")
              .style("transition", "opacity 0.2s");
          }

          const tooltipWidth = 100;
          const tooltipHeight = 50;
          const padding = 20;
          const verticalOffset = 10;

          let tooltipX = svgRect.left + xPos + margin.left - tooltipWidth / 2;
          let tooltipY =
            svgRect.top +
            yPos +
            margin.top -
            tooltipHeight -
            padding -
            verticalOffset;

          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          if (tooltipX < padding) {
            tooltipX = padding;
          } else if (tooltipX + tooltipWidth > viewportWidth - padding) {
            tooltipX = viewportWidth - tooltipWidth - padding;
          }

          if (tooltipY < padding) {
            tooltipY = svgRect.top + yPos + margin.top + padding;
          }

          tooltip
            .html(
              `<div>${d.date}</div>
               <div>${legendLabels[pitchType]}: ${d[metric].toFixed(1)}${
                metric === "percentage" ? "%" : ""
              }</div>`
            )
            .style("border", `1px solid ${colorMap[pitchType]}`)
            .style("left", `${tooltipX}px`)
            .style("top", `${tooltipY}px`)
            .style("opacity", "1");
        })
        .on("mouseout", function () {
          const dot = d3.select(this);

          dot.attr("r", 5).attr("stroke", "none");

          d3.select("#chart-tooltip").style("opacity", "0");
        });
    });

    const legendItemHeight = 25;
    const legendHeight = legendItemHeight * groupedData.length;
    const startY = (height - legendHeight) / 2;

    const legend = svgContainer
      .append("g")
      .attr("transform", `translate(${width + 40}, 20)`);

    groupedData.forEach(([pitchType, values], i) => {
      const legendItem = legend
        .append("g")
        .attr("transform", `translate(0, ${i * legendItemHeight})`);

      legendItem
        .append("line")
        .attr("x1", -10)
        .attr("x2", 10)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", colorMap[pitchType] || "#666")
        .attr("stroke-width", 2);

      legendItem
        .append("circle")
        .attr("r", 4)
        .attr("fill", colorMap[pitchType] || "#666");

      legendItem
        .append("text")
        .attr("x", 20)
        .attr("y", 4)
        .attr("fill", "#6b7280")
        .style("font-size", "12px")
        .text(legendLabels[pitchType] || pitchType);
    });

    svgContainer
      .append("text")
      .attr("transform", `translate(${-40},${height / 2}) rotate(-90)`)
      .style("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .text(metric === "percentage" ? "Usage (%)" : "Usage (#)");

    svgContainer
      .append("text")
      .attr("transform", `translate(${width / 2},${height + 40})`)
      .style("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .text("Date");
  };

  const drawVelocityDistribution = (data) => {
    const svg = d3.select(velocityChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 160, bottom: 60, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const processedData = data.map((pitchData) => ({
      ...pitchData,
      distribution: pitchData.distribution.filter(
        (d) => d.speed >= 70 && d.speed <= 100
      ),
    }));

    const maxFrequency = d3.max(processedData, (pitchData) =>
      d3.max(pitchData.distribution, (d) => d.frequency)
    );

    const svgContainer = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    svgContainer
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#1c1c22");

    const xScale = d3.scaleLinear().domain([70, 100]).range([0, width]);

    const yAxisMax = Math.ceil(maxFrequency * 1.2);
    const yScale = d3.scaleLinear().domain([0, yAxisMax]).range([height, 0]);

    const yGrid = d3.axisLeft(yScale).tickSize(-width).tickFormat("").ticks(7);

    svgContainer
      .append("g")
      .attr("class", "grid")
      .call(yGrid)
      .style("stroke", "#2a2a3e")
      .style("stroke-opacity", 0.5);

    processedData.forEach((pitchData) => {
      const color = colorMap[pitchData.pitch_type];

      const lineGenerator = d3
        .line()
        .x((d) => xScale(d.speed))
        .y((d) => yScale(d.frequency))
        .curve(d3.curveBasis)
        .defined((d) => d.speed >= 70 && d.speed <= 100);

      const areaGenerator = d3
        .area()
        .x((d) => xScale(d.speed))
        .y0(height)
        .y1((d) => yScale(d.frequency))
        .curve(d3.curveBasis)
        .defined((d) => d.speed >= 70 && d.speed <= 100);

      svgContainer
        .append("path")
        .datum(pitchData.distribution)
        .attr("fill", color)
        .attr("fill-opacity", 0.2)
        .attr("d", areaGenerator);

      const linePath = svgContainer
        .append("path")
        .datum(pitchData.distribution)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2)
        .attr("d", lineGenerator);

      const pathLength = linePath.node().getTotalLength();
      const numSamples = 200;
      const step = pathLength / numSamples;

      let minY = Infinity;
      let visualPeak = null;

      for (let i = 0; i <= numSamples; i++) {
        const length = i * step;
        const point = linePath.node().getPointAtLength(length);
        if (point.y < minY) {
          minY = point.y;
          visualPeak = point;
        }
      }

      if (visualPeak) {
        const peakSpeed = xScale.invert(visualPeak.x);
        const peakFreq = yScale.invert(visualPeak.y);

        const peakPoint = svgContainer.append("g").attr("class", "peak-point");

        peakPoint
          .append("circle")
          .attr("cx", visualPeak.x)
          .attr("cy", visualPeak.y)
          .attr("r", 5)
          .attr("fill", color)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5)
          .style("cursor", "pointer")
          .on("mouseover", function () {
            const dot = d3.select(this);
            dot.attr("r", 8).attr("stroke-width", 3);
            const tooltipWidth = 120;
            const tooltipHeight = 45;
            const tooltipOffset = 15;

            const tooltip = svgContainer
              .append("g")
              .attr("class", "peak-tooltip")
              .attr(
                "transform",
                `translate(${visualPeak.x},${visualPeak.y - tooltipOffset})`
              );

            tooltip
              .append("rect")
              .attr("x", -tooltipWidth / 2)
              .attr("y", -tooltipHeight)
              .attr("width", tooltipWidth)
              .attr("height", tooltipHeight)
              .attr("fill", "#1a1a1a")
              .attr("stroke", color)
              .attr("rx", 4);

            tooltip
              .append("text")
              .attr("x", 0)
              .attr("y", -tooltipHeight / 2 - 2)
              .attr("text-anchor", "middle")
              .attr("fill", "white")
              .style("font-size", "12px")
              .text(`${peakSpeed.toFixed(1)} MPH`);

            tooltip
              .append("text")
              .attr("x", 0)
              .attr("y", -tooltipHeight / 2 + 14)
              .attr("text-anchor", "middle")
              .attr("fill", "white")
              .style("font-size", "12px")
              .text(legendLabels[pitchData.pitch_type]);
          })
          .on("mouseout", function () {
            const dot = d3.select(this);
            dot.attr("r", 5).attr("stroke-width", 1.5);
            svgContainer.selectAll(".peak-tooltip").remove();
          });
      }
    });

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(6)
      .tickFormat((d) => `${Math.round(d)} MPH`);

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(7)
      .tickFormat((d) => `${d}%`);

    svgContainer
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .attr("color", "#6b7280");

    svgContainer.append("g").call(yAxis).attr("color", "#6b7280");

    const legend = svgContainer
      .append("g")
      .attr("transform", `translate(${width + 20}, 20)`);

    processedData.forEach((pitchData, i) => {
      const legendItem = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 25})`);

      legendItem
        .append("circle")
        .attr("r", 6)
        .attr("fill", colorMap[pitchData.pitch_type])
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);

      legendItem
        .append("text")
        .attr("x", 15)
        .attr("y", 4)
        .attr("fill", "#6b7280")
        .style("font-size", "12px")
        .text(legendLabels[pitchData.pitch_type]);
    });

    svgContainer
      .append("text")
      .attr("transform", `translate(${-40},${height / 2}) rotate(-90)`)
      .style("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .text("Frequency (%)");

    svgContainer
      .append("text")
      .attr("transform", `translate(${width / 2},${height + 40})`)
      .style("text-anchor", "middle")
      .attr("fill", "#6b7280")
      .text("Velocity (MPH)");
  };

  // useEffect hooks
  useEffect(() => {
    const loadPitchingData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [data, usageData, distribution] = await Promise.all([
          fetchPitchingData(playerId),
          fetchPitchUsageByDate(playerId),
          fetchPitchDistribution(playerId),
        ]);

        setPitchingData(data);
        setUsageByDate(usageData);
        setDistributionData(distribution);
      } catch (err) {
        setError(err.message);
        setPitchingData({ pitch_data: [], stats: null });
      } finally {
        setLoading(false);
      }
    };

    loadPitchingData();
    return () => {
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("*").remove();
      }
      if (usageChartRef.current) {
        d3.select(usageChartRef.current).selectAll("*").remove();
      }
      if (velocityChartRef.current) {
        d3.select(velocityChartRef.current).selectAll("*").remove();
      }
    };
  }, [playerId]);

  useEffect(() => {
    if (pitchingData.pitch_data.length > 0 && svgRef.current) {
      drawRadialChart(pitchingData.pitch_data);
    }
  }, [pitchingData]);

  useEffect(() => {
    if (usageByDate.length > 0 && usageChartRef.current) {
      drawUsageChart(usageByDate, usageMetric);
    }
  }, [usageByDate, usageMetric]);

  useEffect(() => {
    if (distributionData && velocityChartRef.current) {
      drawVelocityDistribution(distributionData);
    }
  }, [distributionData]);

  // Render logic
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

  if (!pitchingData.pitch_data.length) {
    return (
      <div className="flex justify-center items-center h-96 text-gray-300">
        No pitching data available
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pitching Stats Overview */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-800 rounded-lg">
        {pitchingData.stats && (
          <>
            <div className="text-center">
              <div className="text-sm text-gray-400">G</div>
              <div className="text-xl font-bold text-white">
                {pitchingData.stats.games}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">IP</div>
              <div className="text-xl font-bold text-white">
                {pitchingData.stats.innings_pitched}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">SO</div>
              <div className="text-xl font-bold text-white">
                {pitchingData.stats.strikeouts}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">WHIP</div>
              <div className="text-xl font-bold text-white">
                {pitchingData.stats.whip}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Movement Profile */}
      <div>
        <h2 className="text-center text-xl font-bold text-white mt-[12%]">
          Movement Profile (Induced Break)
        </h2>
        <div className="flex justify-center">
          <svg ref={svgRef} />
        </div>
        <div className="overflow-x-auto -mt-24">
          <table className="w-full text-sm text-left">
            <thead className="text-xs bg-gray-800 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-gray-300">Attributes</th>
                {Object.keys(
                  pitchingData.pitch_data.reduce((acc, pitch) => {
                    if (
                      !acc[pitch.pitch_type] &&
                      legendLabels[pitch.pitch_type]
                    ) {
                      acc[pitch.pitch_type] = true;
                    }
                    return acc;
                  }, {})
                ).map((type) => (
                  <th key={type} className="px-4 py-3 text-gray-300">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: colorMap[type] }}
                      ></div>
                      {legendLabels[type]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              <tr className="bg-gray-800 bg-opacity-40">
                <td className="px-4 py-3 font-medium text-white">Usage</td>
                {Object.entries(
                  pitchingData.pitch_data.reduce((acc, pitch) => {
                    if (
                      !acc[pitch.pitch_type] &&
                      legendLabels[pitch.pitch_type]
                    ) {
                      acc[pitch.pitch_type] = { count: 0 };
                    }
                    if (legendLabels[pitch.pitch_type]) {
                      acc[pitch.pitch_type].count++;
                    }
                    return acc;
                  }, {})
                ).map(([type, stats]) => (
                  <td key={`usage-${type}`} className="px-4 py-3 text-gray-300">
                    {(
                      (stats.count / pitchingData.pitch_data.length) *
                      100
                    ).toFixed(1)}
                    %
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-800 bg-opacity-40">
                <td className="px-4 py-3 font-medium text-white">
                  Velocity (MPH)
                </td>
                {Object.entries(
                  pitchingData.pitch_data.reduce((acc, pitch) => {
                    if (
                      !acc[pitch.pitch_type] &&
                      legendLabels[pitch.pitch_type]
                    ) {
                      acc[pitch.pitch_type] = { count: 0, totalSpeed: 0 };
                    }
                    if (legendLabels[pitch.pitch_type]) {
                      acc[pitch.pitch_type].count++;
                      acc[pitch.pitch_type].totalSpeed += pitch.rel_speed;
                    }
                    return acc;
                  }, {})
                ).map(([type, stats]) => (
                  <td
                    key={`velocity-${type}`}
                    className="px-4 py-3 text-gray-300"
                  >
                    {(stats.totalSpeed / stats.count).toFixed(1)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Velocity Distribution */}
      <div className="space-y-2">
        <h2 className="text-center text-xl font-bold text-white mt-[12%]">
          Pitch Velocity Distribution
        </h2>
        <div className="flex justify-center">
          <svg ref={velocityChartRef} />
        </div>
      </div>

      {/* Pitch Usage by Date */}
      <div className="space-y-2">
        <h2 className="text-center text-xl font-bold text-white mt-[12%]">
          Pitch Usage by Date
        </h2>
        <div className="flex justify-center mb-4">
          <div className="inline-flex bg-stone-800 rounded-full p-1 gap-1">
            {["percentage", "quantity"].map((metric) => (
              <button
                key={metric}
                onClick={() => setUsageMetric(metric)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  usageMetric === metric
                    ? "bg-accent text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <svg ref={usageChartRef} />
        </div>
      </div>
    </div>
  );
};

export default PitchingStats;
