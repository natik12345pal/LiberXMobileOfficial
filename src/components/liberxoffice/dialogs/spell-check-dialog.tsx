'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';

const COMMON_WORDS = new Set([
  'a','an','the','is','are','was','were','be','been','being','have','has','had','do','does','did',
  'will','would','shall','should','may','might','must','can','could','i','me','my','myself','we',
  'our','ours','ourselves','you','your','yours','yourself','yourselves','he','him','his','himself',
  'she','her','hers','herself','it','its','itself','they','them','their','theirs','themselves',
  'what','which','who','whom','this','that','these','those','am','at','by','for','with','about',
  'against','between','through','during','before','after','above','below','to','from','up','down',
  'in','out','on','off','over','under','again','further','then','once','here','there','when','where',
  'why','how','all','both','each','few','more','most','other','some','such','no','nor','not','only',
  'own','same','so','than','too','very','s','t','just','don','should','now','and','but','or','if',
  'of','as','into','also','like','new','one','two','three','four','five','six','seven','eight',
  'nine','ten','first','second','third','time','year','people','way','day','man','woman','child',
  'world','life','hand','part','place','case','week','company','system','program','question','work',
  'government','number','night','point','home','water','room','mother','area','money','story','fact',
  'month','lot','right','study','book','eye','job','word','business','issue','side','kind','head',
  'house','service','friend','father','power','hour','game','line','end','member','law','car','city',
  'community','name','president','team','minute','idea','body','information','back','parent','face',
  'others','level','office','door','health','person','art','war','history','party','result','change',
  'morning','reason','research','girl','guy','moment','air','teacher','force','education','student',
  'group','country','problem','today','thing','school','family','society','state','college','interest',
  'experience','effect','use','class','plan','report','letter','river','land','age','police','music',
  'paper','often','develop','food','market','sense','product','role','field','figure','model','source',
  'example','include','although','public','speak','already','thought','possible','national','high',
  'during','short','better','best','long','great','little','old','big','small','large','next','early',
  'young','important','different','used','make','made','good','well','know','take','come','want',
  'give','say','go','see','get','find','tell','think','look','help','turn','start','show','hear',
  'play','run','move','live','believe','hold','bring','happen','write','provide','sit','stand',
  'lose','pay','meet','include','continue','set','learn','change','lead','understand','watch',
  'follow','stop','create','speak','read','allow','add','spend','grow','open','walk','win','offer',
  'remember','love','consider','appear','buy','wait','serve','die','send','expect','build','stay',
  'fall','cut','reach','kill','remain','suggest','raise','pass','sell','require','report','decide',
  'pull','develop','begin','receive','agree','support','hit','produce','eat','cover','catch','draw',
  'choose','cause','point','call','keep','leave','mean','put','seem','need','try','leave','ask',
  'might','last','still','much','before','after','because','between','while','where','most','never',
  'every','another','since','very','even','own','same','able','about','going','doing','having',
  'taken','given','known','found','told','thought','gone','left','come','become','done','seen',
  'been','making','looking','working','using','getting','saying','trying','taking','giving','knowing',
  'going','coming','seeing','wanting','let','need','may','way','many','well','back','then','them',
  'these','those','such','only','over','also','new','just','any','more','some','most','own','same',
  'able','upon','shall','per','within','without','however','therefore','thus','whether','either',
  'neither','rather','quite','enough','perhaps','almost','always','often','sometimes','never','ever',
  'please','thank','thanks','sorry','yes','dear','sir','madam','subject','date','regards','faithfully',
  'sincerely','yours','truly','mr','mrs','ms','dr','prof','etc','eg','ie','vs','approx','january',
  'february','march','april','may','june','july','august','september','october','november','december',
  'monday','tuesday','wednesday','thursday','friday','saturday','sunday','spring','summer','autumn',
  'winter','red','blue','green','yellow','black','white','brown','orange','purple','pink','gray',
  'english','science','mathematics','history','geography','computer','physics','chemistry','biology',
  'student','teacher','principal','school','college','university','education','exam','paper','marks',
  'percentage','grade','chapter','paragraph','sentence','page','figure','table','diagram','question',
  'answer','solution','method','process','experiment','observation','conclusion','result','theory',
  'procedure','formula','equation','data','analysis','sample','temperature','pressure','volume',
  'mass','energy','speed','velocity','acceleration','distance','direction','force','gravity',
  'atom','molecule','electron','proton','neutron','cell','tissue','organ','organism','genetic',
  'dna','rna','protein','enzyme','oxygen','carbon','hydrogen','nitrogen','dioxide','water','acid',
  'base','reaction','compound','element','metal','nonmetal','solid','liquid','gas','plasma',
  'plant','animal','bacteria','virus','fungus','algae','protozoa','mammal','reptile','bird','fish',
  'insect','habitat','ecosystem','biodiversity','conservation','pollution','climate','environment',
  'renewable','solar','wind','thermal','nuclear','electricity','circuit','voltage','current',
  'resistance','magnet','field','wave','frequency','wavelength','amplitude','reflection','refraction',
  'india','country','state','district','village','city','town','capital','population','economy',
  'agriculture','industry','trade','export','import','currency','rupee','dollar','budget',
  'constitution','democracy','republic','parliament','assembly','election','vote','candidate',
  'minister','prime','president','governor','mayor','council','court','judge','law','rights',
  'freedom','justice','equality','development','project','scheme','policy','plan','programme',
  'technology','internet','website','software','hardware','application','database','network',
  'security','password','email','address','phone','number','contact','information','digital',
  'the','this','that','these','those','am','is','are','was','were','be','been','being','have',
  'has','had','having','do','does','did','doing','will','would','could','should','may','might',
  'can','shall','ought','need','dare','used','to','of','in','for','on','with','at','by','from',
  'as','into','through','during','before','after','above','below','between','out','off','over',
  'under','again','further','then','once','here','there','when','where','why','how','all','each',
  'every','both','few','more','most','other','some','such','no','not','only','own','same','so',
  'than','too','very','just','because','but','and','or','if','while','although','though','since',
  'until','unless','whether','except','besides','however','therefore','thus','hence','meanwhile',
  'nevertheless','moreover','furthermore','otherwise','instead','anyway','besides','indeed',
  'actually','certainly','probably','perhaps','maybe','definitely','obviously','clearly',
  'really','quite','rather','fairly','extremely','completely','absolutely','totally','entirely',
  'nearly','almost','hardly','barely','scarcely','simply','merely','even','just','already',
  'still','yet','soon','later','now','today','tomorrow','yesterday','always','often','usually',
  'sometimes','occasionally','rarely','seldom','never','ever','once','twice','again','here',
  'there','everywhere','nowhere','anywhere','somewhere','inside','outside','above','below',
  'up','down','left','right','forward','backward','ahead','behind','together','apart','alone',
]);

