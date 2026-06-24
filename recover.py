import json

transcript_path = r'C:\Users\swaya\.gemini\antigravity-ide\brain\d8f74ec3-e068-4c6f-9204-9a74e7b59f5c\.system_generated\logs\transcript.jsonl'
lines_out = []
found = False
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            content = ''
            if 'tool_calls' in data:
                for t in data['tool_calls']:
                    content += t.get('response', '')
            if 'content' in data:
                content += data.get('content', '')
            
            if 'Total Lines: 606' in content and 'COMB_COURSE' in content:
                start_idx = content.find('1: ')
                end_idx = content.find('The above content shows the entire')
                if start_idx != -1 and end_idx != -1:
                    raw = content[start_idx:end_idx]
                    for rline in raw.split('\n'):
                        if ': ' in rline:
                            lines_out.append(rline.split(': ', 1)[1])
        except:
            pass

if lines_out:
    print('Lines found:', len(lines_out))
    # do replacements
    full = '\n'.join(lines_out)
    reps = {
        '10⁹': '10<sup>9</sup>', '10⁶': '10<sup>6</sup>', '2³¹': '2<sup>31</sup>', 
        '10¹⁸': '10<sup>18</sup>', '2⁶³': '2<sup>63</sup>', '10⁵': '10<sup>5</sup>',
        '10¹¹': '10<sup>11</sup>', 'X²': 'X<sup>2</sup>', 'A⁻¹': 'A<sup>-1</sup>',
        '(k!)⁻¹': '(k!)<sup>-1</sup>', '((n-k)!)⁻¹': '((n-k)!)<sup>-1</sup>',
        '(i!)⁻¹': '(i!)<sup>-1</sup>', '((i+1)!)⁻¹': '((i+1)!)<sup>-1</sup>',
        '(10⁹+7)²': '(10<sup>9</sup>+7)<sup>2</sup>',
        'onComplete={() => go(activeLesson, nextLesson)}': 'onNext={() => go(activeLesson, nextLesson)}',
        'A_{N-1}': 'A_{"{"}N-1{"}"}', 'A_{j-1}': 'A_{"{"}j-1{"}"}',
        'earnedAt={badgeEarnedAt} size=\"lg\"': 'earned={!!badgeEarnedAt} earnedAt={badgeEarnedAt} size=\"lg\"'
    }
    for k, v in reps.items():
        full = full.replace(k, v)
    with open('frontend/components/CombinatoricsPath.tsx', 'w', encoding='utf-8') as f:
        f.write(full)
    print('Done!')
else:
    print('Not found')
