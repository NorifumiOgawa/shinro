const state = {
  questions: [],
  activeQuestions: [],
  departments: [],
  universities: [],
  currentIndex: 0,
  answers: {},
  routingDone: false
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

// --- 適応型ルーティング設定 ---

const STEP1_IDS = ['q001', 'q002', 'q003'];
const FINAL_IDS = ['q036', 'q037', 'q038', 'q039', 'q040', 'q041', 'q042', 'q043'];

// 誰でも常に表示する補足問題
const BASE_SUPPLEMENT_IDS = ['q044', 'q045', 'q049', 'q050', 'q061', 'q062', 'q075'];

// 各セクションの定義：questions.json のカテゴリSTEP2〜STEP8
const SECTIONS = [
  {
    key: 'step2_people',
    ids: ['q004', 'q005', 'q006'],
    trigger: t => (t.people || 0) + (t.communication || 0) >= 4,
    score:   t => (t.people || 0) + (t.communication || 0),
    supplements: ['q055', 'q056', 'q067']
  },
  {
    key: 'step3_pc',
    ids: ['q007', 'q008', 'q009', 'q010', 'q011'],
    trigger: t => (t.computer || 0) + (t.ai || 0) + (t.data || 0) >= 3,
    score:   t => (t.computer || 0) + (t.ai || 0) + (t.data || 0),
    supplements: ['q051', 'q052']
  },
  {
    key: 'step4_making',
    ids: ['q012', 'q013', 'q014', 'q015', 'q016'],
    trigger: t => (t.engineering || 0) + (t.design || 0) >= 3,
    score:   t => (t.engineering || 0) + (t.design || 0) + (t.robotics || 0),
    supplements: ['q053', 'q054']
  },
  {
    key: 'step5_outdoor',
    ids: ['q017', 'q018', 'q019', 'q020', 'q021'],
    trigger: t => (t.fieldwork || 0) + (t.environment || 0) >= 3,
    score:   t => (t.fieldwork || 0) + (t.environment || 0) + (t.marine || 0),
    supplements: ['q068', 'q060']
  },
  {
    key: 'step6_research',
    ids: ['q022', 'q023', 'q024', 'q025', 'q026'],
    trigger: t => (t.science || 0) + (t.graduate || 0) >= 3,
    score:   t => (t.science || 0) + (t.graduate || 0),
    supplements: ['q073', 'q063']
  },
  {
    key: 'step7_humanities',
    ids: ['q027', 'q028', 'q029', 'q030', 'q031'],
    trigger: t => (t.humanities || 0) + (t.law || 0) + (t.study || 0) >= 3,
    score:   t => (t.humanities || 0) + (t.law || 0) + (t.study || 0),
    supplements: ['q064', 'q057', 'q070']
  },
  {
    key: 'step8_art',
    ids: ['q032', 'q033', 'q034', 'q035'],
    trigger: t => (t.art || 0) + (t.media || 0) >= 3,
    score:   t => (t.art || 0) + (t.media || 0) + (t.design || 0),
    supplements: ['q059', 'q072']
  }
];

// STEP1の回答からアクティブ問題リストを組み立てる
function buildActiveQuestions() {
  const byId = new Map(state.questions.map(q => [q.id, q]));
  const seen = new Set();
  const result = [];

  const addQ = id => {
    if (!seen.has(id) && byId.has(id)) {
      seen.add(id);
      result.push(byId.get(id));
    }
  };

  STEP1_IDS.forEach(addQ);

  // STEP1回答分だけのタグスコアを計算してセクションを決定
  const step1Scores = {};
  STEP1_IDS.forEach(id => {
    const answerId = state.answers[id];
    if (!answerId) return;
    const q = byId.get(id);
    if (!q) return;
    const option = q.options.find(o => o.id === answerId);
    if (!option) return;
    Object.entries(option.tags || {}).forEach(([tag, val]) => {
      step1Scores[tag] = (step1Scores[tag] || 0) + val;
    });
  });

  // トリガーが成立したセクションをスコア降順で最大2つ選択
  const triggered = SECTIONS
    .filter(s => s.trigger(step1Scores))
    .sort((a, b) => b.score(step1Scores) - a.score(step1Scores));

  // 何も該当しない場合はスコア最大のセクション1つをフォールバック表示
  const sectionsToShow = triggered.length > 0
    ? triggered.slice(0, 2)
    : [SECTIONS.reduce((best, s) => s.score(step1Scores) > best.score(step1Scores) ? s : best)];

  sectionsToShow.forEach(s => s.ids.forEach(addQ));
  FINAL_IDS.forEach(addQ);
  BASE_SUPPLEMENT_IDS.forEach(addQ);
  sectionsToShow.forEach(s => (s.supplements || []).forEach(addQ));

  return result;
}

// --- DOM要素バインディング ---

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
  ].forEach(id => {
    elements[id] = document.getElementById(id);
  });
}

