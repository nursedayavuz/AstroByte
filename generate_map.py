import re
content = open(r'c:\Users\Berat\Desktop\yarışma\tr.svg').read()
paths = re.findall(r'<path d="(.*?)" id="(.*?)" name="(.*?)"', content)
with open(r'c:\Users\Berat\Desktop\yarışma\solarguard-dashboard\src\components\maps\TurkeyMap.jsx', 'w', encoding='utf-8') as f:
    f.write('import { motion } from "framer-motion"\n\n')
    f.write('export default function TurkeyMap({ opacity = 1, color = "var(--cyan)" }) {\n')
    f.write('  return (\n')
    f.write('    <svg viewBox="0 0 1000 422" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%", opacity }}>\n')
    f.write('      <g id="features">\n')
    for p in paths:
        f.write(f'        <path d="{p[0]}" id="{p[1]}" name="{p[2]}" fill={{color}} stroke={{color}} strokeWidth="0.5" fillOpacity="0.1" />\n')
    f.write('      </g>\n')
    f.write('    </svg>\n')
    f.write('  )\n')
    f.write('}\n')
