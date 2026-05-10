# Enterprise Server Build

Current local POC build:

```text
r7c_enterprise_server_v1.1.4_local.plugin
```

It is configured for:

```text
catalogBaseUrl=http://127.0.0.1:8090/
connectivityCheckUrl=http://127.0.0.1:8090/health
managerUpdateBaseUrl=http://127.0.0.1:8089/
enableRatings=false
```

Run `r7c-packages\enterprise\serve-static-catalog.ps1 -Port 8090` before
opening the plugin manager in R7 Desktop.
