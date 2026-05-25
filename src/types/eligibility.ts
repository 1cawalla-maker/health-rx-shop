// Eligibility Quiz Types

export const ELIGIBILITY_COLLECTION_NOTICE_VERSION = '2026-05-22-v1';
export const ELIGIBILITY_PRIVACY_POLICY_VERSION = '2026-05-22-v1';

export type NicotineUseType =
  | 'cigarettes'
  | 'nicotine_vaping'
  | 'nicotine_pouches'
  | 'oral_nrt'
  | 'no_nicotine';

export type PreviousNRTUse =
  | 'yes_helpful'
  | 'yes_not_helpful'
  | 'no';

export type PreferredCessationProduct =
  | 'nicotine_pouches'
  | 'oral_nrt'
  | 'nicotine_patches'
  | 'prescription_medicine'
  | 'not_sure'
  | 'other';

export type MedicalSafetyFlag =
  | 'heart_stroke_blood_vessel'
  | 'uncontrolled_bp'
  | 'lung_disease_breathing'
  | 'seizures_epilepsy'
  | 'mental_health_severe'
  | 'diabetes_kidney_liver_serious'
  | 'pregnant_breastfeeding'
  | 'prefer_discuss'
  | 'none';

export type AgeConfirmation =
  | 'over_18'
  | 'under_18';

export type CurrentMedicationUse = 'no' | 'yes';
export type AllergyReactionAnswer = 'no' | 'yes' | 'not_sure';

export type CurrentPouchStrength =
  | '3mg'
  | '6mg'
  | '9mg'
  | '12mg'
  | 'other'
  | 'not_sure';

export type CurrentPouchDailyUse =
  | '1_5'
  | '6_10'
  | '11_20'
  | 'more_than_20'
  | 'not_sure';

export type OralHealthScreenAnswer = 'no' | 'yes' | 'not_sure';

export type OralNicotineReactionAnswer =
  | 'no'
  | 'yes'
  | 'not_sure'
  | 'never_used';

export interface EligibilityAnswers {
  collection_notice_acknowledged: boolean;
  collection_notice_version: string;
  privacy_policy_version: string;
  nicotine_use: NicotineUseType[];
  current_pouch_strength?: CurrentPouchStrength;
  current_pouch_strength_other?: string;
  current_pouch_daily_use?: CurrentPouchDailyUse;
  previous_nrt_use: PreviousNRTUse;
  preferred_cessation_product: PreferredCessationProduct;
  preferred_cessation_product_other?: string;
  medical_safety: MedicalSafetyFlag[];
  allergies_reactions: AllergyReactionAnswer;
  allergies_reactions_details?: string;
  oral_current_issues: OralHealthScreenAnswer;
  oral_unusual_changes: OralHealthScreenAnswer;
  oral_recent_dental_work: OralHealthScreenAnswer;
  oral_nicotine_reaction: OralNicotineReactionAnswer;
  oral_swallowing_choking_risk: OralHealthScreenAnswer;
  current_medications: CurrentMedicationUse;
  current_medications_details?: string;
  age_confirmation: AgeConfirmation;
  import_compliance_acknowledgement: boolean;
}

export type EligibilityQuizResultStatus = 'completed';

export interface EligibilityQuizResult {
  answers: EligibilityAnswers;
  /** Neutral storage status. Do not show eligibility judgements to patients. */
  result: EligibilityQuizResultStatus;
  completedAt: string;
  riskFlags?: string[];
  noticeVersion?: string;
  privacyPolicyVersion?: string;
}

export interface EligibilityQuizQuestion {
  id: keyof Pick<
    EligibilityAnswers,
    | 'nicotine_use'
    | 'current_pouch_strength'
    | 'current_pouch_daily_use'
    | 'previous_nrt_use'
    | 'preferred_cessation_product'
    | 'medical_safety'
    | 'allergies_reactions'
    | 'oral_current_issues'
    | 'oral_unusual_changes'
    | 'oral_recent_dental_work'
    | 'oral_nicotine_reaction'
    | 'oral_swallowing_choking_risk'
    | 'current_medications'
    | 'age_confirmation'
  >;
  question: string;
  description?: string;
  inputType?: 'single' | 'multi';
  exclusiveOptions?: string[];
  showWhen?: (answers: Partial<EligibilityAnswers>) => boolean;
  options: {
    value: string;
    label: string;
    flag?: 'warning' | 'block';
    showTextInput?: boolean;
    textInputLabel?: string;
    textInputPlaceholder?: string;
    textAnswerKey?: keyof EligibilityAnswers;
    textRequired?: boolean;
  }[];
}

