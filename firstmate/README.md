# FirstMate

A [Paseo](https://paseo.sh) plugin: talk to one agent, ship with a crew.

You talk to a single agent — the **first mate** — and it runs the crew for you. Every task goes to a
**worker**: its own Paseo agent, in its own git worktree, so parallel work on one repository never
collides. The first mate writes each worker's instructions, supervises it to the end, and brings you
finished pull requests, investigation findings, and only the decisions that are really yours. You are
the captain.

**FirstMate**, in the sidebar, opens a board of what you and the first mate are talking about, one
topic per task — Needs you, Working, Queued and Done — with the question a topic waits on you for, or
the last thing said about it. Open a topic to read and answer it; the conversation with the first mate
is one switch away. The sidebar row shows how many topics wait on you.

![A 30-second loop of FirstMate at work, recorded on an earlier version of the screen, zooming in on
each step: one message to the first mate asks
asks for a dark mode toggle and a speed-conversion fix in a small web app; two cards appear in Queued
and move to Working, each worker in its own worktree; one worker is watched live, its commands and edits
scrolling past; each card reaches Done with "Captain's call: land branch …" beside the first mate's
report; the message "land both" sends them to main, and the first mate's Bearings report, with both
cards marked landed, closes it out.](docs/demo.webp)

This is a Paseo-native take on [firstmate](https://github.com/kunchenguid/firstmate) by Kun Chen, by
way of [ABorakati/paseo-firstmate](https://github.com/ABorakati/paseo-firstmate). Where those run the
crew in terminal sessions and supervise it with shell scripts, this one uses nothing but Paseo: the
workers are ordinary Paseo agents you can open, read and type into like any other, in worktrees Paseo
manages, and Paseo itself tells the first mate when a worker finishes, fails or asks for permission.
There is nothing else to install.

## What you need

- Paseo **0.16 or newer**, on the daemon and on the device running the app. On Paseo 0.11 to 0.15,
  install the last release that supports them: `paseo plugin install npm:@gpambrozio/paseo-firstmate@0.4.2`.
- **Paseo's agent tools turned on.** They are how the first mate starts its workers and hears back from
  them, and Paseo ships with them off. The screen says so and turns them on with one press; it is the
  *Agent tools* switch in the FirstMate settings too.
- A capable model for the first mate. It spends its day reading records and deciding who does what,
  and a small model gets the tools wrong. Claude Sonnet or better, or a comparable Codex model, works.
- The `paseo` command on the daemon machine, which a Paseo install puts there. It is used to find the
  plugin's own files, to interrupt a worker from its FirstMate tab, and to name the first mate's project
  in Paseo's sidebar.

## Install

```bash
paseo plugin install npm:@gpambrozio/paseo-firstmate
```

To hack on it, clone the repository and run `paseo plugin install "$PWD"` from this folder after
`npm install` and `npm run typecheck`. Everything the plugin writes into the first mate's home — its
charter, the records it starts with, the home's icon — is in `templates/`, as the files it becomes;
`paseo plugin reload firstmate` puts a change to work.

## Getting started

1. Open **FirstMate** in the sidebar, pick the first mate's model, and press **Launch the first mate**.
   If you already started an agent for the job, adopt it from the list below the button instead.
2. Tell it about a project: "the web app is at ~/code/web — ship through pull requests". It keeps a
   registry, so you only say this once.
3. Ask for work: "fix the flaky login test and add dark mode". Two topics appear on the board, each
   with a worker in its own worktree. Minutes later:

   > PR ready for review, captain: https://github.com/you/web/pull/42 (fix the flaky login test - risk: low - CI green)

4. "Merge it." The first mate never merges without your word, unless you have told it a project may.

## Talking to the first mate

- **General chat**, the other side of the **Board** switch in the screen's header — Enter sends and
  Shift+Enter starts a new line, as in Paseo. It is your conversation with the first mate without the
  messages filed under a topic. **Open the first mate in Paseo**, in the **More** menu, shows the whole
  session, every tool call and its output. The chat follows new messages while you are at the bottom;
  scroll up to read, and the round button at the bottom brings you back. A file in the home that the
  first mate names in a reply is a link that opens it in the Files view.
- **How full its memory is** — the ring at the end of the chat's buttons shows how much of the first
  mate's context window is used, the way Paseo's own chat does: amber from 70%, red past 90%. Hover
  over it, or tap it on a phone, for the share and the token counts.
  **Compact** has it summarise its conversation to free room, as `/compact` does in Paseo. **Restart**
  starts a new first mate from scratch, with the same model and settings, after asking you. Both wait
  until the first mate is between turns. On a restart its records carry over, the old conversation stays in
  Paseo's history, and workers already running keep going — the new first mate checks on them
  regularly, since Paseo tells only the agent that started a worker when it finishes.
- **Questions it asks you** — which option, whether to go ahead, a plan to approve — appear in the
  chat as a form you answer there, the same as in the first mate's own tab. While the chat is not in
  view, a banner says the first mate is waiting, and its **Show** button opens the chat.
- **`/fm <message>`** in any composer sends the message to the first mate, from wherever you are.
- **`/bearings`** — where everything stands, in four sections: what needs your call, what landed,
  what is under way, and what is next. `/bearings file` also writes it to a dated report in the first
  mate's home; `/bearings include PRs` checks the live pull requests too.
- **`/ahoy`** — what happened since you last spoke, then every open decision, one at a time, with a
  recommendation.
- *Bearings* and *Ahoy* are also buttons above the chat, and *FirstMate: bearings* is in ⌘K.
- **Suggestions** — when the first mate has an idea of what you will want next ("Land web#42", "Review
  loop on web#42"), it is a button in the **Suggestions** view, which **More** in the header opens; the
  menu shows how many there are. Pressing one sends that request to the first mate right away, just as
  if you had typed it and pressed Send, and shows the general chat so you see it go out; anything you
  were typing stays in the message box. A suggestion too long to show whole gets a chevron that opens
  the full request below it, to read or copy, without sending it. The trash button beside a suggestion
  takes it off the list without sending it, and FirstMate remembers that: the first mate will not
  suggest it again, and the list hides it if it does. When something about it changes — a new pull
  request, say — the first mate can suggest it again in new words, and that shows.
- **Answering the captain's call** — a topic waiting on your decision ("merge web#42?") sits in *Needs
  you* and shows the first mate's likely answers to it as buttons under the question ("Merge", "Hold").
  Pressing one sends that answer to the first mate right away, filed under the topic. To answer in your
  own words, open the topic and use its reply box.

## The board

![The FirstMate screen: the header with the Board / General chat switch and the More menu, over four
columns across the window — Needs you, Working, Queued and Done. Each card has a title, its project
and a date; the cards in Needs you show their question in amber with the answer buttons under it, and
the cards in the other columns show one line of the last message.](docs/board.png)

The FirstMate screen opens on the board: every backlog item and every worker is a topic, in one of
four columns across the window.

- **Needs you** — a topic that waits on your decision, or whose worker is blocked, has failed or asks
  for a permission. Its card shows the question and the first mate's answer buttons.
- **Working** — a topic whose worker is at work, or at rest between turns.
- **Queued** — a topic that has not started.
- **Done** — the 10 newest finished topics, with a count of the older ones.

A card outside *Needs you* shows one line of the last thing said. A dot beside a title means there are
words you have not opened. On a phone the columns are one list, without *Done*.

The header has the **Board** / **General chat** switch, the **More** menu and the host's name. **More**
opens what you look at now and then, in the board's place: **Suggestions**, **Watches** and **Files**.
It also has **Open the first mate in Paseo**, **Refresh** and **FirstMate settings**. A back button
returns to the board from a topic or from one of those views. **General chat** has a dot when the
first mate has said something you have not had on screen, and the header says what the first mate is
doing when it is not idle. Problems show as banners under the
header: Paseo's agent tools switched off, a first mate that is gone, a charter that has changed.

Opening the screen counts as looking at the first mate: when it has finished a turn, its workspace in
Paseo's sidebar turns to done, as it would if you had opened the first mate itself. One waiting on
your permission stays flagged until you answer.

## Topics

Click a card to open its topic.

![An open topic: the messages on the left, each under who said it; below them the reply box, with a
line that says who gets the message; and the details panel on the right.](docs/topic.png)

- **The messages** are on the left, each with who said it, yours on the right. A topic without a worker
  shows what you and the first mate said about that backlog item. A topic with a worker shows that
  too, and what you and the worker said to each other, without the worker's tool calls.
- **The reply box** under them says who gets what you type: the topic's worker when it has one, else
  the first mate. A message to the first mate goes out as `[topic: <id>] …`, the first mate starts its
  reply with the same tag, and both are filed under the topic. They do not appear in the general chat.
  A tagged message about an item that is no longer on the board stays in the general chat with its tag.
  A message to a worker counts as coming from you, and the first mate is told what you said and what
  the worker answered.
- **A worker's questions and permission requests** appear at the end of the messages, and you answer
  them there, the same as in the worker's own tab.
- **The details** are on the right (behind **Details** on a phone): status, project, who the topic
  talks to, since when, links, what it waits for with its answer buttons, the first mate's notes and
  the backlog id. **Open agent in Paseo** shows the worker's whole session, every tool call included.

The messages filed under a topic are kept by the plugin on the daemon, the newest 200 per item.
Messages from before the tag existed are not filed. What you have read is shared by every device you
use.

## A worker's FirstMate tab

A worker's workspace and session in Paseo also get a **FirstMate** tab showing its card, with a box for
telling the first mate something about it. Press the card for its actions:

- **Open** — the worker's session in Paseo.
- **Steer** — a word straight to the worker. It counts as coming from you, and the first mate is told
  what you said and what the worker answered.
- **Interrupt** — stops the worker's current turn.
- **Relaunch** — asks the first mate for a fresh worker in the same worktree, with your note. The work
  on disk carries over; the conversation does not.
- **End** — archives the worker. Its workspace and worktree are left exactly as they are.

A card waiting on your decision also has the first mate's answer buttons, and an Answer box for your
own words.

## The first mate's home

The **Files** view — **More › Files** in the screen's header — shows everything in the home
and opens any text file for editing, with a preview for Markdown. Cmd/Ctrl+S saves on a desktop. The
first mate writes these files too, so a save never silently replaces its newer version: you are told
it changed, and choose to load theirs or overwrite it with yours.

The first mate lives in a directory of its own — by default inside Paseo's plugin data, or anywhere you
choose in the settings. It writes there and nowhere else; your projects are read-only to it, and every
change is a worker's job.

In Paseo's sidebar the first mate's project and workspace are called **FirstMate** rather than after
the folder, and the project shows FirstMate's ship, from `icon.svg` in the home — Paseo picks up a
project's icon from its folder. Rename either, replace the file, or upload an icon in the project's
settings, and your choice is kept.

- `AGENTS.md` — its charter: how it takes requests, briefs and supervises workers, and talks to you.
  Written from `data/charter.md` every time the plugin starts or the first mate is launched, so do not
  edit it here.
- `data/charter.md` — **the charter itself, yours to change.** It starts as FirstMate's own charter, and
  while you leave it alone, a new version of the plugin brings its improvements. Once you edit it, your
  version is kept; if FirstMate's charter changes after that, a banner tells you, **Compare** opens the
  new one beside yours (`data/charter.new.md`) and **Done** marks yours up to date. Saving it in the Files view
  rewrites `AGENTS.md` at once; the first mate reads it at its next session, or when you ask it to re-read
  its charter. The note at the top lists the `{{placeholders}}` filled in for you, notes between `<!--`
  and `-->` are left out, and an empty file goes back to FirstMate's charter.
- `data/captain.md` — **your standing orders.** Anything you write here outranks the charter (except
  its hard rules: it never writes to a project, never merges without your word, never throws away
  unlanded work). Never overwritten.
- `data/opening.md` — **the first thing a new first mate is told**, when you launch it and when you
  restart it. Change the words, the language, or what it should do before anything else; keep asking
  it to read `AGENTS.md` and take the helm, which is what makes it a first mate. Notes between `<!--`
  and `-->` are left out, a restart adds a note of its own after yours about the first mate before, and
  an empty file means FirstMate's own wording. Never overwritten.
- `data/projects.md` — the project registry, and how each one ships:
  - `direct-PR` — the worker opens a pull request ready for review;
  - `reviewed-PR` — the worker also reviews its own diff, runs the full test suite and waits for CI;
  - `local-only` — no remote; the worker leaves a clean branch, and the first mate lands it when you say.
  - `+yolo` after the mode lets the first mate merge green work on that project without asking.
- `data/backlog.md` — every task, in flight, queued and done. The board reads it.
- `data/suggestions.md` — what the first mate thinks you will want next, one per line as
  `- <label> :: <what to send>`. The first mate keeps it up to date; the Suggestions view turns it into
  buttons.
- `data/suggestions-dismissed.md` — the suggestions you removed from the list, the newest 50. The
  list hides any suggestion with the same words, and the first mate reads it before writing new ones.
  Delete a line to let that suggestion show again.
- `data/<task>/brief.md`, `data/<task>/report.md` — each worker's instructions, and an investigation's
  findings.
- `watches/` — scripts FirstMate runs on a schedule; see below.

Because all of it is on disk, a restart is a non-event: the first mate reads its records, checks them
against the live crew, and carries on.

## Watches

A **watch** is a small script in the home's `watches/` folder that FirstMate runs on a schedule, while
Paseo is running. When it prints nothing, nothing happens; when it prints something, all of it reaches
the first mate as one note, as soon as it is between turns — several at once arrive together, and the
chat shows them as one line naming the watches. FirstMate adds nothing to what a watch prints, so it
reaches the first mate as the script's own words: since the script is yours, what it says to do the
first mate takes as your instruction. A watch that passes on text from someone else — a pull request
comment, a web page — has to mark it as quoted, and the first mate treats what is marked that way as
news, not orders. `pr-watch` does, and says so.

FirstMate comes with one, **`pr-watch`**, which checks every five minutes on the pull requests in the
backlog — yours and those to other people's projects — and tells the first mate when one is merged or
closed, gets a review or a comment from someone else, or its checks go red or green. So a pull request
you merge on GitHub is cleaned up within minutes, and a maintainer's review reaches the worker without
you passing it on. It needs the `gh` command, logged in, and Node, on the machine Paseo runs on.

The **Watches** view — **More › Watches** in the screen's header — lists each watch with its schedule,
when it last ran and what came of it, and what it last said (press it to read it all). Its switch
turns a watch off or on without touching the script, and a watch's name opens the script in the Files
view. A watch that fails is reported to the first mate once, and shown in the list until it works
again.

To write your own, put an executable script in `watches/` with its schedule in a comment near the top,
crontab style, in the Mac's local time:

```sh
#!/bin/sh
# schedule: 0 9 * * 1-5
```

`watches/README.md` in the home has the details: the schedule syntax, and what a script is given to find
the home, the backlog, and a folder of its own to remember what it has already reported. Until you edit
`pr-watch`, a new version of FirstMate replaces it; once you have, yours is kept, and the list says when
FirstMate's has changed. The first mate adds or changes a watch only when you say so.

## Settings

**Settings › Plugins › FirstMate** — or *FirstMate settings* in the screen's **More** menu or in ⌘K.

- **First mate** — which agent it is, and *Release* to forget it (the agent keeps running).
- **Home directory** — where the first mate lives. It can be moved only while no first mate is aboard.
- **Crew model and mode** — what every worker runs, unless you tell the first mate otherwise for a
  task. "Let the first mate choose" gives workers its own model.
- **Agent tools** — Paseo's switch, described above.
- **Refresh every** — how often the board polls.
- **Hide in the chat** — leaves cross-daemon messages, messages from other agents, notices, watch
  output or tool calls out of the general chat.

## Limitations

- **Nothing is merged or thrown away without you.** Workers push their own branches and open pull
  requests, but merging needs your word (or `+yolo` on that project), and a worker's worktree is only
  cleaned up after its work has landed.
- **A worker you prompt by hand** in its own tab is not watched by anyone until the first mate next
  reviews the fleet (it keeps a half-hourly check while work is under way). Write to it from its
  topic's reply box instead, and the first mate hears about it.
- **The first mate's model, thinking and mode** are changed from its own tab in Paseo, not from the
  board.
- **Attachments** — images, files — go to the first mate from its own tab, not from the general chat.
- **A topic shows the latest of what you and its worker said**, not the whole history, and none of the
  worker's tool calls; the rest is in the worker's own session in Paseo.
- **The board has no Steer, Interrupt, Relaunch or End.** A topic's reply box writes to its worker; the
  other three are on the FirstMate tab in the worker's workspace and session.
- It does not reproduce firstmate's second mates, relay to X and Discord, away mode, or the
  `no-mistakes` pipeline (`reviewed-PR` stands in for the last).
- **Watches run only while Paseo does**, and a run missed while the Mac was asleep is not made up. After
  the plugin is reloaded, what a watch prints waits until any agent works or the screen is opened.
- The screen has not yet been checked on a phone.

## License

MIT — see [LICENSE](LICENSE).
