# PDF Fixtures

Real 3-page sample (`sample-3p.pdf`) is generated on-demand by CI before tests run,
using:

```
gs -sDEVICE=pdfwrite -o sample-3p.pdf -dDEVICEWIDTHPOINTS=200 -dDEVICEHEIGHTPOINTS=300 \
   -c "/Helvetica findfont 24 scalefont setfont 50 150 moveto (Page 1) show showpage" \
   -c "/Helvetica findfont 24 scalefont setfont 50 150 moveto (Page 2) show showpage" \
   -c "/Helvetica findfont 24 scalefont setfont 50 150 moveto (Page 3) show showpage"
```

The `pdf-processor.test.mjs` real-render assertion auto-skips when either the
fixture or the gs/pdftocairo binaries are missing.
