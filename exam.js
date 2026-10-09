/** Offline exam / answer-sheet module. */

import { uid } from "./timer.js";

export function createExam({ title, from, to, choices = 4 }) {
  const start = Math.max(1, Number(from) || 1);
  const end = Math.max(start, Number(to) || start);
  const count = Math.min(200, end - start + 1);
  const questions = [];
  for (let i = 0; i < count; i++) {
    questions.push({ n: start + i, answer: null });
  }
  return {
    id: uid("exam"),
    title: title || `آزمون ${start}–${end}`,
    from: start,
    to: start + count - 1,
    choices,
    questions,
    key: null,
    result: null,
    status: "draft",
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export function setAnswer(exam, index, choice) {
  if (!exam.questions[index]) return exam;
  const q = { ...exam.questions[index], answer: choice };
  const questions = exam.questions.slice();
  questions[index] = q;
  return { ...exam, questions, updatedAt: Date.now() };
}

/** keyStr: like "1A2B3C" or "A,B,C,D" sequential or "1:A 2:B" */
export function parseKey(keyStr, exam) {
  const raw = String(keyStr || "").trim().toUpperCase().replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  const map = {};
  const labeled = [...raw.matchAll(/(\d+)\s*[:\.\-)]\s*([A-D۱-۴1-4])/g)];
  if (labeled.length) {
    labeled.forEach((m) => {
      map[Number(m[1])] = normalizeChoice(m[2]);
    });
    return map;
  }
  const letters = raw.replace(/[^A-D1-4]/g, "");
  if (letters.length >= exam.questions.length) {
    exam.questions.forEach((q, i) => { map[q.n] = normalizeChoice(letters[i]); });
    return map;
  }
  const compact = [...raw.matchAll(/(\d+)([A-D])/g)];
  if (compact.length) {
    compact.forEach((m) => { map[Number(m[1])] = m[2]; });
    return map;
  }
  return null;
}

function normalizeChoice(c) {
  const s = String(c);
  if ("ABCD".includes(s)) return s;
  const fa = "۱۲۳۴".indexOf(s);
  if (fa >= 0) return "ABCD"[fa];
  const n = Number(s);
  if (n >= 1 && n <= 4) return "ABCD"[n - 1];
  return s;
}

export function gradeExam(exam, keyMap) {
  let correct = 0, wrong = 0, blank = 0;
  const detail = exam.questions.map((q) => {
    const key = keyMap[q.n];
    const ans = q.answer;
    let status = "blank";
    if (!ans) { blank++; status = "blank"; }
    else if (ans === key) { correct++; status = "ok"; }
    else { wrong++; status = "bad"; }
    return { n: q.n, ans, key, status };
  });
  const total = exam.questions.length;
  const pctRaw = total ? (correct / total) * 100 : 0;
  const pctNeg = total ? ((correct * 3 - wrong) / (total * 3)) * 100 : 0;
  return {
    correct, wrong, blank, total,
    pctRaw: Math.round(pctRaw * 10) / 10,
    pctNeg: Math.round(pctNeg * 10) / 10,
    detail,
    gradedAt: Date.now()
  };
}

export function examShareText(exam) {
  const r = exam.result;
  if (!r) return exam.title;
  return `${exam.title}\nصحیح: ${r.correct} | غلط: ${r.wrong} | نزده: ${r.blank}\nدرصد: ${r.pctRaw}% | با نمره منفی: ${r.pctNeg}%`;
}
