vector<ll> dist(n, LLONG_MAX);
dist[src] = 0;
for(ll i=0; i<n-1; i++){
    bool relaxed = false;
    for(auto &a : edges){
        ll u = a[0], v = a[1], w = a[2];
        if(dist[u]!=LLONG_MAX && dist[v]>dist[u]+w){
            dist[v] = dist[u] + w;
            relaxed = true;
        }
    }
    if(!relaxed) break;
}