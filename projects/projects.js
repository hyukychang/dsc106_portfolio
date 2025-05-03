import { fetchJSON, renderProjects } from "../global.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// await fetchJSON("../lib/asdf.json");

const projects = await fetchJSON("../lib/projects.json");
const projectsContainer = document.querySelector(".projects");
renderProjects(projects, projectsContainer, "h2");

// Step 1.6: Counting projects
const projectTitle = document.querySelector(".projects-title");
projectTitle.innerHTML = `${projects.length} ` + projectTitle.innerHTML;

renderPieChart(projects);

function renderPieChart(projectsGiven) {
  // re-calculate rolled data
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year || "unknown"
  );
  // re-calculate data
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  // re-calculate slice generator, arc data, arc, etc.
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let newArcs = newArcData.map((d) => newArcGenerator(d));
  let colors = d3.scaleOrdinal(d3.schemeCategory10);
  // TODO: clear up paths and legends
  // remove all paths and legends
  let svg = d3.select("svg");
  svg.selectAll("path").remove();
  let legend = d3.select(".legend");
  legend.selectAll("li").remove();
  // update paths and legends, refer to steps 1.4 and 2.2

  let selectedIndex = -1;

  newArcs.forEach((arc, idx) => {
    svg
      .append("path")
      .attr("d", arc)
      .attr("fill", colors(idx))
      .on("click", (event) => {
        selectedIndex = selectedIndex === idx ? -1 : idx;
        svg.selectAll("path").attr("class", (_, i) => {
          // TODO: filter idx to find correct pie slice and apply CSS from above
          return i === selectedIndex ? "selected" : "";
        });
        legend.selectAll("li").attr("class", (_, i) => {
          // TODO: filter idx to find correct legend and apply CSS from above
          return i === selectedIndex ? "selected" : "";
        });

        if (selectedIndex === -1) {
          // no slice selected → show all projects
          // console.log("hi this is rerendering all projects");
          renderProjects(projectsGiven, projectsContainer, "h2");
        } else {
          // console.log("hi this is rerendering filtered projects");

          // filter by the year (or label) of the clicked slice
          const chosenLabel = newData[idx].label;
          // console.log("chosenLabel", chosenLabel);
          const filtered = projectsGiven.filter(
            (p) => String(p.year || "unknown") === String(chosenLabel)
          );
          renderProjects(filtered, projectsContainer, "h2");
        }
      });
  });

  newData.forEach((d, idx) => {
    legend
      .append("li")
      .attr("style", `--color:${colors(idx)}`) // set the style attribute while passing in parameters
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
  });
}

let query = "";

let searchInput = document.querySelector(".searchBar");

searchInput.addEventListener("input", (event) => {
  // update query value
  query = event.target.value;
  // console.log(query);
  // TODO: filter the projects
  const filteredProjects = projects.filter((project) => {
    return Object.keys(project)
      .filter((key) => key !== "image") // drop the image key
      .some((key) => {
        const val = project[key];
        return String(val).toLowerCase().includes(query.toLowerCase());
      });
  });
  // TODO: render updated projects!
  renderProjects(filteredProjects, projectsContainer, "h2");
  renderPieChart(filteredProjects);
});
