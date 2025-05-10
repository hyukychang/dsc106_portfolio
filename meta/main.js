import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

async function loadData() {
  const data = await d3.csv("loc.csv", (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + "T00:00" + row.timezone),
    datetime: new Date(row.datetime),
  }));
  // console.log(data);
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      // Each 'lines' array contains all lines modified in this commit
      // All lines in a commit have the same author, date, etc.
      // So we can get this information from the first line
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;

      // What information should we return about this commit?
      let ret = {
        id: commit,
        // ... what else?
        url: "https://github.com/hyukychang/dsc106_portfolio/commit/" + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, "lines", {
        value: lines,
        enumerable: true,
        writable: false,
        configurable: false,
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  // Create the dl element
  const dl = d3
    .select("#stats")
    .attr("class", "stats")
    .append("dl")
    .attr("class", "stats");

  // 1) COMMITS
  dl.append("dt").text("Commits");
  dl.append("dd").text(commits.length);

  // 2) FILES (distinct count of data[i].file)
  const fileCount = d3.group(data, (d) => d.file).size;
  dl.append("dt").text("Files");
  dl.append("dd").text(fileCount);

  // 3) TOTAL LOC
  dl.append("dt").html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append("dd").text(data.length);

  // 4) MAX DEPTH
  const maxDepth = d3.max(data, (d) => d.depth);
  dl.append("dt").text("Max Depth");
  dl.append("dd").text(maxDepth);

  // 5) LONGEST LINE (in characters)
  const longestLine = d3.max(data, (d) => d.length);
  dl.append("dt").text("Longest Line");
  dl.append("dd").text(longestLine);

  // 6) MAX LINES (max lines in any single file)
  const linesPerFile = Array.from(
    d3
      .rollup(
        data,
        (v) => v.length,
        (d) => d.file
      )
      .values()
  );
  const maxLines = d3.max(linesPerFile);
  dl.append("dt").text("Max Lines");
  dl.append("dd").text(maxLines);
}

function renderScatterPlot(data, commits) {
  // Put all the JS code of Steps inside this function
  const width = 1000;
  const height = 600;
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible");

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

  const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

  const dots = svg.append("g").attr("class", "dots");

  dots
    .selectAll("circle")
    .data(commits)
    .join("circle")
    .attr("cx", (d) => xScale(d.datetime))
    .attr("cy", (d) => yScale(d.hourFrac))
    .attr("r", 5)
    .attr("fill", "steelblue")
    .on("mouseenter", (event, commit) => {
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on("mouseleave", () => {
      // TODO: Hide tooltip
      updateTooltipVisibility(false);
    });

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // Update scales with new ranges
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);
  // Create the axes
  const xAxis = d3.axisBottom(xScale);
  // const yAxis = d3.axisLeft(yScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, "0") + ":00");

  // Add gridlines BEFORE the axes
  const gridlines = svg
    .append("g")
    .attr("class", "gridlines")
    .attr("transform", `translate(${usableArea.left}, 0)`);

  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(
    d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width)
  );

  const timeColor = d3
    .scaleLinear()
    .domain([0, 6, 12, 18, 24]) // hours
    .range([
      "#1f77b4", // midnight-blue
      "#1f77b4", // early morning-blue
      "#ff7f0e", // noon-orange
      "#ff7f0e", // evening-orange
      "#1f77b4", // back to blue at midnight
    ]);

  gridlines
    .selectAll("line")
    .attr("stroke", (d) => timeColor(d))
    .attr("stroke-width", 1)
    .attr("opacity", 1);

  // Add X axis
  svg
    .append("g")
    .attr("transform", `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  // Add Y axis
  svg
    .append("g")
    .attr("transform", `translate(${usableArea.left}, 0)`)
    .call(yAxis);
}

function renderTooltipContent(commit) {
  const link = document.getElementById("commit-link");
  const date = document.getElementById("commit-date");

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString("en", {
    dateStyle: "full",
  });
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

let data = await loadData();
let commits = processCommits(data);

renderScatterPlot(data, commits);

renderCommitInfo(data, commits);
