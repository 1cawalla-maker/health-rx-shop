// Eligibility Quiz Types

export const ELIGIBILITY_COLLECTION_NOTICE_VERSION = '2026-06-30-pouch-intake-v1';
export const ELIGIBILITY_PRIVACY_POLICY_VERSION = '2026-05-22-v1';

export type AgeConfirmation = 'over_21' | 'under_21';

export type SmokerDeclaration = 'current_smoker' | 'previous_smoker' | 'never_smoked';

export type SmokingCessationIntention =
  | 'quit_smoking'
  | 'reduce_smoking'
  | 'stay_off_smoking'
  | 'stop_reduce_vaping'
  | 'discuss_pouches'
  | 'not_sure_doctor_guidance';

export type CigarettesPerDay =
  | 'current_1_5'
  | 'current_6_10'
  | 'current_11_20'
  | 'current_21_40'
  | 'current_more_than_40'
  | 'ex_1_5'
  | 'ex_6_10'
  | 'ex_11_20'
  | 'ex_21_40'
  | 'ex_more_than_40'
  | 'not_sure';

export type YearsSmoked = 'less_than_1' | '1_5' | '6_10' | '11_20' | 'more_than_20' | 'not_sure';

export type LastTobaccoUse =
  | 'today'
  | 'past_week'
  | 'past_1_4_weeks'
  | '1_6_months'
  | '6_12_months'
  | '1_2_years'
  | '2_5_years'
  | 'more_than_5_years'
  | 'not_sure';

export type QuitAttempts = 'none' | '1_2' | '3_5' | '6_10' | 'more_than_10' | 'not_sure';

export type PreviousCessationMethod =
  | 'cold_turkey'
  | 'quitline'
  | 'counselling_behavioural_support'
  | 'nicotine_patches'
  | 'nicotine_gum'
  | 'nicotine_lozenges'
  | 'nicotine_mouth_spray'
  | 'nicotine_inhalator'
  | 'combination_nrt'
  | 'varenicline_champix'
  | 'bupropion_zyban'
  | 'nicotine_vaping_product'
  | 'nicotine_pouches'
  | 'none_tried'
  | 'other';

export type RecentCardioScreen = 'no_conditions' | 'stable_controlled' | 'recent_or_uncontrolled' | 'not_sure' | 'prefer_discuss';
export type RecentLungScreen = 'no_condition' | 'stable_controlled' | 'recent_or_uncontrolled' | 'not_sure' | 'prefer_discuss';
export type PregnancyBreastfeedingScreen = 'pregnant' | 'trying_to_conceive' | 'breastfeeding' | 'none' | 'not_applicable';

export type AllergyReactionAnswer = 'no' | 'yes' | 'not_sure';

export type DentalGumHealth =
  | 'good_seen_dentist_12_months'
  | 'good_not_seen_dentist_12_months'
  | 'poor_seen_dentist_12_months'
  | 'poor_not_seen_dentist_12_months'
  | 'not_sure';

export type OralHealthIssue =
  | 'mouth_ulcers_sores_cuts_bleeding'
  | 'gum_disease_or_dental_infection'
  | 'severe_tooth_pain'
  | 'unexplained_mouth_or_throat_pain'
  | 'patches_lumps_swelling_numbness_non_healing'
  | 'recent_dental_or_oral_surgery'
  | 'swallowing_or_choking_risk'
  | 'none'
  | 'not_sure';

export type PouchDuration = 'new_to_pouches' | 'days_to_weeks' | 'months_to_1_year' | '1_2_years' | 'more_than_2_years' | 'never_used';
export type PouchHelpfulness = 'yes_helpful' | 'somewhat_helpful' | 'not_helpful' | 'not_sure' | 'not_tried_yet';

export type PouchStrength = '3mg' | '6mg' | '9mg' | '12mg' | 'other' | 'not_sure_doctor_advise';
export type DailyPouchQuantity = 'zero_unsure' | '1_5' | '6_10' | '11_20' | 'more_than_20' | 'not_sure';

export type PrescriptionTimingAcknowledgement = 'understand_no_backdating';

export type QuitPouchesTimeline = 'within_3_months' | 'within_6_months' | 'within_12_months' | 'yes_not_sure_when' | 'no_not_currently' | 'discuss_with_doctor';

