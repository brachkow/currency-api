# currency-api

This is cloudflare worker based API that acts like proxy for openexchangerates api, that:

1. caches `/history` response for queried date into Cloudflare KV (you can easily tweak caching frequency by editing date format — by default it is one response per day)
2. allows to change base currency

Example request:

```
/?date=YYYY-MM-DD&base=UAH
```

## Development

1. Install dependencies with `pnpm i`
2. Add your `OPENEXCHANGERATES_APP_ID` to `.dev.vars`
3. Add `wrangler.toml` and fill it like shown in `wrangler.toml.example`

Disable local mode if you want to put values into `_preview` KV

## Production

1. Run `pnpm wrangler secret put` to add `OPENEXCHANGERATES_APP_ID` with your openexchangerates App ID
2. Add `wrangler.toml` and fill it like shown in `wrangler.toml.example`

Then run `pnpm run deploy` to publish changes
