# DNS snapshot — talkatz.com

Captured 2026-08-16T13:51:03Z from the live zone.

Purpose: rollback reference and import checklist for the GitHub Pages ->
Cloudflare Pages migration (plan section 11). The MX and TXT records below are
LIVE EMAIL FORWARDING via ImprovMX -- if they are lost in a migration, mail to
@talkatz.com fails SILENTLY. Verify these first, before checking the website.

```
--- A ---
  185.199.108.153
  185.199.109.153
  185.199.110.153
  185.199.111.153
--- AAAA ---
--- CNAME ---
--- MX ---
  10 mx1.improvmx.com.
  20 mx2.improvmx.com.
--- TXT ---
  "v=spf1 include:spf.improvmx.com ~all"
--- NS ---
  ns09.domaincontrol.com.
  ns10.domaincontrol.com.
--- CAA ---
--- SOA ---
  ns09.domaincontrol.com. dns.jomax.net. 2024071602 28800 7200 604800 600
--- www CNAME ---
  katz-tal.github.io.
```