export type PersonalUseDeclaration = 'confirm' | 'do_not_confirm';
export type PatientAuthorityDeclaration = 'confirm' | 'not_applicable';

export interface EligibilityAnswers {
  collection_notice_acknowledged: boolean;
  collection_notice_version: string;
  privacy_policy_version: string;

  age_confirmation: AgeConfirmation;
  smoker_declaration: SmokerDeclaration;
  smoking_cessation_intention: SmokingCessationIntention;
  cigarettes_per_day: CigarettesPerDay;
  years_smoked: YearsSmoked;
  last_tobacco_use: LastTobaccoUse;
  quit_attempts: QuitAttempts;
  previous_cessation_methods: PreviousCessationMethod[];
  previous_cessation_methods_other?: string;

  recent_cardio_screen: RecentCardioScreen;
  recent_lung_screen: RecentLungScreen;
  pregnancy_breastfeeding_screen: PregnancyBreastfeedingScreen;
  medical_conditions: string;
  current_medications: string;
  allergies_reactions: AllergyReactionAnswer;
  allergies_reactions_details?: string;

  dental_gum_health: DentalGumHealth;
  oral_health_issues: OralHealthIssue[];

  pouch_duration: PouchDuration;
  pouch_helpfulness: PouchHelpfulness;
  pouch_max_strength: PouchStrength;
  pouch_max_strength_other?: string;
  pouch_min_strength: PouchStrength;
  pouch_min_strength_other?: string;
  daily_pouch_quantity: DailyPouchQuantity;
  prescription_timing_acknowledgement: PrescriptionTimingAcknowledgement;
  quit_pouches_timeline: QuitPouchesTimeline;

  personal_use_declaration: PersonalUseDeclaration;
  patient_authority_declaration: PatientAuthorityDeclaration;
  final_truth_accuracy_contact_consent: boolean;
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
  id: keyof EligibilityAnswers;
  question: string;
  description?: string;
  inputType?: 'single' | 'multi' | 'text';
  exclusiveOptions?: string[];
  showWhen?: (answers: Partial<EligibilityAnswers>) => boolean;
  options?: {
    value: string;
    label: string;
    flag?: 'warning' | 'block';
    showTextInput?: boolean;
    textInputLabel?: string;
    textInputPlaceholder?: string;
    textAnswerKey?: keyof EligibilityAnswers;
    textRequired?: boolean;
  }[];
  textInputLabel?: string;
  textInputPlaceholder?: string;
  textRequired?: boolean;
}

export interface EligibilitySummary {
  age: string;
  smokerStatus: string;
  smokingGoal: string;
  smokingHistory: string;
  previousCessation: string;
  medicalRisk: string;
  medicines: string;
  oralHealth: string;
  pouchUse: string;
  requestedPouchRange: string;
  dailyPouchQuantity: string;
  quitPouchesTimeline: string;
}

export interface EligibilitySummaryField {
  label: string;
  value: string;
}

export interface EligibilitySummarySection {
  title: string;
  fields: EligibilitySummaryField[];
}

