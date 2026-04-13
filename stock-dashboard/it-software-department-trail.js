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

const itSoftwareDepartmentTrail = {
  departmentName,
  listTrail,
  findTrailByDate,
  listFocusTags
};

if (typeof window !== "undefined") {
  window.itSoftwareDepartmentTrail = itSoftwareDepartmentTrail;
}

if (typeof module !== "undefined") {
  module.exports = itSoftwareDepartmentTrail;
}
