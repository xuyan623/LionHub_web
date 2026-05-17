export function render() {
  return renderProjectsPage();
}

import { state } from "../../core/state.js";
import { renderEmpty, renderProjectCard } from "../components.js";

export function renderProjectsPage() {
  const projects = state.database.robotProjects;
  return `
    <section>
      <div class="page-header"><div><h2>兵种项目</h2><p>集中查看七个兵种机器人的总进度、子方向进度、阻塞项、关联任务与阶段复盘。</p></div></div>
      <div class="project-grid">${projects.length ? projects.map((project) => renderProjectCard(project, true)).join("") : renderEmpty("当前没有兵种项目数据，请在系统设置中初始化。")}</div>
    </section>
  `;
}
