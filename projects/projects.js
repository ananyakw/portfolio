import { fetchJSON, renderProjects, BASE_PATH } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON(`${BASE_PATH}lib/projects.json`);

const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
  projectsTitle.textContent = `Projects (${projects.length})`;
}

const projectsContainer = document.querySelector('.projects');

const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const colors = d3.scaleOrdinal(d3.schemeTableau10);

let selectedIndex = -1;
let query = '';

function renderPieChart(projectsGiven) {
  // Rolled data: array of [year, count]
  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  const data = rolledData.map(([year, count]) => ({
    value: count,
    label: year,
  }));

  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();

  const legend = d3.select('.legend');
  legend.selectAll('li').remove();

  if (data.length === 0) return;

  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(data);
  const arcs = arcData.map((d) => arcGenerator(d));

  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', selectedIndex === i ? 'selected' : '')
      .attr('tabindex', '0')
      .attr('role', 'button')
      .attr('aria-label', `${data[i].label}: ${data[i].value} project${data[i].value !== 1 ? 's' : ''}`)
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        svg
          .selectAll('path')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        legend
          .selectAll('li')
          .attr('class', (_, idx) =>
            `legend-item${idx === selectedIndex ? ' selected' : ''}`
          );

        if (selectedIndex === -1) {
          const filtered = applySearch(projects);
          renderProjects(filtered, projectsContainer, 'h2');
        } else {
          const yearLabel = data[selectedIndex].label;
          const filtered = applySearch(projects).filter(
            (p) => String(p.year) === String(yearLabel),
          );
          renderProjects(filtered, projectsContainer, 'h2');
        }
      });
  });

  data.forEach((d, i) => {
    legend
      .append('li')
      .attr('class', `legend-item${i === selectedIndex ? ' selected' : ''}`)
      .attr('style', `--color:${colors(i)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        renderPieChart(applySearch(projects));

        if (selectedIndex === -1) {
          renderProjects(applySearch(projects), projectsContainer, 'h2');
        } else {
          const yearLabel = data[selectedIndex].label;
          const filtered = applySearch(projects).filter(
            (p) => String(p.year) === String(yearLabel),
          );
          renderProjects(filtered, projectsContainer, 'h2');
        }
      });
  });
}

function applySearch(projectList) {
  if (!query) return projectList;
  return projectList.filter((project) => {
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);

const searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  query = event.target.value;

  const filtered = applySearch(projects);

  renderPieChart(filtered);

  if (selectedIndex === -1) {
    renderProjects(filtered, projectsContainer, 'h2');
  } else {
    const rolledData = d3.rollups(filtered, (v) => v.length, (d) => d.year);
    const data = rolledData.map(([year, count]) => ({ value: count, label: year }));

    if (selectedIndex < data.length) {
      const yearLabel = data[selectedIndex].label;
      const doubleFiltered = filtered.filter(
        (p) => String(p.year) === String(yearLabel),
      );
      renderProjects(doubleFiltered, projectsContainer, 'h2');
    } else {
      selectedIndex = -1;
      renderProjects(filtered, projectsContainer, 'h2');
    }
  }
});