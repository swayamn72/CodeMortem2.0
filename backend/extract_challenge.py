#!/usr/bin/env python3
with open('/app/internal/challenges/combinatorics/challenges.go', 'r') as f:
    code = f.read()
idx = code.find('comb_safe_product')
gen_start = code.find('GeneratorPy:', idx) + len('GeneratorPy:') + 3
gen_end = code.index('`', gen_start)
gen_code = code[gen_start:gen_end]
with open('/tmp/gen_safe_product.py', 'w') as f:
    f.write(gen_code)
# also extract reference
ref_start = code.find('ReferenceCpp:', idx) + len('ReferenceCpp:') + 3
ref_end = code.index('`', ref_start)
ref_code = code[ref_start:ref_end]
with open('/tmp/ref_safe_product.cpp', 'w') as f:
    f.write(ref_code)
print("Generator written. First 200 chars:")
print(gen_code[:200])
print("Reference written. First 200 chars:")
print(ref_code[:200])
