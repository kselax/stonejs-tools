var fs = require("fs");

var expect = require("expect.js");

var extract = require("../src/extract.js");
var helpers = require("../src/helpers.js");


describe("stonejs extract:", function() {

    describe("extract.extractJsStrings", function() {

        it("does not extract not translatable strings", function() {
            expect(extract.extractJsStrings(
                "'hello';\nfoo('hello');bar_(\"hello\")",

                ["_", "gettext", "lazyGettext"]
            )).not.to.have.key("hello");
        });

        it("does not extract commented translatable strings (// comment)", function() {
            expect(extract.extractJsStrings(
                "// _('hello')",

                ["_", "gettext", "lazyGettext"]
            )).not.to.have.key("hello");
        });

        it("does not extract commented translatable strings (/* comment */)", function() {
            expect(extract.extractJsStrings(
                "/*\n * _('hello')\n */",

                ["_", "gettext", "lazyGettext"]
            )).not.to.have.key("hello");
        });

        it("ignore translatable string concatenated with an idenifier", function() {
            expect(extract.extractJsStrings(
                "_('hello' + identifier)",

                ["_", "gettext", "lazyGettext"]
            )).not.to.have.key("hello");
        });

        it("can extract simple translatable string (single quote)", function() {
            expect(extract.extractJsStrings(
                "_('hello')",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello");
        });

        it("can extract simple translatable string (double quote)", function() {
            expect(extract.extractJsStrings(
                "_(\"hello\")",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello");
        });

        it("can extract simple translatable string (with fuzzy whitespaces)", function() {
            expect(extract.extractJsStrings(
                "_(\t\n \"hello\"  )",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello");
        });

        it("can extract translatable string with escaped quote", function() {
            expect(extract.extractJsStrings(
                "_('rock \\'n roll')",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("rock 'n roll");
        });

        it("can extract translatable string with hexadecimal escaped char", function() {
            expect(extract.extractJsStrings(
                "_('hello\\x40world')",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello@world");
        });

        it("can extract concatenated translatable string", function() {
            expect(extract.extractJsStrings(
                "_('hello ' + 'world')",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello world");
        });

        it("can extract translatable string concatenated with integer", function() {
            expect(extract.extractJsStrings(
                "_('hello ' + 8)",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello 8");

            expect(extract.extractJsStrings(
                "_('hello ' + 8.0)",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello 8");

            expect(extract.extractJsStrings(
                "_('hello ' + 10e3)",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello 10000");
        });

        it("can extract translatable string concatenated with integer (hexa)", function() {
            expect(extract.extractJsStrings(
                "_('hello ' + 0xFF)",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello 255");
        });

        it("can extract translatable string concatenated with float", function() {
            expect(extract.extractJsStrings(
                "_('hello ' + 3.14)",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello 3.14");

            expect(extract.extractJsStrings(
                "_('hello ' + .3)",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello 0.3");

            expect(extract.extractJsStrings(
                "_('hello ' + 10e-3)",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello 0.01");
        });

        it("can extract concatenated translatable string (multilines)", function() {
            expect(extract.extractJsStrings(
                "_('hello ' +\n'world')",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello world");
        });

        it("can extract concatenated translatable string with comment in the middle", function() {
            expect(extract.extractJsStrings(
                "_('hello ' /* everybody */ + 'world')",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello world");
        });

        it("can extract multiline translatable strings (with escaped \\n)", function() {
            expect(extract.extractJsStrings(
                "_('hello \\\nworld')",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello world");
        });

        it("can extract multiline translatable strings (with escaped \\r\\n)", function() {
            expect(extract.extractJsStrings(
                "_('hello \\\r\nworld')",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello world");
        });

        it("can extract translatable strings with replacement", function() {
            expect(extract.extractJsStrings(
                "_('hello {name}', {name: 'John'})",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello {name}");
        });

        it("can extract translatable strings marked with 'methods' instead of functions", function() {
            expect(extract.extractJsStrings(
                "Stone.gettext('hello')",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("hello");
        });

        it("returns the line number of extracted translatable strings", function() {
            expect(extract.extractJsStrings(
                "\n\n_('hello')",

                ["_", "gettext", "lazyGettext"]
            ).hello).to.contain(3);
        });

        it("can group duplicated translatable string", function() {
            expect(extract.extractJsStrings(
                "_('hello');\n_('hello');",

                ["_", "gettext", "lazyGettext"]
            ).hello).to.have.length(2);
        });

        it("can handle strings with unicode characters", function() {
            expect(extract.extractJsStrings(
                "_('⚠ Voici une chaîne avec des caractères spéciaux ☺')",

                ["_", "gettext", "lazyGettext"]
            )).to.have.key("⚠ Voici une chaîne avec des caractères spéciaux ☺");
        });

    });

    describe("extract.extractHtmlStrings", function() {

        it("does not extract not translatable strings", function() {
            expect(extract.extractHtmlStrings("<html><head></head><body><div>hello</div></body></html>")).not.to.have.key("hello");
        });

        it("can extract translatable strings", function() {
            expect(extract.extractHtmlStrings("<html><head></head><body><div stonejs>hello</div></body></html>")).to.have.key("hello");
        });

        it("can extract translatable strings (with HTML tags)", function() {
            expect(extract.extractHtmlStrings("<html><head></head><body><div stonejs><em>hello</em></div></body></html>")).to.have.key("<em>hello</em>");
        });

    });

    describe("extract.generatePo", function() {

        var strings = {
            "hello": [{file: "foo.js", line: 1}],
            "world": [{file: "foo.js", line: 2}, {file: "foobaz.js", line: 42}]
        };

        it("generates the po file", function() {
            expect(extract.generatePo(strings))
                .to.contain('#: foo.js:1')
                .and.to.contain('msgid "hello"')
                .and.to.contain('#: foo.js:2')
                .and.to.contain('#: foobaz.js:42')
                .and.to.contain('msgid "world"');
        });

    });

    describe("extract.main", function() {

        var outputFile = "__test_output.pot";

        after(function() {
            if (helpers.isFile(outputFile)) {
                fs.unlinkSync(outputFile);
            }
        });

        it("extracts strings from js files and generates the po template file", function(done) {
            extract.main(["test/fixtures/*.js", "test/fixtures/*.html"], outputFile, {quiet: true}, function(error) {
                expect(error).not.to.be.ok();
                expect(helpers.isFile(outputFile)).to.be.ok();
                expect(fs.readFileSync(outputFile).toString())
                    .not.to.contain("nope")
                    .and.to.contain("translatable 1")
                    .and.to.contain("translatable 2")
                    .and.to.contain("translatable 3")
                    .and.to.contain("translatable 4")
                    .and.to.contain("translatable 5")
                    .and.to.contain("translatable 6")
                    .and.to.contain("translatable 7")
                    .and.to.contain("translatable 8")
                    .and.to.contain("translatable 9")
                    .and.to.contain("translatable 10")
                    .and.to.contain("translatable 11")
                    .and.to.contain("translatable 12")
                    .and.to.contain("translatable 14")
                    .and.to.contain("translatable 15")
                    .and.to.contain("translatable 16")
                    .and.to.contain("translatable 17")
                    .and.to.contain("translatable 18")
                    .and.to.contain("escaped \\\" 1")
                    .and.to.contain("escaped ' 2")
                    .and.to.contain("escaped \\\\ 3")
                    .and.to.contain("escaped \\t 4")
                    .and.to.contain("escaped \\n")
                    .and.to.contain("escaped 6")
                    .and.to.contain("escaped @ 7")
                    .and.to.contain("special 1 «↑éÉ☺»")
                    .and.to.contain("duplicated")
                    .and.to.contain("html translatable 1")
                    .and.to.contain("html translatable <em>2</em>");
                done();
            });
        });
    });

});

