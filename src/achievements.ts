import { Octokit } from "@octokit/rest";
import * as dotenv from "dotenv";
import chalk from "chalk";

dotenv.config();

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error(chalk.red("❌  GITHUB_TOKEN not found in .env"));
  process.exit(1);
}
const octokit = new Octokit({ auth: token });

// Repository info – replace with your own if needed
const owner = "rahuljadhav77";
const repo = "achiever";

/** Helper: create a new branch from main */
async function createBranch(branch: string, base = "main") {
  const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${base}` });
  await octokit.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: ref.object.sha });
  console.log(chalk.green(`🌿 Created branch ${branch}`));
}

/** Helper: update a file on a branch */
async function updateFile(branch: string, path: string, newContent: string, message: string) {
  const { data: file } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
  const sha = (file as any).sha;
  const encoded = Buffer.from(newContent, "utf8").toString("base64");
  const { data: commit } = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: encoded,
    sha,
    branch,
  });
  console.log(chalk.blue(`📝 ${message}`));
  return commit.commit.sha;
}

/** Pull Shark – merge first two open PRs */
async function pullShark() {
  const { data: prs } = await octokit.pulls.list({ owner, repo, state: "open", per_page: 5 });
  if (prs.length < 2) {
    console.log(chalk.yellow("⚠️ Not enough open PRs for Pull Shark."));
    return;
  }
  for (let i = 0; i < 2; i++) {
    const pr = prs[i];
    await octokit.pulls.merge({ owner, repo, pull_number: pr.number, merge_method: "merge" });
    console.log(chalk.green(`🦈 Merged PR #${pr.number}: ${pr.title}`));
  }
}

/** Pair Extraordinaire – PR with Co‑author trailer and merge */
async function pairExtraordinaire() {
  const branch = "pair-extra-1";
  await createBranch(branch);

  const filePath = "README.md";
  const { data: cur } = await octokit.repos.getContent({ owner, repo, path: filePath, ref: branch });
  const old = Buffer.from((cur as any).content, "base64").toString();
  const newContent = old + "\n\nCo‑author contribution ✅";
  await updateFile(branch, filePath, newContent, "Add co‑author line");

  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: "Pair Extraordinaire – add co‑author",
    head: branch,
    base: "main",
    body: "Co‑authored‑by: Antigravity <antigravity@google.com>",
  });
  console.log(chalk.cyan(`🤝 PR #${pr.number} created`));

  await octokit.pulls.merge({ owner, repo, pull_number: pr.number, merge_method: "merge" });
  console.log(chalk.green(`🚀 YOLO‑merged PR #${pr.number}`));
}

/** Quickdraw – open & close issue quickly */
async function quickdraw() {
  const { data: issue } = await octokit.issues.create({
    owner,
    repo,
    title: "Quickdraw Achievement",
    body: "Automated issue for the Quickdraw badge.",
  });
  console.log(chalk.magenta(`⚡ Issue #${issue.number} created`));
  await new Promise(r => setTimeout(r, 2000)); // 2 s delay
  await octokit.issues.update({ owner, repo, issue_number: issue.number, state: "closed" });
  console.log(chalk.magenta(`✅ Issue #${issue.number} closed`));
}

/** YOLO – create a PR and merge instantly */
async function yoloMerge() {
  const branch = "yolo-branch";
  await createBranch(branch);
  const filePath = "README.md";
  const { data: cur } = await octokit.repos.getContent({ owner, repo, path: filePath, ref: branch });
  const old = Buffer.from((cur as any).content, "base64").toString();
  const newContent = old + "\n\nYOLO merge test";
  await updateFile(branch, filePath, newContent, "YOLO test commit");

  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: "YOLO Merge Test",
    head: branch,
    base: "main",
    body: "This PR will be merged instantly without review.",
  });
  console.log(chalk.yellow(`🚀 PR #${pr.number} opened for YOLO`));
  await octokit.pulls.merge({ owner, repo, pull_number: pr.number, merge_method: "merge" });
  console.log(chalk.green(`🚀 YOLO‑merged PR #${pr.number}`));
}

// ------------------------------------------------------------------
// Helper: create two dummy PRs so Pull Shark has something to merge
// ------------------------------------------------------------------
async function createDummyPRs() {
  for (let i = 1; i <= 2; i++) {
    const branch = `dummy-pr-${i}-${Date.now()}`;
    await createBranch(branch);

    // Update README with a dummy line
    const filePath = "README.md";
    // Get current content (if file exists)
    let old = "";
    try {
      const { data: cur } = await octokit.repos.getContent({ owner, repo, path: filePath, ref: branch });
      old = Buffer.from((cur as any).content, "base64").toString();
    } catch (e) {
      // If README does not exist yet, start empty
      old = "# Achiever\n\n";
    }
    const newContent = old + `\nDummy change ${i}`;
    await updateFile(branch, filePath, newContent, `Add dummy change ${i}`);

    // Open PR
    const title = `Dummy PR ${i}`;
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title,
      head: branch,
      base: "main",
      body: "Generated by automation for Pull Shark badge",
    });
    console.log(chalk.cyan(`🦈 Dummy PR #${pr.number} created`));
  }
}

/** CLI */
async function main() {
  const cmd = process.argv[2];
  switch (cmd) {
    case "pullshark":
      await pullShark();
      break;
    case "pair":
      await pairExtraordinaire();
      break;
    case "quickdraw":
      await quickdraw();
      break;
    case "yolo":
      await yoloMerge();
      break;
    case "all":
      await createDummyPRs();
    await pullShark();
      await pairExtraordinaire();
      await quickdraw();
      await yoloMerge();
      break;
    default:
      console.log(chalk.white("\nUsage: npx ts-node src/achievements.ts <command>\n"));
      console.log(chalk.white("Commands: pullshark | pair | quickdraw | yolo | all"));
  }
}

main().catch(e => { console.error(chalk.red("❌ Unexpected error:"), e); process.exit(1); });
