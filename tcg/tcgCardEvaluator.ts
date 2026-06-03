/**
 * tcgCardEvaluator.ts
 * 19각형(5+7+7) 스탯 기반 TCG 카드 평가 모듈
 *
 * 최종 점수 = (A평균 * 0.6) + (B평균 * 0.3) + (C평균 * 0.1)  → 반올림 정수
 */

/* =========================================================
 * 1. 도메인 타입 (이 타입 정의가 곧 UI 파싱 계약)
 * ========================================================= */

/** 카드 등급 */
export type Grade = "S" | "A+" | "A" | "B" | "C" | "C-" | "F";

/** 그룹 식별자 */
export type GroupKey = "A" | "B" | "C";

/** 개별 스탯 (UI 표기용 이름 + 0~100 값) */
export interface Stat {
  key: string;   // 프로그램용 식별자 (camelCase 권장)
  name: string;  // 화면 표기명
  value: number; // 0 ~ 100
}

/** 평가 입력 (계산 전 원본) */
export interface CardInput {
  category: string;                  // 대분류
  groups: Record<GroupKey, Stat[]>;  // A:5, B:7, C:7
}

/** 평가 결과 (JSON 직렬화 대상) */
export interface CardResult {
  category: string;
  finalScore: number; // 0 ~ 100 (반올림 정수)
  grade: Grade;
  breakdown: {
    [K in GroupKey]: {
      weight: number;  // 그룹 가중치
      average: number; // 그룹 평균 (정밀값 유지)
      stats: Stat[];
    };
  };
}

/* =========================================================
 * 2. 규칙 상수 — 비즈니스 룰을 "데이터"로 분리
 * ========================================================= */

/** 그룹별 가중치 (합 = 1.0) */
const WEIGHTS: Record<GroupKey, number> = { A: 0.6, B: 0.3, C: 0.1 };

/** 그룹별 스탯 개수 */
const GROUP_SIZES: Record<GroupKey, number> = { A: 5, B: 7, C: 7 };

/**
 * 등급 컷라인 테이블 (위 → 아래, 첫 매칭 채택).
 * 컷이 바뀌면 if 문이 아니라 이 표만 수정한다.
 * 추후 A-, B+ 등 세분화도 행 추가만으로 확장 가능.
 */
const GRADE_TABLE: ReadonlyArray<{ min: number; grade: Grade }> = [
  { min: 99, grade: "S" },
  { min: 97, grade: "A+" },
  { min: 90, grade: "A" },
  { min: 80, grade: "B" },
  { min: 71, grade: "C" },
  { min: 70, grade: "C-" },
  { min: 0,  grade: "F" },
];

/* =========================================================
 * 3. 순수 계산 로직
 * ========================================================= */

/** 소수 첫째 자리 반올림 → 정수. (양수 half-up) */
const round = (n: number): number => Math.round(n);

const average = (stats: Stat[]): number =>
  stats.length === 0
    ? 0
    : stats.reduce((sum, s) => sum + s.value, 0) / stats.length;

/** 점수 → 등급 매핑 */
export function toGrade(score: number): Grade {
  return (GRADE_TABLE.find((row) => score >= row.min) ?? { grade: "F" }).grade;
}

/** 입력 검증: 그룹 개수(5/7/7) 및 점수 범위(0~100) */
function validate(input: CardInput): void {
  (Object.keys(GROUP_SIZES) as GroupKey[]).forEach((key) => {
    const stats = input.groups[key] ?? [];
    if (stats.length !== GROUP_SIZES[key]) {
      throw new Error(
        `[${key}] 그룹 스탯은 ${GROUP_SIZES[key]}개여야 합니다. (현재 ${stats.length}개)`
      );
    }
    stats.forEach((s) => {
      if (Number.isNaN(s.value) || s.value < 0 || s.value > 100) {
        throw new Error(
          `[${key}] "${s.name}" 점수는 0~100 범위여야 합니다. (입력: ${s.value})`
        );
      }
    });
  });
}

/* =========================================================
 * 4. 핵심 진입점
 * ========================================================= */

export function evaluateCard(input: CardInput): CardResult {
  validate(input);

  const groupKeys = Object.keys(WEIGHTS) as GroupKey[];

  const breakdown = groupKeys.reduce((acc, key) => {
    acc[key] = {
      weight: WEIGHTS[key],
      average: average(input.groups[key]),
      stats: input.groups[key],
    };
    return acc;
  }, {} as CardResult["breakdown"]);

  const weighted = groupKeys.reduce(
    (sum, key) => sum + breakdown[key].average * WEIGHTS[key],
    0
  );

  const finalScore = round(weighted);

  return {
    category: input.category,
    finalScore,
    grade: toGrade(finalScore),
    breakdown,
  };
}

/* =========================================================
 * 5. (선택) 컬렉션용 클래스 래퍼
 *    카드 다발을 다룰 때 인스턴스 단위로 쓰기 편하다.
 * ========================================================= */

export class TcgCard {
  readonly input: CardInput;
  readonly result: CardResult;

  constructor(input: CardInput) {
    this.input = input;
    this.result = evaluateCard(input); // 생성 시 1회 계산
  }

  get grade(): Grade { return this.result.grade; }
  get score(): number { return this.result.finalScore; }

  /** JSON.stringify(card) 시 평가 결과만 직렬화 */
  toJSON(): CardResult { return this.result; }
}

/* =========================================================
 * 6. 사용 예시 — 아래 입력은 최종 90점 / A 등급으로 떨어진다.
 * ========================================================= */

export const exampleInput: CardInput = {
  category: "백엔드 언어",
  groups: {
    A: [
      { key: "performance",  name: "처리 성능",   value: 96 },
      { key: "stability",    name: "안정성",     value: 94 },
      { key: "scalability",  name: "확장성",     value: 95 },
      { key: "learnability", name: "학습 난이도", value: 88 },
      { key: "ecosystem",    name: "생태계",     value: 92 },
    ], // 평균 93
    B: [
      { key: "documentation", name: "문서화",     value: 90 },
      { key: "community",     name: "커뮤니티",   value: 92 },
      { key: "tooling",       name: "툴링",       value: 91 },
      { key: "jobMarket",     name: "채용 시장",  value: 85 },
      { key: "typeSafety",    name: "타입 안정성", value: 96 },
      { key: "concurrency",   name: "동시성",     value: 80 },
      { key: "portability",   name: "이식성",     value: 88 },
    ], // 평균 ≈ 88.86
    C: [
      { key: "syntaxBeauty",   name: "문법 미려함",   value: 78 },
      { key: "memeFactor",     name: "밈 친화력",     value: 60 },
      { key: "legacySupport",  name: "레거시 지원",   value: 70 },
      { key: "mascotCharm",    name: "마스코트 매력", value: 85 },
      { key: "conferenceHype", name: "컨퍼런스 화제성", value: 72 },
      { key: "stickerCount",   name: "스티커 보유량", value: 88 },
      { key: "vibes",          name: "분위기",       value: 75 },
    ], // 평균 ≈ 75.43
  },
};

// 93*0.6 + (88.857..)*0.3 + (75.428..)*0.1 = 90.0 → "A"
// const card = new TcgCard(exampleInput);
// console.log(card.score, card.grade); // 90 "A"