export const eligibilityAnswerLabels = {
  age_confirmation: {
    over_21: 'Yes, I am 21 years or older',
    under_21: 'No, I am under 21'
  },
  smoker_declaration: {
    current_smoker: 'Yes, I currently smoke cigarettes',
    previous_smoker: 'Yes, I previously smoked cigarettes',
    never_smoked: 'No, I have never smoked cigarettes'
  },
  smoking_cessation_intention: {
    quit_smoking: 'I want to quit smoking',
    reduce_smoking: 'I want to reduce smoking',
    stay_off_smoking: 'I have already quit smoking and want help staying off cigarettes',
    stop_reduce_vaping: 'I want to stop or reduce vaping',
    discuss_pouches: 'I want to discuss nicotine pouches as part of smoking cessation',
    not_sure_doctor_guidance: 'I am not sure and want doctor guidance'
  },
  cigarettes_per_day: {
    current_1_5: 'Current smoker: 1–5 cigarettes/day',
    current_6_10: 'Current smoker: 6–10 cigarettes/day',
    current_11_20: 'Current smoker: 11–20 cigarettes/day',
    current_21_40: 'Current smoker: 21–40 cigarettes/day',
    current_more_than_40: 'Current smoker: more than 40 cigarettes/day',
    ex_1_5: 'Ex-smoker: 1–5 cigarettes/day',
    ex_6_10: 'Ex-smoker: 6–10 cigarettes/day',
    ex_11_20: 'Ex-smoker: 11–20 cigarettes/day',
    ex_21_40: 'Ex-smoker: 21–40 cigarettes/day',
    ex_more_than_40: 'Ex-smoker: more than 40 cigarettes/day',
    not_sure: 'Not sure'
  },
  years_smoked: {
    less_than_1: 'Less than 1 year',
    '1_5': '1–5 years',
    '6_10': '6–10 years',
    '11_20': '11–20 years',
    more_than_20: 'More than 20 years',
    not_sure: 'Not sure'
  },
  last_tobacco_use: {
    today: 'Today',
    past_week: 'Within the past week',
    past_1_4_weeks: 'Within the past 1–4 weeks',
    '1_6_months': '1–6 months ago',
    '6_12_months': '6–12 months ago',
    '1_2_years': '1–2 years ago',
    '2_5_years': '2–5 years ago',
    more_than_5_years: 'More than 5 years ago',
    not_sure: 'Not sure'
  },
  quit_attempts: {
    none: 'I have not tried before',
    '1_2': '1–2 times',
    '3_5': '3–5 times',
    '6_10': '6–10 times',
    more_than_10: 'More than 10 times',
    not_sure: 'Not sure'
  },
  previous_cessation_methods: {
    cold_turkey: 'Cold turkey',
    quitline: 'Quitline',
    counselling_behavioural_support: 'Counselling, psychologist, or behavioural support',
    nicotine_patches: 'Nicotine patches',
    nicotine_gum: 'Nicotine gum',
    nicotine_lozenges: 'Nicotine lozenges',
    nicotine_mouth_spray: 'Nicotine mouth spray',
    nicotine_inhalator: 'Nicotine inhalator',
    combination_nrt: 'Combination nicotine replacement therapy',
    varenicline_champix: 'Varenicline / Champix',
    bupropion_zyban: 'Bupropion / Zyban',
    nicotine_vaping_product: 'Nicotine vaping product',
    nicotine_pouches: 'Nicotine pouches',
    none_tried: 'I have not tried any cessation methods before',
    other: 'Other'
  },
  recent_cardio_screen: {
    no_conditions: 'No, I do not have these conditions',
    stable_controlled: 'No, I have one of these conditions but it is stable/well controlled',
    recent_or_uncontrolled: 'Yes, I have had one of these issues recently or it is not well controlled',
    not_sure: 'Not sure',
    prefer_discuss: 'Prefer to discuss with doctor'
  },
  recent_lung_screen: {
    no_condition: 'No, I do not have this',
    stable_controlled: 'No, I have a lung condition but it is stable/well controlled',
    recent_or_uncontrolled: 'Yes, I have had recent or uncontrolled symptoms',
    not_sure: 'Not sure',
    prefer_discuss: 'Prefer to discuss with doctor'
  },
  pregnancy_breastfeeding_screen: {
    pregnant: 'I am pregnant',
    trying_to_conceive: 'I am trying to become pregnant',
    breastfeeding: 'I am breastfeeding',
    none: 'None of the above',
    not_applicable: 'Not applicable'
  },
  allergies_reactions: {
    no: 'No',
    yes: 'Yes — I will provide details',
    not_sure: 'Not sure'
  },
  dental_gum_health: {
    good_seen_dentist_12_months: 'Good dental/gum health and seen dentist in past 12 months',
    good_not_seen_dentist_12_months: 'Good dental/gum health but not seen dentist in past 12 months',
    poor_seen_dentist_12_months: 'Poor dental/gum health and seen dentist in past 12 months',
    poor_not_seen_dentist_12_months: 'May have poor dental/gum health and not seen dentist in past 12 months',
    not_sure: 'Not sure'
  },
  oral_health_issues: {
    mouth_ulcers_sores_cuts_bleeding: 'Mouth ulcers, sores, cuts, or bleeding gums',
    gum_disease_or_dental_infection: 'Gum disease or dental infection',
    severe_tooth_pain: 'Severe tooth pain',
    unexplained_mouth_or_throat_pain: 'Unexplained mouth or throat pain',
    patches_lumps_swelling_numbness_non_healing: 'White/red patches, lumps, swelling, numbness, or non-healing areas in the mouth',
    recent_dental_or_oral_surgery: 'Recent dental/oral surgery, tooth extraction, or gum treatment',
    swallowing_or_choking_risk: 'Difficulty swallowing or choking risk',
    none: 'None of the above',
    not_sure: 'Not sure'
  },
  pouch_duration: {
    new_to_pouches: 'I am completely new to nicotine pouches',
    days_to_weeks: 'A few days to weeks',
    months_to_1_year: 'A few months to 1 year',
    '1_2_years': '1–2 years',
    more_than_2_years: 'More than 2 years',
    never_used: 'I have never used nicotine pouches before'
  },
  pouch_helpfulness: {
    yes_helpful: 'Yes, they have been helpful',
    somewhat_helpful: 'Somewhat helpful',
    not_helpful: 'No, they have not been helpful',
    not_sure: 'I am not sure',
    not_tried_yet: 'I have not tried them yet'
  },
  pouch_strength: {
    '3mg': '3mg per pouch',
    '6mg': '6mg per pouch',
    '9mg': '9mg per pouch',
    '12mg': '12mg per pouch',
    other: 'Other',
    not_sure_doctor_advise: 'Not sure / doctor to advise'
  },
  daily_pouch_quantity: {
    zero_unsure: '0 — I have not used them before / unsure',
    '1_5': '1–5 per day',
    '6_10': '6–10 per day',
    '11_20': '11–20 per day',
    more_than_20: 'More than 20 per day',
    not_sure: 'Not sure'
  },
  prescription_timing_acknowledgement: {
    understand_no_backdating: 'I understand prescriptions cannot be backdated'
  },
  quit_pouches_timeline: {
    within_3_months: 'Yes, within the next 3 months',
    within_6_months: 'Yes, within the next 6 months',
    within_12_months: 'Yes, within the next 12 months',
    yes_not_sure_when: 'Yes, but I am not sure when',
    no_not_currently: 'No, not currently',
    discuss_with_doctor: 'I want to discuss this with the doctor'
  },
  personal_use_declaration: {
    confirm: 'I confirm',
    do_not_confirm: 'I do not confirm'
  },
  patient_authority_declaration: {
    confirm: 'I confirm',
    not_applicable: 'Not applicable'
  }
} as const;

