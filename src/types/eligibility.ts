// Eligibility Quiz Types

export type NicotineUseType = 
  | 'cigarettes' 
  | 'nicotine_vaping' 
  | 'nicotine_pouches' 
  | 'recently_quit' 
  | 'no_nicotine';

export type PreviousNRTUse = 
  | 'yes_helpful' 
  | 'yes_not_helpful' 
  | 'no';

export type NicotineIntensity = 
  | 'low' 
  | 'moderate' 
  | 'high';

export type NicotinePouchReason = 
  | 'reduce_stop_smoking' 
  | 'reduce_stop_vaping' 
  | 'avoid_smoke_vapour' 
  | 'convenience_discretion' 
  | 'other';

export type MedicalSafetyFlag = 
  | 'heart_disease' 
  | 'uncontrolled_bp' 
  | 'pregnant_breastfeeding' 
  | 'none';

export type AgeConfirmation = 
  | 'over_18' 
  | 'under_18';

export interface EligibilityAnswers {
  nicotine_use: NicotineUseType;
  previous_nrt_use: PreviousNRTUse;
  nicotine_intensity: NicotineIntensity;
  pouch_reason: NicotinePouchReason;
  pouch_reason_other?: string;
  medical_safety: MedicalSafetyFlag;
  age_confirmation: AgeConfirmation;
  consent_nicotine_risk: boolean;
  consent_no_guarantee: boolean;
  consent_doctor_discussion: boolean;
}

export interface EligibilityQuizResult {
  answers: EligibilityAnswers;
  result: 'eligible' | 'may_not_suitable' | 'not_eligible';
  completedAt: string;
}

export interface EligibilityQuizQuestion {
  id: keyof Omit<EligibilityAnswers, 'pouch_reason_other' | 'consent_nicotine_risk' | 'consent_no_guarantee' | 'consent_doctor_discussion'>;
  question: string;
  options: {
    value: string;
    label: string;
    flag?: 'warning' | 'block';
    showTextInput?: boolean;
  }[];
}

// Summary for doctor view
export interface EligibilitySummary {
  nicotineUsage: string;
  currentUse: string;
  priorNRTUse: string;
  intensity: string;
  safetyFlags: string;
  reason: string;
}

export function generateEligibilitySummary(answers: EligibilityAnswers): EligibilitySummary {
  const nicotineUseLabels: Record<NicotineUseType, string> = {
    cigarettes: 'Cigarettes',
    nicotine_vaping: 'Nicotine vaping',
    nicotine_pouches: 'Nicotine pouches',
    recently_quit: 'Recently quit smoking/vaping',
    no_nicotine: 'No current nicotine use'
  };

  const nrtLabels: Record<PreviousNRTUse, string> = {
    yes_helpful: 'Tried, helpful',
    yes_not_helpful: 'Tried, not helpful',
    no: 'No prior NRT use'
  };

  const intensityLabels: Record<NicotineIntensity, string> = {
    low: 'Low',
    moderate: 'Moderate',
    high: 'High'
  };

  const safetyLabels: Record<MedicalSafetyFlag, string> = {
    heart_disease: 'Heart disease or recent heart event',
    uncontrolled_bp: 'Uncontrolled high blood pressure',
    pregnant_breastfeeding: 'Pregnant or breastfeeding',
    none: 'None declared'
  };

  const reasonLabels: Record<NicotinePouchReason, string> = {
    reduce_stop_smoking: 'Reduce or stop smoking',
    reduce_stop_vaping: 'Reduce or stop vaping',
    avoid_smoke_vapour: 'Avoid smoke/vapour exposure',
    convenience_discretion: 'Convenience or discretion',
    other: 'Other'
  };

  return {
    nicotineUsage: intensityLabels[answers.nicotine_intensity] || 'Not specified',
    currentUse: nicotineUseLabels[answers.nicotine_use] || 'Not specified',
    priorNRTUse: nrtLabels[answers.previous_nrt_use] || 'Not specified',
    intensity: intensityLabels[answers.nicotine_intensity] || 'Not specified',
    safetyFlags: safetyLabels[answers.medical_safety] || 'None declared',
    reason: answers.pouch_reason === 'other' && answers.pouch_reason_other
      ? `Other: ${answers.pouch_reason_other}`
      : reasonLabels[answers.pouch_reason] || 'Not specified'
  };
}
