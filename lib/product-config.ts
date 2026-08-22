export const PRODUCT_CONFIG = {
  enem: {
    year: 2026,
    firstDayIso: "2026-11-08T13:30:00-03:00",
    secondDayIso: "2026-11-15T13:30:00-03:00"
  },
  credits: {
    freeTrialInitial: 3,
    essayReview: 1,
    tutorMessage: 1,
    tutorTool: 1,
    fileAnalysis: 2
  },
  features: {
    presentations: false,
    questions: true
  }
} as const;
