#include <bits/stdc++.h>
using namespace std;
const long long MOD = 1e9 + 7;
int main(){
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n; cin >> n;
    long long prod = 1;
    for(int i = 0; i < n; i++){
        long long x; cin >> x;
        prod = (prod * (x % MOD)) % MOD;
    }
    cout << prod << "\n";
    return 0;
}
