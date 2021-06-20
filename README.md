# fuzzy-giggle.js
[commonmark.js](https://github.com/commonmark/commonmark.js) で Markdown を変換する。

```js
import commonmark from "path/to/commonmark.js";
import FuzzyGiggle from "path/to/fuzzy-giggle.js";
const giggle = new FuzzyGiggle(commonmark);
const readder = new commonmark.Parser();
const writer = new giggle.TextRenderer();
const parsed = reader.parse("Hello *world*");
const result = writer.render(parsed);
```

-   `TextRenderer` extends `commonmark.Renderer`
    -   `PixivNovelRenderer`
