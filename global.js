console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Step 2
// let navLinks = $$("nav a");

// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname
// );

// currentLink?.classList.add("current");

// Step 3
let pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "cv/", title: "CV" },
  { url: "meta/", title: "Meta" },
  { url: "https://github.com/hyukychang", title: "GitHub" },
];

let nav = document.createElement("nav");
document.body.prepend(nav);

const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/" // Local server
    : "/dsc106_portfolio/"; // GitHub Pages repo name

for (let p of pages) {
  let url = p.url;
  let title = p.title;
  // next step: create link and add it to nav
  url = !url.startsWith("http") ? BASE_PATH + url : url;

  // nav.insertAdjacentHTML("beforeend", `<a href="${url}">${title}</a>`);
  let a = document.createElement("a");
  a.href = url;
  a.textContent = title;
  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );
  if (a.host !== location.host) {
    a.target = "_blank";
  }
  nav.append(a);
}

document.body.insertAdjacentHTML(
  "afterbegin",
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
		</select>
	</label>`
);

const colorSchemeSelect = document.querySelector(".color-scheme select");

function setColorScheme(scheme) {
  document.documentElement.style.colorScheme = scheme;
  colorSchemeSelect.value = scheme;
}

colorSchemeSelect.addEventListener("change", (e) => {
  console.log("color scheme changed to", e.target.value);
  const scheme = e.target.value;
  setColorScheme(scheme);
  localStorage.setItem("color-scheme", scheme);
});

window.addEventListener("load", () => {
  const savedScheme = localStorage.getItem("color-scheme");
  if (savedScheme) {
    setColorScheme(savedScheme);
  } else {
    setColorScheme("light dark");
  }
});

const form = document.querySelector("form");
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const params = [];
  for (let [key, value] of data) {
    params.push(`${key}=${encodeURIComponent(value)}`);
  }
  const url = `${form.action}?${params.join("&")}`;
  location.href = url;
});

// lab4
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    // console.log("data", data);
    return data;
  } catch (error) {
    console.error("Error fetching or parsing JSON data:", error);
  }
}

// 1. Defining the Basic Function
export function renderProjects(
  project,
  containerElement,
  headingLevel = "h2" // 6. Adding Functionality
) {
  // console.log("renderProjects", project, containerElement, headingLevel);
  // 2. Clearing Existing Content
  containerElement.innerHTML = "";

  const valid = ["h1", "h2", "h3", "h4", "h5", "h6"];
  headingLevel = headingLevel.toLowerCase();
  if (!valid.includes(headingLevel)) {
    console.warn(
      `renderProjects: invalid headingLevel "${headingLevel}", defaulting to "h2"`
    );
    headingLevel = "h2";
  }

  for (let i = 0; i < project.length; i++) {
    const prj = project[i];
    // 3. Creating an <article> Element
    const article = document.createElement("article");
    // 4. Defining the Content Dynamically
    article.innerHTML = `
    <${headingLevel}>${prj.title}</${headingLevel}>
    <img src="${prj.image}" alt="${prj.title}">
    <div class="project-body">
      <p class="project-desc">${prj.description}</p>
      <p class="project-year">${prj.year || ""}</p>
    </div>  
    `;
    if (prj.link) {
      article.style.cursor = "pointer";
    }

    article.addEventListener("click", () => {
      // console.log("clicked", prj.link);
      if (prj.link) {
        if (prj.link.startsWith("http")) {
          window.open(prj.link, "_blank");
        } else {
          window.open(BASE_PATH + prj.link, "_blank");
        }
      }
    });

    containerElement.appendChild(article);
  }
}
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
