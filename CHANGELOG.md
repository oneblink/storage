# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.1.0] - 2025-07-01

### Added

- `sectionState` to `OneBlinkUploader.uploadFormSubmissionDraft()`

## [3.0.0] - 2025-01-12

### Added

- **[BREAKING]** required parameter `options.recaptchas[].siteKey` to `OneBlinkUploaded.prototype.uploadSubmission(options)`

### Changed

- `formsAppId` optional in uploadSubmission

## [2.1.2] - 2024-12-09

### Fixed

- Value of request header `x-oneblink-request-body` not being encoded

## [2.1.1] - 2024-09-03

### Dependencies

- update [@aws-sdk/client-s3](https://www.npmjs.com/package/@aws-sdk/client-s3) to [3.637.0](https://github.com/aws/aws-sdk-js-v3/releases/tag/v3.637.0) (from [3.569.0](https://github.com/aws/aws-sdk-js-v3/releases/tag/v3.569.0))

- update [@aws-sdk/lib-storage](https://www.npmjs.com/package/@aws-sdk/lib-storage) to [3.637.0](https://github.com/aws/aws-sdk-js-v3/releases/tag/v3.637.0) (from [3.569.0](https://github.com/aws/aws-sdk-js-v3/releases/tag/v3.569.0))

## [2.1.0] - 2024-07-10

### Added

- `OneBlinkDownloader` to download form submissions, drafts and pre-fill data

## [2.0.1] - 2024-07-01

## [2.0.0] - 2024-05-20

### Added

- `OneBlinkUploaded.prototype.uploadFormSubmissionDraft()`

### Removed

- **[BREAKING]** `OneBlinkUploaded.prototype.uploadDraftSubmission()` replaced with `uploadFormSubmissionDraft()` which allows for creating and updating drafts

### Dependencies

- update [@aws-sdk/client-s3](https://www.npmjs.com/package/@aws-sdk/client-s3) to [3.569.0](https://github.com/aws/aws-sdk-js-v3/blob/master/CHANGELOG.md) (from [3.554.0](https://github.com/aws/aws-sdk-js-v3/blob/master/CHANGELOG.md))

- update [@aws-sdk/lib-storage](https://www.npmjs.com/package/@aws-sdk/lib-storage) to [3.569.0](https://github.com/aws/aws-sdk-js-v3/blob/master/CHANGELOG.md) (from [3.554.0](https://github.com/aws/aws-sdk-js-v3/blob/master/CHANGELOG.md))

## [1.0.0] - 2024-05-01

Initial release