async function loadData() {
  const [questions, departments, universities] = await Promise.all([
    fetch("./data/questions.json").then(res => res.json()),
    fetch("./data/departments.json").then(res => res.json()),
    fetch("./data/universities.json").then(res => res.json())
  ]);

  state.questions = questions;
  state.departments = departments;
  state.universities = universities;
  state.activeQuestions = questions.filter(q => STEP1_IDS.includes(q.id));
  elements.totalCount.textContent = String(state.activeQuestions.length);
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
  ].forEach(el => el.addEventListener("change", renderUniversities));
}

function setupDeviationFilter() {
  const hasDeviationValues = state.universities.some(
    u => typeof u.deviationValue === "number"
  );
  if (!hasDeviationValues) {
    elements.deviationFilter.innerHTML = '<option value="">偏差値データ未設定</option>';
    elements.deviationFilter.disabled = true;
  }
}

function showScreen(id) {
  ["intro", "diagnosis", "results"].forEach(screenId => {
    elements[screenId].classList.toggle("active", screenId === id);
  });
}

function currentQuestion() {
  return state.activeQuestions[state.currentIndex];
}

function renderQuestion() {
  const question = currentQuestion();
  const selected = state.answers[question.id];
  const progress = state.currentIndex / state.activeQuestions.length;

  elements.progressBar.style.width = `${Math.round(progress * 100)}%`;
  elements.stepLabel.textContent = `質問 ${state.currentIndex + 1} / ${state.activeQuestions.length}`;
  elements.categoryLabel.textContent = question.category;
  elements.questionText.textContent = question.text;
  elements.options.innerHTML = "";

  question.options.forEach(option => {
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
      window.setTimeout(goNext, 120);
    });
    elements.options.appendChild(button);
  });

  elements.backButton.disabled = state.currentIndex === 0;
  elements.nextButton.textContent =
    state.currentIndex === state.activeQuestions.length - 1 ? "結果を見る" : "次へ";
  updateHeader();
}

function goNext() {
  // STEP1終了時点でアクティブ問題リストを再構築
  if (currentQuestion().id === 'q003' && !state.routingDone) {
    state.routingDone = true;
    state.activeQuestions = buildActiveQuestions();
    state.currentIndex = state.activeQuestions.findIndex(q => q.id === 'q003');
    elements.totalCount.textContent = String(state.activeQuestions.length);
  }

  if (state.currentIndex < state.activeQuestions.length - 1) {
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
  state.routingDone = false;
  state.activeQuestions = state.questions.filter(q => STEP1_IDS.includes(q.id));
  elements.totalCount.textContent = String(state.activeQuestions.length);
  updateHeader();
  showScreen("intro");
}

// --- スコア計算 ---

function calculateTagScores() {
  const scores = {};
  state.activeQuestions.forEach(question => {
    const answerId = state.answers[question.id];
    if (!answerId) return;
    const option = question.options.find(item => item.id === answerId);
    if (!option) return;
    Object.entries(option.tags || {}).forEach(([tag, value]) => {
      scores[tag] = (scores[tag] || 0) + value;
    });
  });
  return scores;
}

function calculateDepartmentResults(tagScores) {
  return state.departments
    .map(department => {
      const score = Object.entries(department.tags).reduce((sum, [tag, weight]) => {
        return sum + (tagScores[tag] || 0) * weight;
      }, 0);
      return { ...department, score };
    })
    .sort((a, b) => b.score - a.score);
}

// 学部との一致理由：ユーザースコア × 学部タグ重みで貢献度を算出し上位3件を返す
function getMatchReasons(department, tagScores) {
  return Object.entries(department.tags)
    .filter(([tag]) => (tagScores[tag] || 0) > 0)
    .map(([tag, weight]) => ({
      label: labels[tag] || tag,
      contribution: (tagScores[tag] || 0) * weight
    }))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);
}

