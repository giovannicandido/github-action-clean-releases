import { DateTime } from "luxon";
import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { requestLog } from "@octokit/plugin-request-log";
process.on('unhandledRejection', handleError);
main().catch(handleError);
const DEFAULT_NUMBER_DAYS_TO_KEEP = 15;
async function deleteReleases(numberDaysToKeep, isPrerelease = true, owner, repo, github) {
    const { repository } = await github.graphql(`
			query($repo: String!, $owner: String!, $first: Int!) {
				repository(name: $repo, owner: $owner) {
					releases(first: $first, orderBy: {field: CREATED_AT, direction: DESC}) {
						nodes {
							isPrerelease
							name
							id
							publishedAt
							databaseId
							tag {
								id
								name
							}
						}
					}
				}
			}
		`, {
        owner: owner,
        repo: repo,
        first: 100
    });
    const now = DateTime.now();
    const releasesToDelete = repository.releases.nodes
        .map(r => {
        return {
            id: r.databaseId,
            publishedAt: DateTime.fromISO(r.publishedAt),
            name: r.name,
            isPrerelease: r.isPrerelease,
            tag: r.tag.name
        };
    })
        .filter(r => r.isPrerelease === isPrerelease)
        .filter(r => now.diff(r.publishedAt, "days").days > numberDaysToKeep);
    if (releasesToDelete.length === 0) {
        console.log('No releases to delete');
        return;
    }
    console.log(`Deleting releases with more than ${numberDaysToKeep} from ${now}`);
    for (let release of releasesToDelete) {
        console.log(`Deleting release ${release.id} ${release.name} released ${release.publishedAt}`);
        const deleteResponse = await github.rest.repos.deleteRelease({ owner: owner, repo: repo, release_id: release.id });
        console.log(`Release ${release.name} deleted`);
        await deleteTag(release.tag, owner, repo, github);
    }
}
async function deleteTag(tagName, owner, repo, github) {
    console.log(`Deleting tag ${tagName}`);
    const deleteResponse = await github.request(`DELETE /repos/{owner}/{repo}/git/refs/{ref}`, {
        owner: owner, repo: repo, ref: `tags/${tagName}`
    });
    console.log(`Tag ${tagName} deleted`);
}
async function main() {
    const token = core.getInput('github-token', { required: true });
    const debug = core.getBooleanInput('debug');
    const userAgent = core.getInput('user-agent');
    const previews = core.getInput('previews');
    let numberDaysToKeep = parseInt(core.getInput("numberDaysToKeep", { required: true, trimWhitespace: true }));
    let isPrerelease = core.getBooleanInput("isPrerelease", { required: true, trimWhitespace: true });
    if (!numberDaysToKeep) {
        numberDaysToKeep = DEFAULT_NUMBER_DAYS_TO_KEEP;
    }
    const opts = {
        log: debug ? console : undefined,
        userAgent: userAgent || undefined,
        previews: previews ? previews.split(',') : undefined,
    };
    const github = getOctokit(token, opts, requestLog);
    // Using property/value shorthand on `require` (e.g. `{require}`) causes compilation errors.
    const result = await deleteReleases(numberDaysToKeep, isPrerelease, context.repo.owner, context.repo.repo, github);
    let encoding = core.getInput('result-encoding');
    encoding = encoding ? encoding : 'json';
    let output;
    switch (encoding) {
        case 'json':
            output = JSON.stringify(result);
            break;
        case 'string':
            output = String(result);
            break;
        default:
            throw new Error('"result-encoding" must be either "string" or "json"');
    }
    core.setOutput('result', output);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleError(err) {
    console.error(err);
    core.setFailed(`Unhandled error: ${err}`);
}
