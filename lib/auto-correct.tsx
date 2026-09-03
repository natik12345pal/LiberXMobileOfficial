'use client';

// Auto-correct rules for Indian English and common typos
export const AUTO_CORRECT_RULES: [string, string][] = [
  // Common typos
  ['teh', 'the'], ['adn', 'and'], ['taht', 'that'], ['htis', 'this'],
  ['wiht', 'with'], ['fro', 'for'], ['ot', 'to'], ['si', 'is'],
  ['it;s', "it's"], ['dont', "don't"], ['cant', "can't"], ['wont', "won't"],
  ['im', "I'm"], ['ive', "I've"], ['didnt', "didn't"], ['doesnt', "doesn't"],
  ['wasnt', "wasn't"], ['werent', "weren't"], ['couldnt', "couldn't"],
  ['shouldnt', "shouldn't"], ['wouldnt', "wouldn't"], ['isnt', "isn't"],
  ['arent', "aren't"], ['hasnt', "hasn't"], ['havent', "haven't"],
  ['recieve', 'receive'], ['occurence', 'occurrence'], ['occurrence', 'occurrence'],
  ['seperate', 'separate'], ['definately', 'definitely'], ['accomodate', 'accommodate'],
  ['occured', 'occurred'], ['untill', 'until'], ['which', 'which'],
  ['beleive', 'believe'], ['acheive', 'achieve'], ['sucess', 'success'],
  ['neccessary', 'necessary'], ['enviroment', 'environment'], ['goverment', 'government'],
  ['happend', 'happened'], ['begining', 'beginning'], ['writting', 'writing'],
  ['knowlege', 'knowledge'], ['grammer', 'grammar'], ['calender', 'calendar'],
  ['tommorow', 'tomorrow'], ['yestrday', 'yesterday'], ['beacuse', 'because'],
  ['becuase', 'because'], ['thier', 'their'], ['freind', 'friend'],
  ['peice', 'piece'], ['achive', 'achieve'], ['accross', 'across'],
  ['alot', 'a lot'], ['arguement', 'argument'], ['commited', 'committed'],
  ['concious', 'conscious'], ['curiousity', 'curiosity'], ['dissapear', 'disappear'],
  ['embarass', 'embarrass'], ['existance', 'existence'], ['expirience', 'experience'],
  ['gaurd', 'guard'], ['harrass', 'harass'], ['independant', 'independent'],
  ['innoculate', 'inoculate'], ['liason', 'liaison'], ['maintainance', 'maintenance'],
  ['millenium', 'millennium'], ['mischevious', 'mischievous'], ['neccesary', 'necessary'],
  ['noticable', 'noticeable'], ['paralel', 'parallel'], ['persue', 'pursue'],
  ['posession', 'possession'], ['privelege', 'privilege'], ['professer', 'professor'],
  ['recomend', 'recommend'], ['refered', 'referred'], ['relevent', 'relevant'],
  ['resistence', 'resistance'], ['responsability', 'responsibility'],
  ['sargent', 'sergeant'], ['suprise', 'surprise'], ['tommorrow', 'tomorrow'],
  ['truely', 'truly'], ['tyrany', 'tyranny'], ['unfortunatly', 'unfortunately'],
  ['vaccum', 'vacuum'], ['wierd', 'weird'], ['writting', 'writing'],
  // Indian context common words
  ['becoz', 'because'], ['pls', 'please'], ['u', 'you'], ['ur', 'your'],
  ['r', 'are'], ['da', 'the'], ['wid', 'with'], ['wen', 'when'],
  ['den', 'then'], ['dem', 'them'], ['dey', 'they'], ['widout', 'without'],
  ['n', 'and'], ['abt', 'about'], ['btw', 'by the way'], ['bcoz', 'because'],
];

// Build a lookup map for O(1) access
const ruleMap = new Map(AUTO_CORRECT_RULES);

export function shouldAutoCorrect(word: string): [boolean, string] {
  const lower = word.toLowerCase();
  const replacement = ruleMap.get(lower);
  if (replacement) return [true, replacement];
  return [false, word];
}

// Check if auto-correct is enabled
export function isAutoCorrectEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('liberxoffice-autocorrect') !== 'false'; // enabled by default
}

export function setAutoCorrectEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('liberxoffice-autocorrect', String(enabled));
}

// Apply auto-correct to text — used on paste or format
export function applyAutoCorrect(text: string): string {
  let result = text;
  AUTO_CORRECT_RULES.forEach(([from, to]) => {
    const regex = new RegExp(`\\b${from}\\b`, 'gi');
    result = result.replace(regex, to);
  });
  return result;
}

// Capitalize first letter after sentence end
export function capitalizeAfterSentence(text: string): string {
  return text.replace(/([.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase())
    .replace(/^([a-z])/, (_, c) => c.toUpperCase());
}
