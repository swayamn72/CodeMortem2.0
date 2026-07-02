import urllib.request, json
req = urllib.request.Request('http://localhost:8080/api/v1/learning-path/submit', data=b'{"code": "print(1)", "language": "python", "challengeId": "comb_legendary_spells"}', headers={'Content-Type': 'application/json', 'Authorization': 'Bearer test'})
try:
    print(urllib.request.urlopen(req).read())
except Exception as e:
    print(e.read())