// Summary for doctor view
export interface EligibilitySummary {
  currentUse: string;
  priorNRTUse: string;
  safetyFlags: string;
  pouchStrength: string;
  pouchDailyUse: string;
  preferredProduct: string;
  medications: string;
}

export function generateEligibilitySummary(answers: EligibilityAnswers): EligibilitySummary {
  const nicotineUseLabels: Record<NicotineUseType, string> = {
    cigarettes: 'Cigarettes',
    nicotine_vaping: 'Nicotine vaping',
    nicotine_pouches: 'Nicotine pouches',
    oral_nrt: 'Nicotine replacement therapy (gum, lozenges, spray or similar)',
    no_nicotine: 'No current nicotine use'
  };

  const nrtLabels: Record<PreviousNRTUse, string> = {
    yes_helpful: 'Tried, helpful',
    yes_not_helpful: 'Tried, not helpful',
    no: 'No prior NRT use'
  };

  const pouchStrengthLabels: Record<CurrentPouchStrength, string> = {
    '3mg': '3 mg',
    '6mg': '6 mg',
    '9mg': '9 mg',
    '12mg': '12 mg',
    other: 'Other strength',
    not_sure: 'Not sure'
  };

  const pouchDailyUseLabels: Record<CurrentPouchDailyUse, string> = {
    '1_5': '1–5 pouches/day',
    '6_10': '6–10 pouches/day',
    '11_20': '11–20 pouches/day',
    more_than_20: 'More than 20 pouches/day',
    not_sure: 'Not sure'
  };

  const safetyLabels: Record<MedicalSafetyFlag, string> = {
    heart_stroke_blood_vessel: 'Heart disease, stroke, blood vessel disease, or recent heart event',
    uncontrolled_bp: 'Uncontrolled high blood pressure',
    lung_disease_breathing: 'Significant lung disease or severe breathing symptoms',
    seizures_epilepsy: 'Seizures or epilepsy',
    mental_health_severe: 'Significant mental-health history or current severe symptoms',
    diabetes_kidney_liver_serious: 'Diabetes, kidney/liver disease, or another serious condition',
    pregnant_breastfeeding: 'Pregnant or breastfeeding',
    prefer_discuss: 'Prefer to discuss with the doctor',
    none: 'None declared'
  };

  const preferredProductLabels: Record<PreferredCessationProduct, string> = {
    nicotine_pouches: 'Nicotine pouches',
    oral_nrt: 'Nicotine replacement therapy such as gum, lozenges or spray',
    nicotine_patches: 'Nicotine patches',
    prescription_medicine: 'Prescription medicine to help stop smoking/vaping',
    not_sure: 'Not sure — wants doctor guidance',
    other: 'Other'
  };

  return {
    currentUse: answers.nicotine_use?.length
      ? answers.nicotine_use.map(use => nicotineUseLabels[use] || use).join(', ')
      : 'Not specified',
    priorNRTUse: nrtLabels[answers.previous_nrt_use] || 'Not specified',
    safetyFlags: answers.medical_safety?.length
      ? answers.medical_safety.map(flag => safetyLabels[flag] || flag).join(', ')
      : 'None declared',
    pouchStrength: answers.nicotine_use?.includes('nicotine_pouches')
      ? answers.current_pouch_strength === 'other' && answers.current_pouch_strength_other
        ? `Other: ${answers.current_pouch_strength_other}`
        : answers.current_pouch_strength
          ? pouchStrengthLabels[answers.current_pouch_strength] || 'Not specified'
          : 'Not specified'
      : 'Not applicable',
    pouchDailyUse: answers.nicotine_use?.includes('nicotine_pouches')
      ? answers.current_pouch_daily_use
        ? pouchDailyUseLabels[answers.current_pouch_daily_use] || 'Not specified'
        : 'Not specified'
      : 'Not applicable',
    preferredProduct: answers.preferred_cessation_product === 'other' && answers.preferred_cessation_product_other
      ? `Other: ${answers.preferred_cessation_product_other}`
      : preferredProductLabels[answers.preferred_cessation_product] || 'Not specified',
    medications: answers.current_medications === 'yes'
      ? (answers.current_medications_details || 'Yes — details not provided')
      : answers.current_medications === 'no'
        ? 'No current medicines/products declared'
        : 'Not specified'
  };
}
