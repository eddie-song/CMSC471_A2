const margin = { top: 20, right: 30, bottom: 50, left: 60 };
const width = 700;
const height = 500;

const numericalColumns = ["TMIN", "TMAX", "TAVG", "SNOW", "SNWD", "PRCP"];
const seasonColors = {
    "Winter": "blue",
    "Spring": "green",
    "Summer": "red",
    "Autumn": "orange"
};

let data = [];
let xVar = "TMIN";
let yVar = "TMAX";
let sizeVar = "PRCP";
let selectedStation = "";
let selectedSeason = "all";

const svg = d3.select("#vis").append("svg")
    .attr("width", width)
    .attr("height", height);

const tooltip = d3.select("#tooltip")
    .style("position", "absolute")
    .style("background", "lightgray")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("display", "none");

function getSeason(dateStr) {
    let month = parseInt(dateStr.substring(4, 6));
    if ([12, 1, 2].includes(month)) return "Winter";
    if ([3, 4, 5].includes(month)) return "Spring";
    if ([6, 7, 8].includes(month)) return "Summer";
    if ([9, 10, 11].includes(month)) return "Autumn";
}

function init() {
    let filteredData = data.filter(d => d.station === selectedStation);
    if (selectedSeason !== "all") {
        filteredData = filteredData.filter(d => getSeason(d.date) === selectedSeason);
    }
    filteredData.forEach(d => numericalColumns.forEach(col => d[col] = +d[col]));
    filteredData = filteredData.filter(d => !(d[xVar] === 0 && d[yVar] === 0));

    let xExtent = d3.extent(filteredData, d => d[xVar]);
    let yExtent = d3.extent(filteredData, d => d[yVar]);
    let sizeExtent = d3.extent(filteredData, d => d[sizeVar]);

    let xScale = d3.scaleLinear()
        .domain([xExtent[0] - (xExtent[1] - xExtent[0]) * 0.1, xExtent[1] + (xExtent[1] - xExtent[0]) * 0.1])
        .range([margin.left, width - margin.right]);

    let yScale = d3.scaleLinear()
        .domain([yExtent[0] - (yExtent[1] - yExtent[0]) * 0.1, yExtent[1] + (yExtent[1] - yExtent[0]) * 0.1])
        .range([height - margin.bottom, margin.top]);

    let sizeScale = d3.scaleLinear()
        .domain(sizeExtent)
        .range([3, 10]);

    svg.selectAll(".axis").remove();

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text(xVar);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text(yVar);

    let points = svg.selectAll("circle").data(filteredData, d => d.date + d.station);

    points.exit()
        .transition().duration(500)
        .attr("r", 0)
        .remove();

    points.transition().duration(500)
        .attr("cx", d => xScale(d[xVar]))
        .attr("cy", d => yScale(d[yVar]))
        .attr("r", d => Math.max(sizeScale(d[sizeVar]), 3))
        .attr("fill", d => seasonColors[getSeason(d.date)] || "gray")
        .attr("opacity", 0.7);

    points.enter().append("circle")
        .attr("cx", d => xScale(d[xVar]))
        .attr("cy", d => yScale(d[yVar]))
        .attr("r", 0)
        .attr("fill", d => seasonColors[getSeason(d.date)] || "gray")
        .attr("opacity", 0.7)
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .html(`
                    Date: ${d.date}<br>
                    Station: ${d.station}<br>
                    State: ${d.state}<br>
                    Season: ${getSeason(d.date)}<br>
                    TMIN: ${d.TMIN}<br>
                    TMAX: ${d.TMAX}<br>
                    TAVG: ${d.TAVG}<br>
                    SNOW: ${d.SNOW}<br>
                    SNWD: ${d.SNWD}<br>
                    PRCP: ${d.PRCP}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        
            d3.select(event.target)
                .attr("stroke", "black")
                .attr("stroke-width", 2)
                .attr("opacity", 1);
        })
        .on("mouseout", (event, d) => {
            tooltip.style("display", "none");
        
            d3.select(event.target)
                .attr("stroke", "none")
                .attr("opacity", 0.7);
        })
        .transition().duration(500)
        .attr("r", d => Math.max(sizeScale(d[sizeVar]), 3));
}

d3.csv("data/weather.csv").then(function (csvData) {
    data = csvData;

    let stations = [...new Set(data.map(d => d.station))];
    selectedStation = stations[0];

    let stationSelect = d3.select("#stationSelect");
    stationSelect.selectAll("option")
        .data(stations)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    let xSelect = d3.select("#xSelect");
    let ySelect = d3.select("#ySelect");
    let sizeSelect = d3.select("#sizeSelect");

    numericalColumns.forEach(col => {
        xSelect.append("option").text(col).attr("value", col);
        ySelect.append("option").text(col).attr("value", col);
        sizeSelect.append("option").text(col).attr("value", col);
    });

    let seasonSelect = d3.select("#seasonSelect");
    let seasons = ["All Seasons", "Winter", "Spring", "Summer", "Autumn"];
    seasonSelect.selectAll("option")
        .data(seasons)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d === "All Seasons" ? "all" : d);

    function updateChart() {
        selectedStation = stationSelect.node().value;
        selectedSeason = seasonSelect.node().value;
        xVar = xSelect.node().value;
        yVar = ySelect.node().value;
        sizeVar = sizeSelect.node().value;

        init();
    }

    stationSelect.on("change", updateChart);
    xSelect.on("change", updateChart);
    ySelect.on("change", updateChart);
    sizeSelect.on("change", updateChart);
    seasonSelect.on("change", updateChart);

    updateChart();
});
