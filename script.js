document.addEventListener("DOMContentLoaded", () => {
  const chartPlot = d3.select("#chartPlot");
  const tableData = d3.select("#tablePlot");
  const sourceData = "http://localhost:8000/data/countries.json";
  const tooltip = d3.select(".tooltip");

  document.getElementById("formPlot").addEventListener("submit", (event) => {
    event.preventDefault();
    const selectedCriteria = document.querySelector(
      'input[name="plotOption"]:checked'
    ).value;

    fetch(sourceData)
      .then((response) => response.json())
      .then((data) => {
        const processedData = processDataPoints(data, selectedCriteria);
        renderBubbleChart(processedData);
        renderTableData(processedData);
      })
      .catch((error) => console.error("Error fetching data:", error));
  });

  function processDataPoints(data, criteria) {
    const chartData = [];
    const regionData = {};

    data.forEach((dataPoint) => {
      switch (criteria) {
        case "Population size":
          chartData.push({
            name: dataPoint.name,
            value: dataPoint.population,
            capital: dataPoint.capital,
            alpha3Code: dataPoint.alpha3Code,
            nativeName: dataPoint.nativeName,
            heading: "Population",
          });
          break;

        case "Number of borders":
          chartData.push({
            name: dataPoint.name,
            value: dataPoint.borders.length,
            capital: dataPoint.capital,
            alpha3Code: dataPoint.alpha3Code,
            nativeName: dataPoint.nativeName,
            heading: "Borders",
          });
          break;

        case "Number of timezones":
          chartData.push({
            name: dataPoint.name,
            value: dataPoint.timezones.length,
            capital: dataPoint.capital,
            alpha3Code: dataPoint.alpha3Code,
            nativeName: dataPoint.nativeName,
            heading: "Timezones",
          });
          break;

        case "Number of languages":
          chartData.push({
            name: dataPoint.name,
            value: dataPoint.languages.length,
            capital: dataPoint.capital,
            alpha3Code: dataPoint.alpha3Code,
            nativeName: dataPoint.nativeName,
            heading: "Languages",
          });
          break;

        case "Number of countries in the region":
        case "Number of unique timezones in the region":
          if (!regionData[dataPoint.region]) {
            regionData[dataPoint.region] = {
              countryCount: 0,
              timezones: new Set(),
              languages: new Set(),
              population: 0,
            };
          }
          regionData[dataPoint.region].countryCount += 1;
          dataPoint.timezones.forEach((tz) =>
            regionData[dataPoint.region].timezones.add(tz)
          );
          dataPoint.languages.forEach((lang) =>
            regionData[dataPoint.region].languages.add(lang)
          );
          regionData[dataPoint.region].population += dataPoint.population;
          break;
      }
    });

    if (
      criteria === "Number of countries in the region" ||
      criteria === "Number of unique timezones in the region"
    ) {
      Object.entries(regionData).forEach(([region, data]) => {
        chartData.push({
          name: region,
          value:
            criteria === "Number of countries in the region"
              ? data.countryCount
              : data.timezones.size,
          languagesCount: data.languages.size,
          population: data.population,
          heading:
            criteria === "Number of countries in the region"
              ? "Countries"
              : "Timezones",
          criteria: criteria,
        });
      });
    }

    return chartData;
  }

  function renderBubbleChart(data) {
    chartPlot.html("");
    $("#chartSection").prop("hidden", false);

    const width = 800;
    const height = 600;
    const maxRadius = d3.max(data, (d) => d.value);
    const radiusScale = d3.scaleSqrt().domain([0, maxRadius]).range([10, 80]);

    const svg = chartPlot
      .append("svg")
      .attr("width", width)
      .attr("height", height);
    const simulation = d3
      .forceSimulation(data)
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .force(
        "collide",
        d3.forceCollide((d) => radiusScale(d.value) + 2)
      )
      .stop();

    for (let i = 0; i < 120; ++i) simulation.tick();

    const nodes = svg
      .selectAll(".node")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .on("mouseover", (event, d) => {
        const tag = d.criteria
          ? `Region Name: ${d.name}<br>${d.heading}: ${d.value}<br>Total Languages: ${d.languagesCount}<br>Total Population: ${d.population}`
          : `Country Name: ${d.name}<br>${d.heading}: ${d.value}<br>Capital: ${d.capital}<br>Alpha3Code: ${d.alpha3Code}<br>Native Name: ${d.nativeName}`;
        tooltip
          .html(tag)
          .style("visibility", "visible")
          .style("left", event.pageX + 5 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 5 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    nodes.append("circle").attr("r", (d) => radiusScale(d.value));
    nodes
      .append("text")
      .attr("dy", "-0.5em")
      .style("text-anchor", "middle")
      .style("fill", "white")
      .text((d) => d.name);
    nodes
      .append("text")
      .attr("dy", "0.5em")
      .style("text-anchor", "middle")
      .style("fill", "white")
      .text((d) => d.value);
  }

  function renderTableData(data) {
    tableData.html("");
    $("#tableSection").prop("hidden", false);

    const table = tableData.append("table");
    const thead = table.append("thead");
    const tbody = table.append("tbody");

    const headings = data[0].criteria
      ? ["Region", data[0].heading]
      : ["Country", data[0].heading];

    thead
      .append("tr")
      .selectAll("th")
      .data(headings)
      .enter()
      .append("th")
      .text((d) => d);
    const rows = tbody.selectAll("tr").data(data).enter().append("tr");

    rows
      .selectAll("td")
      .data((d) => {
        return d.criteria ? [d.name, d.value] : [d.name, d.value];
      })
      .enter()
      .append("td")
      .text((d) => d);
  }
});