function labelFromMap<T extends string>(map: Record<string, string>, value?: T): string {
  if (!value) return 'Not specified';
  return map[value] || value;
}

function labelArray(map: Record<string, string>, values?: string[], otherText?: string): string {
  if (!values?.length) return 'Not specified';
  return values.map(value => value === 'other' && otherText ? `Other: ${otherText}` : map[value] || value).join(', ');
}

function pouchStrengthLabel(value?: PouchStrength, other?: string): string {
  if (value === 'other' && other) return `Other: ${other}`;
  return labelFromMap(eligibilityAnswerLabels.pouch_strength, value);
}

export function generateEligibilitySummary(answers: EligibilityAnswers): EligibilitySummary {
  const labels = eligibilityAnswerLabels;
  const medicalFlags = [
    labelFromMap(labels.recent_cardio_screen, answers.recent_cardio_screen),
    labelFromMap(labels.recent_lung_screen, answers.recent_lung_screen),
    labelFromMap(labels.pregnancy_breastfeeding_screen, answers.pregnancy_breastfeeding_screen),
    answers.allergies_reactions === 'yes'
      ? `Allergies/reactions: ${answers.allergies_reactions_details || 'Yes — details not provided'}`
      : `Allergies/reactions: ${labelFromMap(labels.allergies_reactions, answers.allergies_reactions)}`,
    `Conditions: ${answers.medical_conditions || 'Not specified'}`
  ];

  return {
    age: labelFromMap(labels.age_confirmation, answers.age_confirmation),
    smokerStatus: labelFromMap(labels.smoker_declaration, answers.smoker_declaration),
    smokingGoal: labelFromMap(labels.smoking_cessation_intention, answers.smoking_cessation_intention),
    smokingHistory: [
      labelFromMap(labels.cigarettes_per_day, answers.cigarettes_per_day),
      labelFromMap(labels.years_smoked, answers.years_smoked),
      `Last tobacco use: ${labelFromMap(labels.last_tobacco_use, answers.last_tobacco_use)}`,
      `Quit attempts: ${labelFromMap(labels.quit_attempts, answers.quit_attempts)}`
    ].join(' • '),
    previousCessation: labelArray(labels.previous_cessation_methods, answers.previous_cessation_methods, answers.previous_cessation_methods_other),
    medicalRisk: medicalFlags.join(' • '),
    medicines: answers.current_medications || 'Not specified',
    oralHealth: [
      labelFromMap(labels.dental_gum_health, answers.dental_gum_health),
      labelArray(labels.oral_health_issues, answers.oral_health_issues)
    ].join(' • '),
    pouchUse: [
      `Duration: ${labelFromMap(labels.pouch_duration, answers.pouch_duration)}`,
      `Helpfulness: ${labelFromMap(labels.pouch_helpfulness, answers.pouch_helpfulness)}`
    ].join(' • '),
    requestedPouchRange: `${pouchStrengthLabel(answers.pouch_min_strength, answers.pouch_min_strength_other)} to ${pouchStrengthLabel(answers.pouch_max_strength, answers.pouch_max_strength_other)}`,
    dailyPouchQuantity: labelFromMap(labels.daily_pouch_quantity, answers.daily_pouch_quantity),
    quitPouchesTimeline: labelFromMap(labels.quit_pouches_timeline, answers.quit_pouches_timeline),
  };
}

