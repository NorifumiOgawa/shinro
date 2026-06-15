const state = {
  questions: [],
  departments: [],
  universities: [],
  currentIndex: 0,
  answers: {}
};

const labels = {
  people: "人と関わる",
  education: "教育",
  care: "医療・福祉",
  welfare: "福祉",
  business: "ビジネス",
  law: "法律・行政",
  global: "国際・語学",
  tourism: "観光",
  computer: "情報・PC",
  ai: "AI",
  data: "データ分析",
  security: "セキュリティ",
  public_service: "公共サービス",
  local_government: "地方行政",
  law_enforcement: "警察・法執行",
  defense: "防衛・安全保障",
  maritime_safety: "海上保安",
  disaster_response: "防災・救急",
  justice: "司法",
  accounting: "会計",
  engineering: "工学",
  architecture: "建築",
  mobility: "自動車・航空",
  robotics: "ロボット",
  environment: "環境",
  agriculture: "農業・食品",
  marine: "海洋",
  science: "理学・研究",
  psychology: "心理",
  humanities: "人文",
  society: "社会",
  art: "芸術",
  design: "デザイン",
  media: "映像・メディア",
  sports: "スポーツ",
  math: "数学",
  english: "英語",
  communication: "発表・対話",
  fieldwork: "現場活動",
  study: "長時間学習",
  graduate: "大学院",
  income: "収入",
  stability: "安定",
  freedom: "自由",
  social_good: "社会貢献",
  startup: "起業"
};

const elements = {};

document.addEventListener("DOMContentLoaded", async () => {
  bindElements();
  await loadData();
  setupEvents();
  updateHeader();
});

function bindElements() {
  [
    "intro",
    "diagnosis",
    "results",
    "startButton",
    "backButton",
    "skipButton",
    "nextButton",
    "restartButton",
    "answeredCount",
    "totalCount",
    "progressBar",
    "stepLabel",
    "categoryLabel",
    "questionText",
    "options",
    "tagSummary",
    "departmentResults",
    "departmentFilter",
    "prefectureFilter",
    "typeFilter",
    "deviationFilter",
    "universityResults"
  ].forEach((id) => {
    elements[id] = document.getElementById(id);
  });
}

async function loadData() {
  const [questions, departments, universities] = await Promise.all([
    fetch("./data/questions.json").then((res) => res.json()),
    fetch("./data/departments.json").then((res) => res.json()),
    fetch("./data/universities.json").then((res) => res.json())
  ]);

  state.questions = questions;
  state.departments = departments;
  state.universities = universities;
  elements.totalCount.textContent = String(state.questions.length);
  setupDeviationFilter();
}

function setupEvents() {
  elements.startButton.addEventListener("click", () => {
    showScreen("diagnosis");
    renderQuestion();
  });

  elements.backButton.addEventListener("click", () => {
    if (state.currentIndex > 0) {
      state.currentIndex -= 1;
      renderQuestion();
    }
  });

  elements.skipButton.addEventListener("click", () => {
    delete state.answers[currentQuestion().id];
    goNext();
  });

  elements.nextButton.addEventListener("click", goNext);
  elements.restartButton.addEventListener("click", restart);

  [
    elements.departmentFilter,
    elements.prefectureFilter,
    elements.typeFilter,
    elements.deviationFilter
  ].forEach((element) => element.addEventListener("change", renderUniversities));
}

function setupDeviationFilter() {
  const hasDeviationValues = state.universities.some(
    (university) => typeof university.deviationValue === "number"
  );

  if (!hasDeviationValues) {
    elements.deviationFilter.innerHTML = '<option value="">偏差値データ未設定</option>';
    elements.deviationFilter.disabled = true;
  }
}

function showScreen(id) {
  ["intro", "diagnosis", "results"].forEach((screenId) => {
    elements[screenId].classList.toggle("active", screenId === id);
  });
}

function currentQuestion() {
  return state.questions[state.currentIndex];
}

function renderQuestion() {
  const question = currentQuestion();
  const selected = state.answers[question.id];
  const progress = state.currentIndex / state.questions.length;

  elements.progressBar.style.width = `${Math.round(progress * 100)}%`;
  elements.stepLabel.textContent = `質問 ${state.currentIndex + 1} / ${state.questions.length}`;
  elements.categoryLabel.textContent = question.category;
  elements.questionText.textContent = question.text;
  elements.options.innerHTML = "";

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.textContent = option.label;
    button.dataset.optionId = option.id;
    button.setAttribute("aria-pressed", selected === option.id ? "true" : "false");
    button.classList.toggle("selected", selected === option.id);
    button.addEventListener("click", () => {
      state.answers[question.id] = option.id;
      renderQuestion();
      if (index >= 0) {
        window.setTimeout(goNext, 120);
      }
    });
    elements.options.appendChild(button);
  });

  elements.backButton.disabled = state.currentIndex === 0;
  elements.nextButton.textContent =
    state.currentIndex === state.questions.length - 1 ? "結果を見る" : "次へ";
  updateHeader();
}

function goNext() {
  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex += 1;
    renderQuestion();
    return;
  }

  renderResults();
  showScreen("results");
}

function updateHeader() {
  elements.answeredCount.textContent = String(Object.keys(state.answers).length);
}

function restart() {
  state.currentIndex = 0;
  state.answers = {};
  updateHeader();
  showScreen("intro");
}

