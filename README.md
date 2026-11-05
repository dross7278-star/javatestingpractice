# javatestingpractice

## Product search debugging challenge

The application is in [`product-search-debugging-challenge/`](./product-search-debugging-challenge/).
Run it from that directory with `npm install` followed by `npm run dev`. Run
`npm run build` there to verify the production bundle.

### Fixes

- Corrected the product data file location so the app's module import resolves.
- Removed invalid leading text from the app entry, HTML, and stylesheet files.
- Parse and validate saved cart data on startup, restore canonical products,
  and report storage read/write failures instead of crashing or silently losing
  cart changes. Invalid saved cart data is logged and cleared.
- Keep search, category, and sort state consistent; apply category filtering
  after each search.
- Debounce text searches and ignore stale asynchronous responses so older
  searches cannot replace newer results.
- Sort copies of product lists to avoid mutating the source array.
- Register the product-list click handler once, preventing repeated renders
  from adding duplicate listeners.
- Move keyboard focus into the product dialog, restore it on close, and close
  the dialog with Escape or a backdrop click.
- Ensure the closed dialog is actually hidden and does not intercept page
  interactions.

### Verification

- `npm ci` completed with no reported vulnerabilities; `npm run build` succeeds.
- Browser-checked search, category filtering, sorting, cart persistence,
  dialog focus, Escape dismissal, and backdrop dismissal.