import os
import glob

files = glob.glob(r"c:\scratch\hackathon-strategist\frontend\src\components\*.tsx")
changed_files = []

for file in files:
    with open(file, 'r', encoding='utf-8') as f: 
        content = f.read()
    original = content
    content = content.replace('import ScrollTrigger from "gsap/dist/ScrollTrigger";', 'import { ScrollTrigger } from "gsap/ScrollTrigger";\ngsap.registerPlugin(ScrollTrigger);')
    content = content.replace('import { ScrollTrigger } from "gsap/dist/ScrollTrigger";', 'import { ScrollTrigger } from "gsap/ScrollTrigger";\ngsap.registerPlugin(ScrollTrigger);')
    
    if content != original:
        with open(file, 'w', encoding='utf-8') as f: 
            f.write(content)
        changed_files.append(file)

print('Fixed files:', changed_files)