function calculateTagScores() {
  const scores = {};

  state.questions.forEach((question) => {
    const answerId = state.answers[question.id];
    if (!answerId) return;

    const option = question.options.find((item) => item.id === answerId);
    if (!option) return;

    Object.entries(option.tags || {}).forEach(([tag, value]) => {
      scores[tag] = (scores[tag] || 0) + value;
    });
  });

  return scores;
}

function calculateDepartmentResults(tagScores) {
  return state.departments
    .map((department) => {
      const rawScore = Object.entries(department.tags).reduce((sum, [tag, weight]) => {
        return sum + (tagScores[tag] || 0) * weight;
      }, 0);

      const maxWeight = Object.values(department.tags).reduce((sum, weight) => sum + weight, 0);
      const score = Math.round(rawScore / Math.max(maxWeight, 1));

      return { ...department, score };
    })
    .sort((a, b) => b.score - a.score);
}

function renderResults() {
  const tagScores = calculateTagScores();
  const departments = calculateDepartmentResults(tagScores);
  const topDepartments = departments.slice(0, 8);
  state.latestDepartments = departments;

  renderTagSummary(tagScores);
  renderDepartmentCards(topDepartments);
  populateFilters(topDepartments);
  renderUniversities();
}

function renderTagSummary(tagScores) {
  const topTags = Object.entries(tagScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  elements.tagSummary.innerHTML = "";
  if (topTags.length === 0) {
    elements.tagSummary.innerHTML = '<p class="empty">回答が少ないため、傾向を出せませんでした。</p>';
    return;
  }

  topTags.forEach(([tag, score]) => {
    const span = document.createElement("span");
    span.className = "tag-pill";
    span.textContent = `${labels[tag] || tag} ${score}`;
    elements.tagSummary.appendChild(span);
  });
}

function renderDepartmentCards(departments) {
  elements.departmentResults.innerHTML = "";

  departments.forEach((department, index) => {
    const article = document.createElement("article");
    article.className = "department-card";
    article.innerHTML = `
      <h3>${index + 1}. ${department.name} <span class="score">${department.score}</span></h3>
      <p>${department.description}</p>
      <div class="meta-row">
        ${department.faculties.map((name) => `<span>${name}</span>`).join("")}
      </div>
    `;
    elements.departmentResults.appendChild(article);
  });
}

function populateFilters(topDepartments) {
  const previousDepartment = elements.departmentFilter.value;
  elements.departmentFilter.innerHTML = '<option value="">診断上位分野すべて</option>';
  topDepartments.forEach((department) => {
    const option = document.createElement("option");
    option.value = department.id;
    option.textContent = department.name;
    elements.departmentFilter.appendChild(option);
  });
  elements.departmentFilter.value = previousDepartment;

  const prefectures = [...new Set(state.universities.map((item) => item.prefecture))].sort();
  elements.prefectureFilter.innerHTML = '<option value="">すべて</option>';
  prefectures.forEach((prefecture) => {
    const option = document.createElement("option");
    option.value = prefecture;
    option.textContent = prefecture;
    elements.prefectureFilter.appendChild(option);
  });
}

function renderUniversities() {
  const selectedDepartment = elements.departmentFilter.value;
  const topDepartmentIds = (state.latestDepartments || [])
    .slice(0, 8)
    .map((department) => department.id);

  const candidates = state.universities
    .filter((university) => {
      const departmentMatch = selectedDepartment
        ? university.departmentCategory === selectedDepartment
        : topDepartmentIds.includes(university.departmentCategory);
      const prefectureMatch =
        !elements.prefectureFilter.value || university.prefecture === elements.prefectureFilter.value;
      const typeMatch = !elements.typeFilter.value || university.type === elements.typeFilter.value;
      const deviationMatch = matchesDeviation(university.deviationValue, elements.deviationFilter.value);
      return departmentMatch && prefectureMatch && typeMatch && deviationMatch;
    })
    .slice(0, 40);

  elements.universityResults.innerHTML = "";

  if (candidates.length === 0) {
    elements.universityResults.innerHTML =
      '<p class="empty">条件に合う大学・進路候補がありません。条件を少し広げてください。</p>';
    return;
  }

  candidates.forEach((university) => {
    const article = document.createElement("article");
    article.className = "university-card";
    const deviationText =
      typeof university.deviationValue === "number"
        ? `偏差値目安 ${university.deviationValue}`
        : "偏差値未設定";
    const officialLink = university.url
      ? `<a href="${university.url}" target="_blank" rel="noopener">公式サイト</a>`
      : "";
    article.innerHTML = `
      <h3>${university.name}</h3>
      <p>${university.faculty} ${university.department}</p>
      <div class="meta-row">
        <span>${typeLabel(university.type)}</span>
        <span>${university.prefecture}</span>
        <span>${deviationText}</span>
        <span>${departmentName(university.departmentCategory)}</span>
      </div>
      ${officialLink}
    `;
    elements.universityResults.appendChild(article);
  });
}

function matchesDeviation(value, filter) {
  if (!filter) return true;
  if (typeof value !== "number") return false;
  if (filter === "under45") return value < 45;
  if (filter === "45-50") return value >= 45 && value < 50;
  if (filter === "50-55") return value >= 50 && value < 55;
  if (filter === "55-60") return value >= 55 && value < 60;
  if (filter === "60-65") return value >= 60 && value < 65;
  if (filter === "65plus") return value >= 65;
  return true;
}

function typeLabel(type) {
  return {
    national: "国立",
    public: "公立",
    private: "私立",
    ministry_school: "省庁大学校"
  }[type] || type;
}

function departmentName(id) {
  const department = state.departments.find((item) => item.id === id);
  return department ? department.name : id;
}