export function generateEligibilityAttentionPoints(answers: EligibilityAnswers, riskFlags: string[] = []): string[] {
  const points = new Set<string>();

  if (answers.smoker_declaration === 'never_smoked') points.add('Clarify never-smoker declaration before considering nicotine treatment.');
  if (answers.recent_cardio_screen === 'recent_or_uncontrolled' || answers.recent_cardio_screen === 'not_sure' || answers.recent_cardio_screen === 'prefer_discuss') points.add('Review cardiovascular history/risk before treatment decision.');
  if (answers.recent_lung_screen === 'recent_or_uncontrolled' || answers.recent_lung_screen === 'not_sure' || answers.recent_lung_screen === 'prefer_discuss') points.add('Review recent/uncontrolled lung symptoms before treatment decision.');
  if (['pregnant', 'trying_to_conceive', 'breastfeeding'].includes(answers.pregnancy_breastfeeding_screen)) points.add('Pregnancy/breastfeeding/trying-to-conceive flag needs GP review.');
  if (answers.allergies_reactions === 'yes' || answers.allergies_reactions === 'not_sure') points.add('Clarify allergy/reaction history.');
  if (answers.dental_gum_health?.startsWith('poor') || answers.dental_gum_health === 'not_sure') points.add('Review oral/dental health before pouch discussion.');
  if ((answers.oral_health_issues || []).some(issue => !['none'].includes(issue))) points.add('Review reported oral-health symptoms.');
  if (answers.daily_pouch_quantity === 'more_than_20') points.add('High daily pouch quantity reported; assess nicotine dependence and reduction plan.');
  if (answers.pouch_max_strength === '12mg' || answers.pouch_max_strength === 'other') points.add('Requested/current pouch strength may need careful GP review.');

  riskFlags.forEach(flag => points.add(`Quiz risk flag: ${flag}`));

  return Array.from(points);
}

