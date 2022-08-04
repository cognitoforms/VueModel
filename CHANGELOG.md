# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [0.8.1] - 2022-08-04
### Fixed
- Avoid null errors in source adapter properties

## [0.8.0] - 2020-08-07
### Changed
- sort conditions on SourcePathAdapter

## [0.7.0] - 2020-06-17
### Changed
- Update to model.js@0.7.0 and use `evaluateLabel()` to take advantage of `labelSource` option

## [0.6.1] - 2019-12-05
### Fixed
- Update to `model.js` version 0.6.1
    > Fix regression in call to entity constructor from deserialize

## [0.6.0] - 2019-12-05
### Changed
- Update to `model.js` version 0.6.0
    > Fixes for identifier property handling, rename `id` option to `identifier`, misc. backing field changes, etc.
- Update `EntityObserver` to use new `__fields__` backing field

## [0.5.0] - 2019-12-04
### Changed
- Update to `model.js` version 0.5.0
    > Add `Property.isIdentifier`, set via `id` boolean option instead of detecting a property named "Id"

## [0.4.1] - 2019-12-04
### Added
- Export `preventVueObservability` helper function
### Changed
- Make sure that the model itself is not made observable by Vue
- Use `NullObserver` as the observer class when preventing Vue observability

## [0.4.0] - 2019-11-27
### Changed
- Update to `model.js` version 0.4.0
    > Changes to `Entity.set()`, `Type.create()`, and entity identity and pooling

## [0.3.3] - 2019-11-22
### Added
- Update to `model.js` version 0.3.5
    - Add support for type-level rule/method

## [0.3.2] - 2019-11-21
### Changed
- Update to `model.js` version 0.3.4

## [0.3.1] - 2019-09-27
### Changed
- Use new `labelIsFormat` and `helptextIsFormat` properties (`model.js@0.3.3`)
- Attempt to make `SourcePathAdapter` overriding more consistent
- Change `<vm-source>` component to use `SourcePathMixin`
### Added
- Add new `<vm-root>` component

## [0.3.0] - 2019-09-17
### Added
- Support token value post processing when calling `Entity.toString()` (`model.js@0.3.1`)

## [0.2.0] - 2019-09-13
### Fixed
- Fix inclusion of files in package (i.e. `.npmignore`)

## [0.1.0] - 2019-09-13
### Added
- Published first initial version `0.1.0`
