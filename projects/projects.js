import { fetchJSON, renderProjects } from "../global.js";

// await fetchJSON("../lib/asdf.json");

const projects = await fetchJSON("../lib/projects.json");
const projectsContainer = document.querySelector(".projects");
renderProjects(projects, projectsContainer, "h2");

// Step 1.6: Counting projects
const projectTitle = document.querySelector(".projects-title");
projectTitle.innerHTML = `${projects.length} ` + projectTitle.innerHTML;