export function generateEligibilitySummarySections(answers: EligibilityAnswers, riskFlags: string[] = []): EligibilitySummarySection[] {
  const labels = eligibilityAnswerLabels;
  const attentionPoints = generateEligibilityAttentionPoints(answers, riskFlags);

  return [
    {
      title: 'Reason for consult',
      fields: [
        { label: 'Age confirmation', value: labelFromMap(labels.age_confirmation, answers.age_confirmation) },
        { label: 'Smoker declaration', value: labelFromMap(labels.smoker_declaration, answers.smoker_declaration) },
        { label: 'Main goal', value: labelFromMap(labels.smoking_cessation_intention, answers.smoking_cessation_intention) },
      ],
    },
    {
      title: 'Smoking / nicotine history',
      fields: [
        { label: 'Cigarettes per day', value: labelFromMap(labels.cigarettes_per_day, answers.cigarettes_per_day) },
        { label: 'Years smoked', value: labelFromMap(labels.years_smoked, answers.years_smoked) },
        { label: 'Last tobacco use', value: labelFromMap(labels.last_tobacco_use, answers.last_tobacco_use) },
        { label: 'Quit attempts', value: labelFromMap(labels.quit_attempts, answers.quit_attempts) },
        { label: 'Previous cessation methods', value: labelArray(labels.previous_cessation_methods, answers.previous_cessation_methods, answers.previous_cessation_methods_other) },
      ],
    },
    {
      title: 'Current pouch use / requested pouch context',
      fields: [
        { label: 'Pouch use duration', value: labelFromMap(labels.pouch_duration, answers.pouch_duration) },
        { label: 'Helped reduce/quit smoking', value: labelFromMap(labels.pouch_helpfulness, answers.pouch_helpfulness) },
        { label: 'Highest strength used/requested', value: pouchStrengthLabel(answers.pouch_max_strength, answers.pouch_max_strength_other) },
        { label: 'Lowest effective strength', value: pouchStrengthLabel(answers.pouch_min_strength, answers.pouch_min_strength_other) },
        { label: 'Daily pouch quantity', value: labelFromMap(labels.daily_pouch_quantity, answers.daily_pouch_quantity) },
        { label: 'Quit/reduce pouches timeline', value: labelFromMap(labels.quit_pouches_timeline, answers.quit_pouches_timeline) },
      ],
    },
    {
      title: 'Medical review flags',
      fields: [
        { label: 'Cardiovascular screen', value: labelFromMap(labels.recent_cardio_screen, answers.recent_cardio_screen) },
        { label: 'Lung screen', value: labelFromMap(labels.recent_lung_screen, answers.recent_lung_screen) },
        { label: 'Pregnancy/breastfeeding', value: labelFromMap(labels.pregnancy_breastfeeding_screen, answers.pregnancy_breastfeeding_screen) },
        { label: 'Allergies/reactions', value: answers.allergies_reactions === 'yes' ? `Yes — ${answers.allergies_reactions_details || 'details not provided'}` : labelFromMap(labels.allergies_reactions, answers.allergies_reactions) },
        { label: 'Medical conditions', value: answers.medical_conditions || 'Not specified' },
        { label: 'Current medicines/products', value: answers.current_medications || 'Not specified' },
      ],
    },
    {
      title: 'Oral/dental health',
      fields: [
        { label: 'Dental/gum health', value: labelFromMap(labels.dental_gum_health, answers.dental_gum_health) },
        { label: 'Oral health issues', value: labelArray(labels.oral_health_issues, answers.oral_health_issues) },
      ],
    },
    {
      title: 'Suggested GP attention points',
      fields: attentionPoints.length
        ? attentionPoints.map((point, index) => ({ label: `Point ${index + 1}`, value: point }))
        : [{ label: 'Point 1', value: 'No specific attention points generated from questionnaire answers.' }],
    },
  ];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateEligibilitySummaryHtml(args: {
  answers: EligibilityAnswers;
  riskFlags?: string[];
  completedAt?: string | null;
  consultationId?: string | null;
}): string {
  const sections = generateEligibilitySummarySections(args.answers, args.riskFlags || []);
  const meta = [
    args.completedAt ? `<p><strong>Completed:</strong> ${escapeHtml(new Date(args.completedAt).toLocaleString('en-AU'))}</p>` : '',
    args.consultationId ? `<p><strong>PouchCare consult ID:</strong> ${escapeHtml(args.consultationId)}</p>` : '',
  ].filter(Boolean).join('');

  return `
<h1>PouchCare intake summary</h1>
${meta}
${sections.map(section => `
<h2>${escapeHtml(section.title)}</h2>
<ul>
${section.fields.map(field => `  <li><strong>${escapeHtml(field.label)}:</strong> ${escapeHtml(field.value || 'Not specified')}</li>`).join('\n')}
</ul>`).join('\n')}
`.trim();
}
