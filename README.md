# actions/github-script

[![.github/workflows/integration.yml](https://github.com/giovannicandido/github-action-clean-releases/workflows/Integration/badge.svg?event=push&branch=main)](https://github.com/actions/github-script/actions?query=workflow%3AIntegration+branch%3Amain+event%3Apush)
[![.github/workflows/ci.yml](https://github.com/giovannicandido/github-action-clean-releases/workflows/CI/badge.svg?event=push&branch=main)](https://github.com/actions/github-script/actions?query=workflow%3ACI+branch%3Amain+event%3Apush)
[![.github/workflows/licensed.yml](https://github.com/giovannicandido/github-action-clean-releases/workflows/Licensed/badge.svg?event=push&branch=main)](https://github.com/actions/github-script/actions?query=workflow%3ALicensed+branch%3Amain+event%3Apush)

This action will clean all prerelases older than 15 days by default. This will also delete the tags.

This action is useful to keep a clean release tags and deploy prereleases frequently. If you use trunk based workflow
and don't want to a clutter tag system, or if you experiment a lot an release fast but want to keep only the production releases,
this action can help you.

## Reading step results

The return value of the script will be in the step's outputs under the
"result" key.

```yaml
- uses: giovannicandido/github-action-clean-releases@main
  id: set-result
  with:
    script: return "Hello!"
    result-encoding: string
- name: Get result
  run: echo "${{steps.set-result.outputs.result}}"
```

See ["Result encoding"](#result-encoding) for details on how the encoding of
these outputs can be changed.

## Result encoding

By default, the JSON-encoded return value of the function is set as the "result" in the
output of a github-script step. For some workflows, string encoding is preferred. This option can be set using the
`result-encoding` input:

```yaml
- uses: giovannicandido/github-action-clean-releases@main
  id: my-script
  with:
    result-encoding: string
    script: return "I will be string (not JSON) encoded!"
```

## Examples

Note that `github-token` is optional in this action, and the input is there
in case you need to use a non-default token.

By default, github-script will use the token provided to your workflow.

### Remove all prerelease in the last 10 days

```yaml
- name: Clean prerelases older then 10 days
  uses: giovannicandido/github-action-clean-releases@main
  with:
    numberDaysToKeep: 10
```

### Using a separate GitHub token

The `GITHUB_TOKEN` used by default is scoped to the current repository, see [Authentication in a workflow](https://docs.github.com/actions/reference/authentication-in-a-workflow).

If you need access to a different repository or an API that the `GITHUB_TOKEN` doesn't have permissions to, you can provide your own [PAT](https://help.github.com/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line) as a secret using the `github-token` input.

[Learn more about creating and using encrypted secrets](https://docs.github.com/actions/reference/encrypted-secrets)

```yaml
on:
  issues:
    types: [opened]

jobs:
  apply-label:
    runs-on: ubuntu-latest
    steps:
      - uses: giovannicandido/github-action-clean-releases@main
        with:
          github-token: ${{ secrets.MY_PAT }}
```