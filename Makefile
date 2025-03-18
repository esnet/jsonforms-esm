# check_version is used by 'make publish'
CURR_PUBLISHED_VERSION = $(shell npm view . version)
CURR_LOCAL_VERSION = $(shell cat package.json | jq -r .version)
.PHONY: run
run: build
	cd dist && python3 -m http.server 8888

.PHONY: check_version
check_version:
	@if test $(CURR_PUBLISHED_VERSION) = $(CURR_LOCAL_VERSION); then echo "The version number in 'package.json' matches the previous version. Refusing to publish." && false; else true; fi

# testignore is used by 'make publish'. It echoes a listing of the files to be published to NPM. We do this to avoid leaking data.
.PHONY: testignore
testignore:
	@echo ""
	@echo "These files will be included in 'npm publish' package:"
	@npm pack > /dev/null 2>&1
	@tar -tf *.tgz | sort | awk '{ print "    ", $$0 }'
	@rm *.tgz
	@echo ""

# confirm is used by 'make publish' to do a final confirmation of the file listing to be published.
.PHONY: confirm
confirm:
	@echo "Does this look right? [y/N] " && read ans && [ $${ans:-N} = y ]


# test is used by 'make publish'. The tests are run karma, because it uses a native browser. Jasmine for the assertion framework.
.PHONY: test
test: build
	npm run test

# build is used by 'make test'
.PHONY: build
build:
	npm run build

# push is used by 'make publish'
.PHONY: push
push:
	npm publish

# 'make publish' checks the version, tests, does a prod build, asks the user to confirm the ignored files for publishing, and pushes to NPM
.PHONY: publish
publish: check_version test testignore confirm push
