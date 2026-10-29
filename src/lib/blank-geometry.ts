// Millimetre geometry of each blank family that is not part of the product data (holes, lids, mounted plates).
// Shared by the storefront drawing (ProductVisual) and the Gravostyle export guide, so both agree.

export const BLANK_GEOMETRY = {
  hexTag: { holeFromTopMm: 6.5, holeDiameterMm: 4, engraveOffsetYMm: 1.1 },
  keyfob: { holeFromLeftMm: 9, holeDiameterMm: 5.2, engraveFromLeftMm: 17 },
  lighter: { lidHeightMm: 19, cornerRadiusMm: 3.5 },
  cardholder: { bandFromLeftMm: 5, bandWidthMm: 8, cornerRadiusMm: 2 },
  flask: { capWidthMm: 30, capHeightMm: 12, shoulderDropMm: 2.5, shoulderMm: 24 },
  spoon: { bowlLengthMm: 42, paddleHalfWidthMm: 7, engraveEndInsetMm: 5 },
  cufflinks: { cornerRadiusMm: 1.6 },
  /** Engraved plate mounted on a larger object (the plate is the workshop blank). */
  plates: {
    "bowl-stand": { widthMm: 80, heightMm: 20 },
    collar: { widthMm: 50, heightMm: 14 },
    plaque: { widthMm: 150, heightMm: 100 },
    nameplate: { widthMm: 200, heightMm: 50 },
  },
} as const;
