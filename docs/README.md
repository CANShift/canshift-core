# Core documentation

`@canshift/core` owns the contracts every other repo agrees on: the JSON schema
for a dashboard, the migrations between schema versions, and the rule for which
firmware a given tuner build may talk to.

The package API — exports, folder layout, migration chain, validation — is
documented in the [README](../README.md). These two pages cover the contracts
themselves, which change more slowly and matter to firmware and tuner authors
alike.

| Doc                                                     | What it covers                                                                |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [Config contract](config-contract.md)                   | The JSON files on the device, their schema versions, and the validation rules |
| [Wire protocol versioning](wire-protocol-versioning.md) | The major/minor handshake between firmware and tuner over Web Serial          |

Docs for the other repos: [firmware](https://github.com/CANShift/canshift-firmware/tree/main/docs) ·
[tuner](https://github.com/CANShift/canshift-tuner/tree/main/docs) ·
[mobile](https://github.com/CANShift/canshift-mobile/tree/main/docs)