function loadCustomDict(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const r = localStorage.getItem('liberxoffice-custom-dict');
    return r ? new Set(JSON.parse(r)) : new Set();
  } catch { return new Set(); }
}

function saveCustomDict(dict: Set<string>) {
  try { localStorage.setItem('liberxoffice-custom-dict', JSON.stringify([...dict])); } catch {}
}

function getSuggestions(word: string): string[] {
  const vowels = 'aeiou';
  const suggestions = new Set<string>();

  // Try adding/removing 'e' at end
  if (word.endsWith('e')) {
    suggestions.add(word.slice(0, -1));
  } else {
    suggestions.add(word + 'e');
  }

  // Try doubling the last consonant
  if (word.length > 1) {
    const last = word[word.length - 1];
    if (!vowels.includes(last)) {
      suggestions.add(word + last);
      // Also try removing double consonant
      if (word.length > 2 && word[word.length - 1] === word[word.length - 2]) {
        suggestions.add(word.slice(0, -1));
      }
    }
  }

  // Common vowel substitutions
  for (let i = 0; i < word.length; i++) {
    if (vowels.includes(word[i])) {
      for (const v of vowels) {
        if (v !== word[i]) {
          suggestions.add(word.slice(0, i) + v + word.slice(i + 1));
        }
      }
    }
  }

  // Common transpositions of adjacent letters
  for (let i = 0; i < word.length - 1; i++) {
    suggestions.add(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
  }

  // Try removing one character
  for (let i = 0; i < word.length; i++) {
    suggestions.add(word.slice(0, i) + word.slice(i + 1));
  }

  // Filter to known words only and sort by edit distance
  const results = [...suggestions].filter(s => {
    const lower = s.toLowerCase();
    return COMMON_WORDS.has(lower) && lower !== word.toLowerCase();
  });

  results.sort((a, b) => {
    const da = editDistance(word.toLowerCase(), a.toLowerCase());
    const db = editDistance(word.toLowerCase(), b.toLowerCase());
    return da - db;
  });

  return results.slice(0, 5);
}

function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

export default function SpellCheckDialog({ open, onClose, editorRef }: { open: boolean; onClose: () => void; editorRef: React.RefObject<HTMLDivElement | null> }) {
  const [misspelledWords, setMisspelledWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [ignoredWords, setIgnoredWords] = useState<Set<string>>(new Set());
  const customDictRef = useRef<Set<string>>(new Set());

  const extractWords = useCallback((text: string): string[] => {
    const seen = new Set<string>();
    const words: string[] = [];
    // Use Intl.Segmenter if available, else fallback to regex
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      try {
        const segmenter = new Intl.Segmenter('en', { granularity: 'word' });
        for (const { segment, isWordLike } of segmenter.segment(text)) {
          if (isWordLike) {
            const lower = segment.toLowerCase();
            if (lower.length > 1 && !seen.has(lower)) {
              seen.add(lower);
              words.push(lower);
            }
          }
        }
      } catch {
        // Fallback to regex
        const matches = text.match(/[a-zA-Z]{2,}/g) || [];
        for (const w of matches) {
          const lower = w.toLowerCase();
          if (!seen.has(lower)) {
            seen.add(lower);
            words.push(lower);
          }
        }
      }
    } else {
      const matches = text.match(/[a-zA-Z]{2,}/g) || [];
      for (const w of matches) {
        const lower = w.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          words.push(lower);
        }
      }
    }
    return words;
  }, []);

  useEffect(() => {
    if (!open) return;
    customDictRef.current = loadCustomDict();
    const text = editorRef.current?.innerText || '';
    const allWords = extractWords(text);
    const misspelled = allWords.filter(w => {
      if (COMMON_WORDS.has(w) || customDictRef.current.has(w)) return false;
      // Skip words with numbers or special chars
      if (/[^a-z]/.test(w)) return false;
      return true;
    });
    setMisspelledWords(misspelled);
    setCurrentIndex(0);
    if (misspelled.length > 0) {
      setSuggestions(getSuggestions(misspelled[0]));
    }
  }, [open, editorRef, extractWords]);

  const handleIgnore = () => {
    setIgnoredWords(prev => {
      const next = new Set(prev);
      next.add(misspelledWords[currentIndex]);
      return next;
    });
    moveToNext();
  };

  const handleIgnoreAll = () => {
    const word = misspelledWords[currentIndex];
    setIgnoredWords(prev => {
      const next = new Set(prev);
      next.add(word);
      return next;
    });
    // Remove all occurrences of this word
    setMisspelledWords(prev => prev.filter(w => w !== word));
    if (currentIndex >= misspelledWords.filter(w => w !== word && !ignoredWords.has(w)).length) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  const handleAddToDict = () => {
    const word = misspelledWords[currentIndex];
    customDictRef.current.add(word);
    saveCustomDict(customDictRef.current);
    handleIgnoreAll();
  };

  const handleReplace = (replacement: string) => {
    const word = misspelledWords[currentIndex];
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // Replace the misspelled word (case-insensitive) in HTML, preserving tags
      const regex = new RegExp(`\\b(${word})\\b`, 'gi');
      editorRef.current.innerHTML = html.replace(regex, replacement);
    }
    moveToNext();
  };

  const moveToNext = () => {
    const nextIndex = currentIndex + 1;
    const activeMisspelled = misspelledWords.filter(w => !ignoredWords.has(w));
    if (nextIndex < activeMisspelled.length) {
      setCurrentIndex(nextIndex);
      setSuggestions(getSuggestions(activeMisspelled[nextIndex]));
    } else {
      setMisspelledWords(prev => prev.filter(w => !ignoredWords.has(w) && w !== misspelledWords[currentIndex]));
      setCurrentIndex(0);
      setSuggestions([]);
    }
  };

  if (!open) return null;

  const activeMisspelled = misspelledWords.filter(w => !ignoredWords.has(w));
  const currentWord = activeMisspelled[currentIndex] || null;
  const isComplete = activeMisspelled.length === 0 || currentIndex >= activeMisspelled.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-[420px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border">
          <h3 className="text-base font-semibold">Spelling and Grammar</h3>
          <div className="text-xs text-muted-foreground mt-1">
            {isComplete
              ? 'Spell check complete'
              : `Word ${currentIndex + 1} of ${activeMisspelled.length}`}
          </div>
        </div>

        {isComplete ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-3xl mb-3">✓</div>
              <div className="text-sm font-medium">No more spelling errors found</div>
              <div className="text-xs text-muted-foreground mt-1">{misspelledWords.length > 0 ? `${misspelledWords.length} word(s) checked` : 'The document appears to be error-free'}</div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-border">
              <div className="text-xs text-muted-foreground mb-1">Not in dictionary:</div>
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">{currentWord}</div>
            </div>

            <div className="p-4 border-b border-border">
              <div className="text-xs text-muted-foreground mb-2">Suggestions:</div>
              {suggestions.length > 0 ? (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent border border-transparent hover:border-border transition-colors"
                      onClick={() => handleReplace(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">No suggestions available</div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 p-4">
              <button className="px-3 py-2 text-xs rounded border hover:bg-accent min-h-[40px]" onClick={handleIgnore}>Ignore</button>
              <button className="px-3 py-2 text-xs rounded border hover:bg-accent min-h-[40px]" onClick={handleIgnoreAll}>Ignore All</button>
              <button className="px-3 py-2 text-xs rounded border hover:bg-accent min-h-[40px]" onClick={handleAddToDict}>Add to Dictionary</button>
            </div>
          </>
        )}

        <div className="p-3 border-t border-border flex justify-end">
          <button className="px-4 py-2.5 text-sm rounded bg-lo-green text-white hover:bg-lo-green-dark min-h-[40px] min-w-[80px]" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
