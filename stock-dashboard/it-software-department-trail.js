const departmentName = "IT소프트웨어과";

const softwareDepartmentTrail = [
  {
    date: "2026-03-31",
    title: "학과 실습 환경 정리",
    focus: ["Git", "VS Code", "HTML"],
    contributionLevel: 1
  },
  {
    date: "2026-04-07",
    title: "프론트엔드 화면 구성 연습",
    focus: ["HTML", "CSS", "JavaScript"],
    contributionLevel: 2
  },
  {
    date: "2026-04-13",
    title: "데이터베이스 테이블 설계",
    focus: ["SQL", "ERD", "Normalization"],
    contributionLevel: 3
  },
  {
    date: "2026-04-23",
    title: "알고리즘 문제 풀이 루틴",
    focus: ["Java", "Array", "Loop"],
    contributionLevel: 1
  },
  {
    date: "2026-04-25",
    title: "웹 프로젝트 구조 설계",
    focus: ["Architecture", "Component", "State"],
    contributionLevel: 4
  }
];

function normalizeDate(dateText) {
  return String(dateText).slice(0, 10);
}

function listTrail() {
  return softwareDepartmentTrail.map((item) => ({ ...item }));
}

function findTrailByDate(dateText) {
  const date = normalizeDate(dateText);
  return softwareDepartmentTrail.filter((item) => item.date === date);
}

function listFocusTags() {
  return [...new Set(softwareDepartmentTrail.flatMap((item) => item.focus))].sort();
}

function countTrailByDate() {
  return softwareDepartmentTrail.reduce((counts, item) => {
    counts[item.date] = (counts[item.date] || 0) + 1;
    return counts;
  }, {});
}

function createFocusMap() {
  return softwareDepartmentTrail.reduce((map, item) => {
    item.focus.forEach((tag) => {
      if (!map[tag]) {
        map[tag] = [];
      }
      map[tag].push(item.date);
    });
    return map;
  }, {});
}

function getTrailByContributionLevel(level) {
  return softwareDepartmentTrail.filter((item) => item.contributionLevel === level);
}

const itSoftwareDepartmentTrail = {
  departmentName,
  listTrail,
  findTrailByDate,
  listFocusTags,
  countTrailByDate,
  createFocusMap,
  getTrailByContributionLevel
};

if (typeof window !== "undefined") {
  window.itSoftwareDepartmentTrail = itSoftwareDepartmentTrail;
}

if (typeof module !== "undefined") {
  module.exports = itSoftwareDepartmentTrail;
}
