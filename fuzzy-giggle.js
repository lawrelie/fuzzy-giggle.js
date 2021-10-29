export default class {
    constructor(commonmark) {
        this.commonmark = commonmark;
        this.TextRenderer = class extends this.commonmark.Renderer {
            constructor(options = {}) {
                super();
                this.disableTags = 0;
                this.lastOut = "\n";
                this.options = Object.assign({safe: true, softbreak: ""}, options);
                this.reUnsafeProtocol = /^javascript:|vbscript:|file:|data:/i;
                this.reSafeDataProtocol = /^data:image\/(?:png|gif|jpeg|webp)/i;
            }
            potentiallyUnsafe(url) {
                return this.reUnsafeProtocol.test(url) && !this.reSafeDataProtocol.test(url);
            }
            // Node methods
            text(node) {
                this.out(node.literal);
            }
            softbreak() {
                this.lit(this.options.softbreak);
            }
            linebreak() {
                this.cr();
            }
            emph(node, entering) {
                this.out(entering ? "〈" : "〉");
            }
            strong(node, entering) {
                this.out(entering ? "【" : "】");
            }
            html_inline(node) {
                if (!this.options.safe) {
                    return;
                } else if (/^<rt(?=\s|>)/iu.test(node.literal)) {
                    this.out("（");
                } else if (/^<\/rt(?=\s|>)/iu.test(node.literal)) {
                    this.out("）");
                }
            }
            link(node, entering) {
                if (!entering) {
                    if (!(this.options.safe && this.potentiallyUnsafe(node.destination))) {
                        this.out("（" + node.destination + "）");
                    }
                    if (node.title) {
                        this.out("（" + node.title + "）");
                    }
                }
            }
            image(node, entering) {
                if (entering) {
                    this.disableTags += 1;
                } else {
                    this.disableTags -= 1;
                    if (0 === this.disableTags) {
                        if (!(this.options.safe && this.potentiallyUnsafe(node.destination))) {
                            this.out("（" + node.destination + "）");
                        }
                        if (node.title) {
                            this.out("（" + node.title + "）");
                        }
                    }
                }
            }
            code(node) {
                this.out("〈" + node.literal + "〉");
            }
            paragraph(node, entering) {
                try {
                    const grandparent = node.parent.parent;
                    if ("list" === grandparent.type && grandparent.listTight) {
                        return;
                    }
                } catch (e) {}
                if (entering) {
                    let child = node.firstChild;
                    this.cr(!node.prev || "paragraph" === node.prev.type ? 1 : 2);
                    if (!child) {
                        return;
                    }
                    while (!!child) {
                        if (child.type in ["emph", "strong", "code"]) {
                            return;
                        }
                        try {
                            if (/^\s*[\p{Pi}\p{Ps}]/u.test(child.literal)) {
                                return;
                            }
                        } catch (e) {}
                        child = child.next;
                    }
                    this.out("　");
                } else {
                    this.cr();
                }
            }
            block_quote() {
                this.cr(2);
            }
            item(node, entering) {
                let listType = "•";
                try {
                    if ("ordered" === node.parent.listType) {
                        let i = (null === node.parent.listStart ? 0 : node.parent.listStart) - 1;
                        let brother = node;
                        while (!!brother && !Object.is(node.parent, brother)) {
                            i++;
                            brother = brother.prev;
                        }
                        listType = i.toString(10) + "．";
                    }
                } catch (e) {}
                if (entering) {
                    this.out(listType);
                    try {
                        if ("list" === node.firstChild.type) {
                            throw new Error;
                        }
                        this.out("　");
                    } catch (e) {}
                } else {
                    this.cr();
                }
            }
            list() {
                this.cr(2);
            }
            heading(node, entering) {
                if (entering) {
                    this.cr(!node.prev || "heading" === node.prev.type ? 1 : 3);
                    this.out("　".repeat(node.level * 2));
                } else {
                    this.cr();
                }
            }
            code_block(node) {
                this.cr(2);
                this.out(node.literal);
                this.cr(2);
            }
            html_block(node) {
                this.cr(2);
            }
            themantic_break(node) {
                this.cr(2);
            }
            // Helper methods
            cr(n = 1) {
                if (!/^\n+$/.test(this.lastOut)) {
                    this.lit("\n".repeat(n));
                    return;
                }
                for (let i = 1; i < n; i++) {
                    if (this.lastOut === "\n".repeat(i)) {
                        this.lit("\n".repeat(n - i));
                        this.lastOut = "\n".repeat(n);
                        return;
                    }
                }
            }
            out(s) {
                this.lit(this.esc(s));
            }
        };
        this.PixivNovelRenderer = class extends this.TextRenderer {
            heading(node, entering) {
                if (entering) {
                    this.cr(!node.prev || "heading" === node.prev.type ? 1 : 2);
                    if (3 > node.level && (!node.prev || "heading" !== node.prev.type) && ("" !== this.buffer)) {
                        this.out("[newpage]\n");
                    }
                    if (1 === node.level) {
                        this.out("[chapter:");
                    } else {
                        this.out("　".repeat((node.level - 1) * 2));
                    }
                } else {
                    if (1 === node.level) {
                        this.out("]");
                    }
                    super.heading(node, entering);
                }
            }
            html_inline(node) {
                if (/^<ruby(?=\s|>)/iu.test(node.literal)) {
                    return this.out("[[rb:");
                } else if (/^<\/ruby(?=\s|>)/iu.test(node.literal)) {
                    return this.out("]]");
                } else if (/^<rt(?=\s|>)/iu.test(node.literal)) {
                    return this.out(" > ");
                } else if (/^<\/rt(?=\s|>)/iu.test(node.literal)) {
                    if (!/^<\/ruby(?=\s|>)/iu.test(node.next.literal)) {
                        this.out("]][[rb:");
                    }
                    return;
                }
                super.html_inline(node);
            }
        };
    }
}
