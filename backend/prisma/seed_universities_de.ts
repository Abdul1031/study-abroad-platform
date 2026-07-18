/**
 * Nationwide seed: German PUBLIC higher-education institutions.
 *
 * Covers all 16 Bundesländer with three institution kinds:
 *   UNIVERSITY            — traditional research universities (Universitäten)
 *   TECHNICAL_UNIVERSITY  — technical universities (TU9 et al.)
 *   APPLIED_SCIENCES      — universities of applied sciences (HAW/FH)
 *
 * Idempotent: upserts by unique name; re-running refreshes metadata without
 * touching courses. Existing rows keep their ranking unless the entry
 * provides one. Run: npx tsx prisma/seed_universities_de.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type InstitutionType = 'UNIVERSITY' | 'TECHNICAL_UNIVERSITY' | 'APPLIED_SCIENCES';

interface SeedUniversity {
  name: string;
  city: string;
  state: string;
  type: InstitutionType;
  websiteUrl: string;
  foundedYear?: number;
  ranking?: number;
}

// ── Average student rent by city (EUR/month, approximate) ────────────────────
const RENT: Record<string, number> = {
  Munich: 1100,
  Berlin: 850,
  Hamburg: 900,
  Frankfurt: 950,
  Stuttgart: 950,
  Cologne: 800,
  Düsseldorf: 800,
  Heidelberg: 850,
  Freiburg: 800,
  Tübingen: 750,
  Darmstadt: 800,
  Aachen: 650,
  Karlsruhe: 750,
  Bonn: 750,
  Mainz: 750,
  Münster: 700,
  Nuremberg: 700,
  Hannover: 650,
  Bremen: 600,
  Leipzig: 550,
  Dresden: 550,
  Jena: 500,
  Konstanz: 800,
  Mannheim: 700,
  Würzburg: 650,
  Regensburg: 700,
  Augsburg: 750,
  Erlangen: 700,
  Göttingen: 600,
  Kiel: 600,
  Potsdam: 750,
  Wiesbaden: 800,
  Ulm: 700,
  Kassel: 550,
  Bochum: 550,
  Dortmund: 550,
  Essen: 550,
  Duisburg: 500,
  Wuppertal: 500,
  Bielefeld: 550,
};
const DEFAULT_RENT = 500;

// Baden-Württemberg charges non-EU students €1,500/semester at state institutions
const BW_TUITION = 1500;

const KIND_LABEL: Record<InstitutionType, string> = {
  UNIVERSITY: 'public research university',
  TECHNICAL_UNIVERSITY: 'public technical university',
  APPLIED_SCIENCES: 'public university of applied sciences',
};

// ═══════════════════════════════════════════════════════════════════════════
// The catalog — grouped by Bundesland
// ═══════════════════════════════════════════════════════════════════════════

const UNIVERSITIES: SeedUniversity[] = [
  // ── Baden-Württemberg ──────────────────────────────────────────────────────
  {
    name: 'Heidelberg University',
    city: 'Heidelberg',
    state: 'Baden-Württemberg',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-heidelberg.de',
    foundedYear: 1386,
    ranking: 87,
  },
  {
    name: 'University of Freiburg',
    city: 'Freiburg',
    state: 'Baden-Württemberg',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-freiburg.de',
    foundedYear: 1457,
    ranking: 189,
  },
  {
    name: 'University of Tübingen',
    city: 'Tübingen',
    state: 'Baden-Württemberg',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-tuebingen.de',
    foundedYear: 1477,
    ranking: 213,
  },
  {
    name: 'University of Stuttgart',
    city: 'Stuttgart',
    state: 'Baden-Württemberg',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.uni-stuttgart.de',
    foundedYear: 1829,
    ranking: 312,
  },
  {
    name: 'Karlsruhe Institute of Technology (KIT)',
    city: 'Karlsruhe',
    state: 'Baden-Württemberg',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.kit.edu',
    foundedYear: 1825,
    ranking: 119,
  },
  {
    name: 'University of Mannheim',
    city: 'Mannheim',
    state: 'Baden-Württemberg',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-mannheim.de',
    foundedYear: 1946,
  },
  {
    name: 'Ulm University',
    city: 'Ulm',
    state: 'Baden-Württemberg',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-ulm.de',
    foundedYear: 1967,
  },
  {
    name: 'University of Konstanz',
    city: 'Konstanz',
    state: 'Baden-Württemberg',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-konstanz.de',
    foundedYear: 1966,
  },
  {
    name: 'University of Hohenheim',
    city: 'Stuttgart',
    state: 'Baden-Württemberg',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-hohenheim.de',
    foundedYear: 1818,
  },
  {
    name: 'Esslingen University of Applied Sciences',
    city: 'Esslingen',
    state: 'Baden-Württemberg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-esslingen.de',
  },
  {
    name: 'Karlsruhe University of Applied Sciences',
    city: 'Karlsruhe',
    state: 'Baden-Württemberg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.h-ka.de',
  },
  {
    name: 'Mannheim University of Applied Sciences',
    city: 'Mannheim',
    state: 'Baden-Württemberg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-mannheim.de',
  },
  {
    name: 'Aalen University of Applied Sciences',
    city: 'Aalen',
    state: 'Baden-Württemberg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-aalen.de',
  },
  {
    name: 'Reutlingen University',
    city: 'Reutlingen',
    state: 'Baden-Württemberg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.reutlingen-university.de',
  },
  {
    name: 'Offenburg University of Applied Sciences',
    city: 'Offenburg',
    state: 'Baden-Württemberg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-offenburg.de',
  },
  {
    name: 'Pforzheim University',
    city: 'Pforzheim',
    state: 'Baden-Württemberg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-pforzheim.de',
  },
  {
    name: 'Furtwangen University',
    city: 'Furtwangen',
    state: 'Baden-Württemberg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-furtwangen.de',
  },
  {
    name: 'HTWG Konstanz University of Applied Sciences',
    city: 'Konstanz',
    state: 'Baden-Württemberg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.htwg-konstanz.de',
  },
  {
    name: 'Stuttgart University of Applied Sciences (HFT)',
    city: 'Stuttgart',
    state: 'Baden-Württemberg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hft-stuttgart.de',
  },
  {
    name: 'Heilbronn University of Applied Sciences',
    city: 'Heilbronn',
    state: 'Baden-Württemberg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-heilbronn.de',
  },
  {
    name: 'Stuttgart Media University (HdM)',
    city: 'Stuttgart',
    state: 'Baden-Württemberg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hdm-stuttgart.de',
  },
  {
    name: 'Biberach University of Applied Sciences',
    city: 'Biberach',
    state: 'Baden-Württemberg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hochschule-biberach.de',
  },
  {
    name: 'Ravensburg-Weingarten University (RWU)',
    city: 'Weingarten',
    state: 'Baden-Württemberg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.rwu.de',
  },
  {
    name: 'Albstadt-Sigmaringen University',
    city: 'Sigmaringen',
    state: 'Baden-Württemberg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-albsig.de',
  },

  // ── Bavaria ────────────────────────────────────────────────────────────────
  {
    name: 'LMU Munich',
    city: 'Munich',
    state: 'Bavaria',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.lmu.de',
    foundedYear: 1472,
    ranking: 59,
  },
  {
    name: 'Technical University of Munich (TUM)',
    city: 'Munich',
    state: 'Bavaria',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.tum.de',
    foundedYear: 1868,
    ranking: 37,
  },
  {
    name: 'FAU Erlangen-Nürnberg',
    city: 'Erlangen',
    state: 'Bavaria',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.fau.de',
    foundedYear: 1743,
  },
  {
    name: 'University of Würzburg',
    city: 'Würzburg',
    state: 'Bavaria',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-wuerzburg.de',
    foundedYear: 1402,
  },
  {
    name: 'University of Regensburg',
    city: 'Regensburg',
    state: 'Bavaria',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-regensburg.de',
    foundedYear: 1962,
  },
  {
    name: 'University of Augsburg',
    city: 'Augsburg',
    state: 'Bavaria',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-augsburg.de',
    foundedYear: 1970,
  },
  {
    name: 'University of Bayreuth',
    city: 'Bayreuth',
    state: 'Bavaria',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-bayreuth.de',
    foundedYear: 1975,
  },
  {
    name: 'University of Bamberg',
    city: 'Bamberg',
    state: 'Bavaria',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-bamberg.de',
    foundedYear: 1647,
  },
  {
    name: 'University of Passau',
    city: 'Passau',
    state: 'Bavaria',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-passau.de',
    foundedYear: 1978,
  },
  {
    name: 'Munich University of Applied Sciences (HM)',
    city: 'Munich',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hm.edu',
    foundedYear: 1971,
  },
  {
    name: 'Nuremberg Institute of Technology (TH Nürnberg)',
    city: 'Nuremberg',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.th-nuernberg.de',
  },
  {
    name: 'Technische Hochschule Ingolstadt',
    city: 'Ingolstadt',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.thi.de',
  },
  {
    name: 'Technische Hochschule Rosenheim',
    city: 'Rosenheim',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.th-rosenheim.de',
  },
  {
    name: 'Technische Hochschule Augsburg',
    city: 'Augsburg',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.tha.de',
  },
  {
    name: 'Coburg University of Applied Sciences',
    city: 'Coburg',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-coburg.de',
  },
  {
    name: 'Kempten University of Applied Sciences',
    city: 'Kempten',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-kempten.de',
  },
  {
    name: 'Landshut University of Applied Sciences',
    city: 'Landshut',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.haw-landshut.de',
  },
  {
    name: 'Deggendorf Institute of Technology (DIT)',
    city: 'Deggendorf',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.th-deg.de',
  },
  {
    name: 'Hof University of Applied Sciences',
    city: 'Hof',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hof-university.de',
  },
  {
    name: 'Ansbach University of Applied Sciences',
    city: 'Ansbach',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-ansbach.de',
  },
  {
    name: 'Technische Hochschule Aschaffenburg',
    city: 'Aschaffenburg',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.th-ab.de',
  },
  {
    name: 'Weihenstephan-Triesdorf University of Applied Sciences',
    city: 'Freising',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hswt.de',
  },
  {
    name: 'Neu-Ulm University of Applied Sciences',
    city: 'Neu-Ulm',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hnu.de',
  },
  {
    name: 'Technical University of Applied Sciences Würzburg-Schweinfurt',
    city: 'Würzburg',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.thws.de',
  },
  {
    name: 'OTH Regensburg',
    city: 'Regensburg',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.oth-regensburg.de',
  },
  {
    name: 'OTH Amberg-Weiden',
    city: 'Amberg',
    state: 'Bavaria',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.oth-aw.de',
  },

  // ── Berlin ─────────────────────────────────────────────────────────────────
  {
    name: 'Freie Universität Berlin',
    city: 'Berlin',
    state: 'Berlin',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.fu-berlin.de',
    foundedYear: 1948,
    ranking: 98,
  },
  {
    name: 'Humboldt University of Berlin',
    city: 'Berlin',
    state: 'Berlin',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.hu-berlin.de',
    foundedYear: 1810,
    ranking: 120,
  },
  {
    name: 'Technical University of Berlin (TU Berlin)',
    city: 'Berlin',
    state: 'Berlin',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.tu.berlin',
    foundedYear: 1879,
    ranking: 154,
  },
  {
    name: 'HTW Berlin — University of Applied Sciences',
    city: 'Berlin',
    state: 'Berlin',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.htw-berlin.de',
  },
  {
    name: 'Berliner Hochschule für Technik (BHT)',
    city: 'Berlin',
    state: 'Berlin',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.bht-berlin.de',
  },
  {
    name: 'Berlin School of Economics and Law (HWR)',
    city: 'Berlin',
    state: 'Berlin',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hwr-berlin.de',
  },
  {
    name: 'Alice Salomon University of Applied Sciences Berlin',
    city: 'Berlin',
    state: 'Berlin',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.ash-berlin.eu',
  },

  // ── Brandenburg ────────────────────────────────────────────────────────────
  {
    name: 'University of Potsdam',
    city: 'Potsdam',
    state: 'Brandenburg',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-potsdam.de',
    foundedYear: 1991,
  },
  {
    name: 'Brandenburg University of Technology (BTU)',
    city: 'Cottbus',
    state: 'Brandenburg',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.b-tu.de',
    foundedYear: 1991,
  },
  {
    name: 'European University Viadrina',
    city: 'Frankfurt (Oder)',
    state: 'Brandenburg',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.europa-uni.de',
    foundedYear: 1991,
  },
  {
    name: 'Technische Hochschule Wildau',
    city: 'Wildau',
    state: 'Brandenburg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.th-wildau.de',
  },
  {
    name: 'Potsdam University of Applied Sciences',
    city: 'Potsdam',
    state: 'Brandenburg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.fh-potsdam.de',
  },
  {
    name: 'Brandenburg University of Applied Sciences',
    city: 'Brandenburg an der Havel',
    state: 'Brandenburg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.th-brandenburg.de',
  },
  {
    name: 'Eberswalde University for Sustainable Development',
    city: 'Eberswalde',
    state: 'Brandenburg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hnee.de',
  },

  // ── Bremen ─────────────────────────────────────────────────────────────────
  {
    name: 'University of Bremen',
    city: 'Bremen',
    state: 'Bremen',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-bremen.de',
    foundedYear: 1971,
  },
  {
    name: 'Bremen University of Applied Sciences',
    city: 'Bremen',
    state: 'Bremen',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-bremen.de',
  },
  {
    name: 'Bremerhaven University of Applied Sciences',
    city: 'Bremerhaven',
    state: 'Bremen',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-bremerhaven.de',
  },

  // ── Hamburg ────────────────────────────────────────────────────────────────
  {
    name: 'University of Hamburg',
    city: 'Hamburg',
    state: 'Hamburg',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-hamburg.de',
    foundedYear: 1919,
    ranking: 205,
  },
  {
    name: 'Hamburg University of Technology (TUHH)',
    city: 'Hamburg',
    state: 'Hamburg',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.tuhh.de',
    foundedYear: 1978,
  },
  {
    name: 'HAW Hamburg — University of Applied Sciences',
    city: 'Hamburg',
    state: 'Hamburg',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.haw-hamburg.de',
  },
  {
    name: 'HafenCity University Hamburg',
    city: 'Hamburg',
    state: 'Hamburg',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.hcu-hamburg.de',
    foundedYear: 2006,
  },

  // ── Hesse ──────────────────────────────────────────────────────────────────
  {
    name: 'Goethe University Frankfurt',
    city: 'Frankfurt',
    state: 'Hesse',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-frankfurt.de',
    foundedYear: 1914,
    ranking: 302,
  },
  {
    name: 'Darmstadt University of Technology (TU Darmstadt)',
    city: 'Darmstadt',
    state: 'Hesse',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.tu-darmstadt.de',
    foundedYear: 1877,
    ranking: 246,
  },
  {
    name: 'University of Marburg',
    city: 'Marburg',
    state: 'Hesse',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-marburg.de',
    foundedYear: 1527,
  },
  {
    name: 'Justus Liebig University Giessen',
    city: 'Giessen',
    state: 'Hesse',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-giessen.de',
    foundedYear: 1607,
  },
  {
    name: 'University of Kassel',
    city: 'Kassel',
    state: 'Hesse',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-kassel.de',
    foundedYear: 1971,
  },
  {
    name: 'Frankfurt University of Applied Sciences',
    city: 'Frankfurt',
    state: 'Hesse',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.frankfurt-university.de',
  },
  {
    name: 'Darmstadt University of Applied Sciences (h_da)',
    city: 'Darmstadt',
    state: 'Hesse',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.h-da.de',
  },
  {
    name: 'Technische Hochschule Mittelhessen (THM)',
    city: 'Giessen',
    state: 'Hesse',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.thm.de',
  },
  {
    name: 'RheinMain University of Applied Sciences',
    city: 'Wiesbaden',
    state: 'Hesse',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-rm.de',
  },
  {
    name: 'Fulda University of Applied Sciences',
    city: 'Fulda',
    state: 'Hesse',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-fulda.de',
  },
  {
    name: 'Hochschule Geisenheim University',
    city: 'Geisenheim',
    state: 'Hesse',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-geisenheim.de',
  },

  // ── Mecklenburg-Vorpommern ─────────────────────────────────────────────────
  {
    name: 'University of Rostock',
    city: 'Rostock',
    state: 'Mecklenburg-Vorpommern',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-rostock.de',
    foundedYear: 1419,
  },
  {
    name: 'University of Greifswald',
    city: 'Greifswald',
    state: 'Mecklenburg-Vorpommern',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-greifswald.de',
    foundedYear: 1456,
  },
  {
    name: 'Wismar University of Applied Sciences',
    city: 'Wismar',
    state: 'Mecklenburg-Vorpommern',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-wismar.de',
  },
  {
    name: 'Stralsund University of Applied Sciences',
    city: 'Stralsund',
    state: 'Mecklenburg-Vorpommern',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hochschule-stralsund.de',
  },
  {
    name: 'Neubrandenburg University of Applied Sciences',
    city: 'Neubrandenburg',
    state: 'Mecklenburg-Vorpommern',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-nb.de',
  },

  // ── Lower Saxony ───────────────────────────────────────────────────────────
  {
    name: 'University of Göttingen',
    city: 'Göttingen',
    state: 'Lower Saxony',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-goettingen.de',
    foundedYear: 1737,
  },
  {
    name: 'Leibniz University Hannover',
    city: 'Hannover',
    state: 'Lower Saxony',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.uni-hannover.de',
    foundedYear: 1831,
  },
  {
    name: 'TU Braunschweig',
    city: 'Braunschweig',
    state: 'Lower Saxony',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.tu-braunschweig.de',
    foundedYear: 1745,
  },
  {
    name: 'Clausthal University of Technology',
    city: 'Clausthal-Zellerfeld',
    state: 'Lower Saxony',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.tu-clausthal.de',
    foundedYear: 1775,
  },
  {
    name: 'University of Oldenburg',
    city: 'Oldenburg',
    state: 'Lower Saxony',
    type: 'UNIVERSITY',
    websiteUrl: 'https://uol.de',
    foundedYear: 1973,
  },
  {
    name: 'Osnabrück University',
    city: 'Osnabrück',
    state: 'Lower Saxony',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-osnabrueck.de',
    foundedYear: 1974,
  },
  {
    name: 'University of Hildesheim',
    city: 'Hildesheim',
    state: 'Lower Saxony',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-hildesheim.de',
    foundedYear: 1978,
  },
  {
    name: 'University of Vechta',
    city: 'Vechta',
    state: 'Lower Saxony',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-vechta.de',
  },
  {
    name: 'Leuphana University of Lüneburg',
    city: 'Lüneburg',
    state: 'Lower Saxony',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.leuphana.de',
    foundedYear: 1946,
  },
  {
    name: 'Hannover Medical School (MHH)',
    city: 'Hannover',
    state: 'Lower Saxony',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.mhh.de',
    foundedYear: 1965,
  },
  {
    name: 'Hochschule Hannover — University of Applied Sciences',
    city: 'Hannover',
    state: 'Lower Saxony',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-hannover.de',
  },
  {
    name: 'Osnabrück University of Applied Sciences',
    city: 'Osnabrück',
    state: 'Lower Saxony',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-osnabrueck.de',
  },
  {
    name: 'Jade University of Applied Sciences',
    city: 'Wilhelmshaven',
    state: 'Lower Saxony',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.jade-hs.de',
  },
  {
    name: 'Emden/Leer University of Applied Sciences',
    city: 'Emden',
    state: 'Lower Saxony',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-emden-leer.de',
  },
  {
    name: 'Ostfalia University of Applied Sciences',
    city: 'Wolfenbüttel',
    state: 'Lower Saxony',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.ostfalia.de',
  },
  {
    name: 'HAWK Hildesheim/Holzminden/Göttingen',
    city: 'Hildesheim',
    state: 'Lower Saxony',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hawk.de',
  },

  // ── North Rhine-Westphalia ─────────────────────────────────────────────────
  {
    name: 'RWTH Aachen University',
    city: 'Aachen',
    state: 'North Rhine-Westphalia',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.rwth-aachen.de',
    foundedYear: 1870,
    ranking: 106,
  },
  {
    name: 'University of Cologne',
    city: 'Cologne',
    state: 'North Rhine-Westphalia',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-koeln.de',
    foundedYear: 1388,
  },
  {
    name: 'University of Bonn',
    city: 'Bonn',
    state: 'North Rhine-Westphalia',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-bonn.de',
    foundedYear: 1818,
    ranking: 239,
  },
  {
    name: 'University of Münster',
    city: 'Münster',
    state: 'North Rhine-Westphalia',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-muenster.de',
    foundedYear: 1780,
  },
  {
    name: 'Bielefeld University',
    city: 'Bielefeld',
    state: 'North Rhine-Westphalia',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-bielefeld.de',
    foundedYear: 1969,
  },
  {
    name: 'Ruhr University Bochum',
    city: 'Bochum',
    state: 'North Rhine-Westphalia',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.ruhr-uni-bochum.de',
    foundedYear: 1962,
  },
  {
    name: 'TU Dortmund University',
    city: 'Dortmund',
    state: 'North Rhine-Westphalia',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.tu-dortmund.de',
    foundedYear: 1968,
  },
  {
    name: 'University of Duisburg-Essen',
    city: 'Essen',
    state: 'North Rhine-Westphalia',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-due.de',
    foundedYear: 2003,
  },
  {
    name: 'Heinrich Heine University Düsseldorf',
    city: 'Düsseldorf',
    state: 'North Rhine-Westphalia',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.hhu.de',
    foundedYear: 1965,
  },
  {
    name: 'University of Wuppertal',
    city: 'Wuppertal',
    state: 'North Rhine-Westphalia',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-wuppertal.de',
    foundedYear: 1972,
  },
  {
    name: 'University of Siegen',
    city: 'Siegen',
    state: 'North Rhine-Westphalia',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-siegen.de',
    foundedYear: 1972,
  },
  {
    name: 'Paderborn University',
    city: 'Paderborn',
    state: 'North Rhine-Westphalia',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-paderborn.de',
    foundedYear: 1972,
  },
  {
    name: 'FernUniversität in Hagen',
    city: 'Hagen',
    state: 'North Rhine-Westphalia',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.fernuni-hagen.de',
    foundedYear: 1974,
  },
  {
    name: 'German Sport University Cologne',
    city: 'Cologne',
    state: 'North Rhine-Westphalia',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.dshs-koeln.de',
    foundedYear: 1947,
  },
  {
    name: 'FH Aachen — University of Applied Sciences',
    city: 'Aachen',
    state: 'North Rhine-Westphalia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.fh-aachen.de',
  },
  {
    name: 'TH Köln — University of Applied Sciences',
    city: 'Cologne',
    state: 'North Rhine-Westphalia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.th-koeln.de',
  },
  {
    name: 'Fachhochschule Dortmund',
    city: 'Dortmund',
    state: 'North Rhine-Westphalia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.fh-dortmund.de',
  },
  {
    name: 'Hochschule Düsseldorf (HSD)',
    city: 'Düsseldorf',
    state: 'North Rhine-Westphalia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-duesseldorf.de',
  },
  {
    name: 'FH Münster University of Applied Sciences',
    city: 'Münster',
    state: 'North Rhine-Westphalia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.fh-muenster.de',
  },
  {
    name: 'Hochschule Bielefeld (HSBI)',
    city: 'Bielefeld',
    state: 'North Rhine-Westphalia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hsbi.de',
  },
  {
    name: 'Bochum University of Applied Sciences',
    city: 'Bochum',
    state: 'North Rhine-Westphalia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hochschule-bochum.de',
  },
  {
    name: 'South Westphalia University of Applied Sciences',
    city: 'Iserlohn',
    state: 'North Rhine-Westphalia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.fh-swf.de',
  },
  {
    name: 'Niederrhein University of Applied Sciences',
    city: 'Krefeld',
    state: 'North Rhine-Westphalia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-niederrhein.de',
  },
  {
    name: 'Westphalian University of Applied Sciences',
    city: 'Gelsenkirchen',
    state: 'North Rhine-Westphalia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.w-hs.de',
  },
  {
    name: 'TH OWL — University of Applied Sciences and Arts',
    city: 'Lemgo',
    state: 'North Rhine-Westphalia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.th-owl.de',
  },
  {
    name: 'Ruhr West University of Applied Sciences',
    city: 'Mülheim an der Ruhr',
    state: 'North Rhine-Westphalia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hochschule-ruhr-west.de',
  },
  {
    name: 'Rhine-Waal University of Applied Sciences',
    city: 'Kleve',
    state: 'North Rhine-Westphalia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hochschule-rhein-waal.de',
  },
  {
    name: 'Bonn-Rhein-Sieg University of Applied Sciences',
    city: 'Sankt Augustin',
    state: 'North Rhine-Westphalia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.h-brs.de',
  },
  {
    name: 'Hamm-Lippstadt University of Applied Sciences',
    city: 'Hamm',
    state: 'North Rhine-Westphalia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hshl.de',
  },

  // ── Rhineland-Palatinate ───────────────────────────────────────────────────
  {
    name: 'Johannes Gutenberg University Mainz',
    city: 'Mainz',
    state: 'Rhineland-Palatinate',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-mainz.de',
    foundedYear: 1477,
  },
  {
    name: 'Trier University',
    city: 'Trier',
    state: 'Rhineland-Palatinate',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-trier.de',
    foundedYear: 1473,
  },
  {
    name: 'University of Koblenz',
    city: 'Koblenz',
    state: 'Rhineland-Palatinate',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-koblenz.de',
  },
  {
    name: 'RPTU Kaiserslautern-Landau',
    city: 'Kaiserslautern',
    state: 'Rhineland-Palatinate',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.rptu.de',
    foundedYear: 1970,
  },
  {
    name: 'Mainz University of Applied Sciences',
    city: 'Mainz',
    state: 'Rhineland-Palatinate',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-mainz.de',
  },
  {
    name: 'Koblenz University of Applied Sciences',
    city: 'Koblenz',
    state: 'Rhineland-Palatinate',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-koblenz.de',
  },
  {
    name: 'Trier University of Applied Sciences',
    city: 'Trier',
    state: 'Rhineland-Palatinate',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hochschule-trier.de',
  },
  {
    name: 'Kaiserslautern University of Applied Sciences',
    city: 'Kaiserslautern',
    state: 'Rhineland-Palatinate',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-kl.de',
  },
  {
    name: 'Worms University of Applied Sciences',
    city: 'Worms',
    state: 'Rhineland-Palatinate',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-worms.de',
  },
  {
    name: 'TH Bingen — University of Applied Sciences',
    city: 'Bingen',
    state: 'Rhineland-Palatinate',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.th-bingen.de',
  },
  {
    name: 'Ludwigshafen University of Business and Society',
    city: 'Ludwigshafen',
    state: 'Rhineland-Palatinate',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hwg-lu.de',
  },

  // ── Saarland ───────────────────────────────────────────────────────────────
  {
    name: 'Saarland University',
    city: 'Saarbrücken',
    state: 'Saarland',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-saarland.de',
    foundedYear: 1948,
  },
  {
    name: 'htw saar — University of Applied Sciences',
    city: 'Saarbrücken',
    state: 'Saarland',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.htwsaar.de',
  },

  // ── Saxony ─────────────────────────────────────────────────────────────────
  {
    name: 'TU Dresden',
    city: 'Dresden',
    state: 'Saxony',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.tu-dresden.de',
    foundedYear: 1828,
  },
  {
    name: 'Leipzig University',
    city: 'Leipzig',
    state: 'Saxony',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-leipzig.de',
    foundedYear: 1409,
  },
  {
    name: 'Chemnitz University of Technology',
    city: 'Chemnitz',
    state: 'Saxony',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.tu-chemnitz.de',
    foundedYear: 1836,
  },
  {
    name: 'TU Bergakademie Freiberg',
    city: 'Freiberg',
    state: 'Saxony',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.tu-freiberg.de',
    foundedYear: 1765,
  },
  {
    name: 'HTW Dresden — University of Applied Sciences',
    city: 'Dresden',
    state: 'Saxony',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.htw-dresden.de',
  },
  {
    name: 'HTWK Leipzig — University of Applied Sciences',
    city: 'Leipzig',
    state: 'Saxony',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.htwk-leipzig.de',
  },
  {
    name: 'Mittweida University of Applied Sciences',
    city: 'Mittweida',
    state: 'Saxony',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-mittweida.de',
  },
  {
    name: 'Zwickau University of Applied Sciences',
    city: 'Zwickau',
    state: 'Saxony',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.fh-zwickau.de',
  },
  {
    name: 'Zittau/Görlitz University of Applied Sciences',
    city: 'Zittau',
    state: 'Saxony',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hszg.de',
  },

  // ── Saxony-Anhalt ──────────────────────────────────────────────────────────
  {
    name: 'Martin Luther University Halle-Wittenberg',
    city: 'Halle',
    state: 'Saxony-Anhalt',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-halle.de',
    foundedYear: 1502,
  },
  {
    name: 'Otto von Guericke University Magdeburg',
    city: 'Magdeburg',
    state: 'Saxony-Anhalt',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.ovgu.de',
    foundedYear: 1993,
  },
  {
    name: 'Anhalt University of Applied Sciences',
    city: 'Köthen',
    state: 'Saxony-Anhalt',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-anhalt.de',
  },
  {
    name: 'Magdeburg-Stendal University of Applied Sciences',
    city: 'Magdeburg',
    state: 'Saxony-Anhalt',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.h2.de',
  },
  {
    name: 'Harz University of Applied Sciences',
    city: 'Wernigerode',
    state: 'Saxony-Anhalt',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-harz.de',
  },
  {
    name: 'Merseburg University of Applied Sciences',
    city: 'Merseburg',
    state: 'Saxony-Anhalt',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-merseburg.de',
  },

  // ── Schleswig-Holstein ─────────────────────────────────────────────────────
  {
    name: 'Kiel University (CAU)',
    city: 'Kiel',
    state: 'Schleswig-Holstein',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-kiel.de',
    foundedYear: 1665,
  },
  {
    name: 'University of Lübeck',
    city: 'Lübeck',
    state: 'Schleswig-Holstein',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-luebeck.de',
    foundedYear: 1964,
  },
  {
    name: 'Europa-Universität Flensburg',
    city: 'Flensburg',
    state: 'Schleswig-Holstein',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-flensburg.de',
    foundedYear: 1994,
  },
  {
    name: 'Kiel University of Applied Sciences',
    city: 'Kiel',
    state: 'Schleswig-Holstein',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.fh-kiel.de',
  },
  {
    name: 'Technische Hochschule Lübeck',
    city: 'Lübeck',
    state: 'Schleswig-Holstein',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.th-luebeck.de',
  },
  {
    name: 'Flensburg University of Applied Sciences',
    city: 'Flensburg',
    state: 'Schleswig-Holstein',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-flensburg.de',
  },
  {
    name: 'West Coast University of Applied Sciences',
    city: 'Heide',
    state: 'Schleswig-Holstein',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.fh-westkueste.de',
  },

  // ── Thuringia ──────────────────────────────────────────────────────────────
  {
    name: 'Friedrich Schiller University Jena',
    city: 'Jena',
    state: 'Thuringia',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-jena.de',
    foundedYear: 1558,
  },
  {
    name: 'Ilmenau University of Technology',
    city: 'Ilmenau',
    state: 'Thuringia',
    type: 'TECHNICAL_UNIVERSITY',
    websiteUrl: 'https://www.tu-ilmenau.de',
    foundedYear: 1894,
  },
  {
    name: 'University of Erfurt',
    city: 'Erfurt',
    state: 'Thuringia',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-erfurt.de',
    foundedYear: 1379,
  },
  {
    name: 'Bauhaus-Universität Weimar',
    city: 'Weimar',
    state: 'Thuringia',
    type: 'UNIVERSITY',
    websiteUrl: 'https://www.uni-weimar.de',
    foundedYear: 1860,
  },
  {
    name: 'Ernst Abbe University of Applied Sciences Jena',
    city: 'Jena',
    state: 'Thuringia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.eah-jena.de',
  },
  {
    name: 'Erfurt University of Applied Sciences',
    city: 'Erfurt',
    state: 'Thuringia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.fh-erfurt.de',
  },
  {
    name: 'Nordhausen University of Applied Sciences',
    city: 'Nordhausen',
    state: 'Thuringia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-nordhausen.de',
  },
  {
    name: 'Schmalkalden University of Applied Sciences',
    city: 'Schmalkalden',
    state: 'Thuringia',
    type: 'APPLIED_SCIENCES',
    websiteUrl: 'https://www.hs-schmalkalden.de',
  },
];

// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`Seeding ${UNIVERSITIES.length} German public institutions…`);

  let created = 0;
  let updated = 0;

  for (const uni of UNIVERSITIES) {
    const tuition = uni.state === 'Baden-Württemberg' ? BW_TUITION : 0;
    const rent = RENT[uni.city] ?? DEFAULT_RENT;
    const description =
      `${uni.name} is a ${KIND_LABEL[uni.type]} in ${uni.city}, ${uni.state}` +
      `${uni.foundedYear ? `, founded in ${uni.foundedYear}` : ''}. ` +
      `As a public institution it charges ${tuition === 0 ? 'no tuition fees' : `€${tuition}/semester for non-EU students`}, ` +
      `with only a semester contribution covering administration and public transport.`;

    const shared = {
      city: uni.city,
      state: uni.state,
      type: uni.type,
      websiteUrl: uni.websiteUrl,
      foundedYear: uni.foundedYear ?? null,
      tuitionFeeEuros: tuition,
      averageRentEuros: rent,
      hasStudentDormitory: true,
      description,
      isActive: true,
    };

    const existing = await prisma.university.findUnique({ where: { name: uni.name } });
    if (existing) {
      await prisma.university.update({
        where: { name: uni.name },
        data: {
          ...shared,
          // Never downgrade a known ranking to null on refresh
          ...(uni.ranking != null ? { ranking: uni.ranking } : {}),
        },
      });
      updated++;
    } else {
      await prisma.university.create({
        data: { ...shared, name: uni.name, ranking: uni.ranking ?? null },
      });
      created++;
    }
  }

  const total = await prisma.university.count({ where: { isActive: true } });
  const byType = await prisma.university.groupBy({ by: ['type'], _count: { id: true } });
  const byState = await prisma.university.groupBy({ by: ['state'], _count: { id: true } });

  console.log(`✅ Done. Created ${created}, updated ${updated}. Total active: ${total}`);
  console.log('By type:', byType.map((t) => `${t.type}=${t._count.id}`).join(', '));
  console.log(`States covered: ${byState.length}/16`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
