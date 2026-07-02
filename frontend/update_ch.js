const fs = require('fs');

const file = 'c:/Users/swaya/OneDrive/Desktop/CodeMortem2.0/frontend/components/learn/segment-tree-intermediate/renderer/ChallengeRenderer.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the split regex
content = content.replace(
    /line\.split\(\/\(\\\*\\\*\[\^\*\]\+\\\*\\\*\)\/g\)/g,
    'line.split(/(\\\*\\\*[^*]+\\\*\\\*|\\\\b[A-Za-z0-9]+\\\\^[0-9]+)/g)'
);
content = content.replace(
    /constraint\.split\(\/\(\\\*\\\*\[\^\*\]\+\\\*\\\*\)\/g\)/g,
    'constraint.split(/(\\\*\\\*[^*]+\\\*\\\*|\\\\b[A-Za-z0-9]+\\\\^[0-9]+)/g)'
);
content = content.replace(
    /hint\.body\.split\(\"\\\\n\"\)\.map\(\(line, i\) => \{\n                            const parts = line\.split\(\/\(\\\*\\\*\[\^\*\]\+\\\*\\\*\)\/g\);/g,
    'hint.body.split("\\n").map((line, i) => {\n                            const parts = line.split(/(\\\*\\\*[^*]+\\\*\\\*|\\\\b[A-Za-z0-9]+\\\\^[0-9]+)/g);'
);

// We need to replace the mapping logic. Since it's a bit complex with regex, I'll use a replacer function block in string replace.
const mapLogic = parts.map((p, j) => {
                          if (p.startsWith("**") && p.endsWith("**")) {
                            return <strong key={j} style={{ color: "var(--text-primary)" }}>{p.slice(2, -2)}</strong>;
                          }
                          const caretIdx = p.indexOf("^");
                          if (caretIdx > 0 && caretIdx < p.length - 1 && /^\\b[A-Za-z0-9]+\\^[0-9]+$/.test(p)) {
                            const base = p.slice(0, caretIdx);
                            const exp = p.slice(caretIdx + 1);
                            return <span key={j}>{base}<sup>{exp}</sup></span>;
                          }
                          return p;
                        });

// Problem statement
content = content.replace(
    /parts\.map\(\(p, j\) =>\s*p\.startsWith\(\"\*\*\"\)[^;]+?(?=\s*<\/p>)/,
    mapLogic
);

// Constraints
content = content.replace(
    /constraint\.split\([^\)]+\)\.map\(\(p, j\) =>\s*p\.startsWith\(\"\*\*\"\)[^;]+?(?=\s*<\/li>)/,
    'constraint.split(/(\\\*\\\*[^*]+\\\*\\\*|\\\\b[A-Za-z0-9]+\\\\^[0-9]+)/g).map((p, j) => {\n                        if (p.startsWith("**") && p.endsWith("**")) {\n                          return <strong key={j} style={{ color: "var(--text-primary)" }}>{p.slice(2, -2)}</strong>;\n                        }\n                        const caretIdx = p.indexOf("^");\n                        if (caretIdx > 0 && caretIdx < p.length - 1 && /^\\b[A-Za-z0-9]+\\^[0-9]+$/.test(p)) {\n                          const base = p.slice(0, caretIdx);\n                          const exp = p.slice(caretIdx + 1);\n                          return <span key={j}>{base}<sup>{exp}</sup></span>;\n                        }\n                        return p;\n                      })'
);

// Hints
content = content.replace(
    /parts\.map\(\(p, j\) =>\s*p\.startsWith\(\"\*\*\"\)[^;]+?(?=\s*<\/p>)/,
    mapLogic
);


fs.writeFileSync(file, content, 'utf8');
console.log('Done mapping.');
