# Enterprise Static Catalog POC

This branch lets `{r7} consult` load plugin metadata and plugin files from a
corporate static mirror instead of GitHub.

## Runtime configuration

The store reads configuration in this order:

1. URL query parameters.
2. `window.R7C_ENTERPRISE_CONFIG` from `store/scripts/runtime-config.js`.
3. Public defaults.

Supported keys:

```js
window.R7C_ENTERPRISE_CONFIG = {
  catalogBaseUrl: 'http://127.0.0.1:8090/',
  managerUpdateBaseUrl: 'http://127.0.0.1:8089/',
  repositoryUrl: 'http://127.0.0.1:8090/',
  connectivityCheckUrl: 'http://127.0.0.1:8090/health',
  enableRatings: false
};
```

Equivalent URL parameters are also supported:

```text
?catalogBaseUrl=http%3A%2F%2F127.0.0.1%3A8090%2F&connectivityCheckUrl=http%3A%2F%2F127.0.0.1%3A8090%2Fhealth&enableRatings=false
```

## Local smoke test

1. In `r7c-packages`, run:

```powershell
.\enterprise\serve-static-catalog.ps1 -Port 8090
```

2. In this repo, set `store/scripts/runtime-config.js` to the local values above
   or open `store/index.html` with the query parameters.
3. Open the store UI and verify that `store/config.json`, plugin cards, icons,
   README and License content are loaded from `http://127.0.0.1:8090/`.
4. In R7 Desktop, open `{r7} consult` and install a small plugin.
5. For the full Russian local deployment checklist, see
   `docs/enterprise_server_local_deploy.md`.

Without runtime configuration the public catalog URLs remain the default.
