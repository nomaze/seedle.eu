export const DEMO_FIELD_IDS = [
  "f-hinteracker",
  "f-muehlfeld",
  "f-hangbreite",
  "f-suedhang",
  "f-bachwiese",
  "f-feldmark-nord",
  "f-mosecker-schlag",
  "f-kreuzbreite",
  "f-am-holzweg",
  "fld_demo_voetting",
  "fld_demo_weihenstephan",
  "fld_demo_isarau",
  "fld_demo_feldmark_nord",
  "fld_demo_mosecker",
  "fld_demo_kreuzbreite",
  "fld_demo_holzweg",
];

export const DEMO_VARIETY_IDS = [
  "aw-talkrone",
  "aw-lichtkorn",
  "aw-morgenstern",
  "aw-ostwind",
  "aw-sonnenkraft",
  "fg-nordlicht",
  "fg-kontinent",
  "fg-kornfeld",
  "ah-bernstein",
  "ah-saphir",
  "ah-klassik",
  "bs-gipfel",
  "bs-tauern",
  "rz-sonnwend",
  "rz-mainau",
];

export function generateFieldStaticParams() {
  return DEMO_FIELD_IDS.map((fieldId) => ({ fieldId }));
}

export function generateFieldVarietyStaticParams() {
  const params: { fieldId: string; varietyId: string }[] = [];
  for (const fieldId of DEMO_FIELD_IDS) {
    for (const varietyId of DEMO_VARIETY_IDS) {
      params.push({ fieldId, varietyId });
    }
  }
  return params;
}
