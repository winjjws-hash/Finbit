const departmentName = "IT소프트웨어과";

const softwareDepartmentTrail = [
  {
    date: "2026-03-31",
    title: "학과 실습 환경 정리",
    focus: ["Git", "VS Code", "HTML"],
    contributionLevel: 1
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

const itSoftwareDepartmentTrail = {
  departmentName,
  listTrail,
  findTrailByDate
};

if (typeof window !== "undefined") {
  window.itSoftwareDepartmentTrail = itSoftwareDepartmentTrail;
}

if (typeof module !== "undefined") {
  module.exports = itSoftwareDepartmentTrail;
}
