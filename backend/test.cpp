#include <iostream>
#include <vector>
using namespace std;
struct SegmentTree {
    int n;
    vector<long long> tree;
    SegmentTree(int n) : n(n), tree(4 * n, 0) {}
    void build(const vector<int>& a, int node, int start, int end) {
        if (start == end) { tree[node] = a[start]; return; }
        int mid = (start + end) / 2;
        build(a, 2 * node, start, mid);
        build(a, 2 * node + 1, mid + 1, end);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }
    void update(int node, int start, int end, int idx, int val) {
        if (start == end) { tree[node] = val; return; }
        int mid = (start + end) / 2;
        if (idx <= mid) update(2 * node, start, mid, idx, val);
        else update(2 * node + 1, mid + 1, end, idx, val);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }
    long long query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0;
        if (l <= start && end <= r) return tree[node];
        int mid = (start + end) / 2;
        return query(2 * node, start, mid, l, r) + query(2 * node + 1, mid + 1, end, l, r);
    }
};
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n, q;
    cin >> n >> q;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    SegmentTree st(n);
    st.build(a, 1, 0, n - 1);
    for (int i = 0; i < q; i++) {
        int type; cin >> type;
        if (type == 1) { int idx, val; cin >> idx >> val; st.update(1, 0, n - 1, idx, val); }
        else if (type == 2) { int l, r; cin >> l >> r; cout << st.query(1, 0, n - 1, l, r) << "\n"; }
    }
    return 0;
}