// --- 結果レンダリング ---

function renderResults() {
  const tagScores = calculateTagScores();
  const departments = calculateDepartmentResults(tagScores);
  const topDepartments = departments.slice(0, 8);
  state.latestDepartments = departments;

  renderTagSummary(tagScores);
  renderDepartmentCards(topDepartments, tagScores);
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

  topTags.forEach(([tag]) => {
    const span = document.createElement("span");
    span.className = "tag-pill";
    span.textContent = labels[tag] || tag;
    elements.tagSummary.appendChild(span);
  });
}

function renderDepartmentCards(departments, tagScores) {
  elements.departmentResults.innerHTML = "";
  const maxScore = departments[0]?.score || 1;

  departments.forEach((department, index) => {
    const pct = maxScore > 0 ? Math.round((department.score / maxScore) * 100) : 0;
    const reasons = getMatchReasons(department, tagScores);

    const article = document.createElement("article");
    article.className = "department-card";

    const reasonHtml = reasons.length > 0
      ? `<div class="match-reason">
          <span class="reason-prefix">マッチした傾向：</span>
          ${reasons.map(r => `<span class="reason-tag">${r.label}</span>`).join("")}
        </div>`
      : "";

    article.innerHTML = `
      <h3>${index + 1}. ${department.name}</h3>
      <div class="score-bar-wrap">
        <div class="score-bar-track">
          <div class="score-bar" style="width: ${pct}%"></div>
        </div>
        <span class="score-label">適合度 ${pct}%</span>
      </div>
      <p>${department.description}</p>
      ${reasonHtml}
      <div class="meta-row">
        ${department.faculties.map(name => `<span>${name}</span>`).join("")}
      </div>
    `;
    elements.departmentResults.appendChild(article);
  });
}

function populateFilters(topDepartments) {
  const previousDepartment = elements.departmentFilter.value;
  elements.departmentFilter.innerHTML = '<option value="">診断上位分野すべて</option>';
  topDepartments.forEach(department => {
    const option = document.createElement("option");
    option.value = department.id;
    option.textContent = department.name;
    elements.departmentFilter.appendChild(option);
  });
  elements.departmentFilter.value = previousDepartment;

  const prefectures = [...new Set(state.universities.map(item => item.prefecture))].sort();
  elements.prefectureFilter.innerHTML = '<option value="">すべて</option>';
  prefectures.forEach(prefecture => {
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
    .map(d => d.id);

  const candidates = state.universities
    .filter(university => {
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

  candidates.forEach(university => {
    const article = document.createElement("article");
    article.className = "university-card";
    const deviationText =
      typeof university.deviationValue === "number"
        ? `偏差値目安 ${university.deviationValue}`
        : "偏差値未設定";

    const safeHref = safeUrl(university.url);
    const officialLink = safeHref
      ? `<a href="${safeHref}" target="_blank" rel="noopener">公式サイト</a>`
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

function safeUrl(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
  } catch {
    return "";
  }
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
  return { national: "国立", public: "公立", private: "私立", ministry_school: "省庁大学校" }[type] || type;
}

function departmentName(id) {
  const department = state.departments.find(item => item.id === id);
  return department ? department.name : id;
}
